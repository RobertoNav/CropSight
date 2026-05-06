"""
MLflow Model Registry — pick the best run per crop and register it.

Workflow per crop (matches Section 6.4 of the project plan):
    1. Find experiment ``cropsight-<crop>``.
    2. Pick the best finished run by ``test_f1`` (tie-breaker ``test_acc``).
    3. Register ``runs:/<run_id>/model`` as ``cropsight-<crop>`` in the
       Model Registry. New versions are stamped with the run id, run name
       and key metrics in their description.
    4. Transition the new version to ``Staging`` and archive any previous
       Staging version of the same model.

Usage:
    # one crop, default behaviour: pick best run, register, move to Staging
    python -m src.registry.register --crop tomato

    # all four crops at once
    python -m src.registry.register --crop all

    # don't move anything to Staging (just register)
    python -m src.registry.register --crop tomato --stage None

    # promote an already-registered version to Production
    python -m src.registry.register --promote --crop tomato --version 3 --stage Production
"""
from __future__ import annotations

# MLflow 2.9+ deprecated registry stages in favour of aliases. We still use
# stages because the project plan (Section 6.4) and the admin dashboard
# (POST /admin/models/:version/promote) reference ``transition_model_version_stage``
# directly. Silence the FutureWarning so CLI output stays readable.
import warnings
warnings.filterwarnings("ignore", category=FutureWarning)

import argparse
import os
import sys
from dataclasses import dataclass
from typing import Optional

import mlflow
from mlflow.tracking import MlflowClient


CROPS = ["tomato", "potato", "corn", "grape"]
PRIMARY_METRIC   = "test_f1"
SECONDARY_METRIC = "test_acc"


def _model_name(crop: str) -> str:
    return f"cropsight-{crop}"


def _experiment_name(crop: str) -> str:
    return f"cropsight-{crop}"


@dataclass
class BestRun:
    run_id: str
    run_name: str
    test_f1: float
    test_acc: float
    test_precision: Optional[float]
    test_recall: Optional[float]
    architecture: str
    lr: float
    epochs: int


def _find_best_run(client: MlflowClient, crop: str) -> BestRun:
    exp = client.get_experiment_by_name(_experiment_name(crop))
    if exp is None:
        raise RuntimeError(
            f"Experiment '{_experiment_name(crop)}' does not exist. "
            f"Run training for {crop!r} first."
        )

    runs = client.search_runs(
        experiment_ids=[exp.experiment_id],
        filter_string="attributes.status = 'FINISHED'",
        order_by=[f"metrics.{PRIMARY_METRIC} DESC", f"metrics.{SECONDARY_METRIC} DESC"],
        max_results=1,
    )
    if not runs:
        raise RuntimeError(
            f"No FINISHED runs in experiment '{_experiment_name(crop)}'."
        )
    r = runs[0]
    if PRIMARY_METRIC not in r.data.metrics:
        raise RuntimeError(
            f"Best run {r.info.run_id} has no '{PRIMARY_METRIC}' metric. "
            f"Did training complete the test evaluation?"
        )

    return BestRun(
        run_id=r.info.run_id,
        run_name=r.info.run_name or "",
        test_f1=float(r.data.metrics[PRIMARY_METRIC]),
        test_acc=float(r.data.metrics.get(SECONDARY_METRIC, 0.0)),
        test_precision=float(r.data.metrics["test_precision"]) if "test_precision" in r.data.metrics else None,
        test_recall=float(r.data.metrics["test_recall"])       if "test_recall"    in r.data.metrics else None,
        architecture=r.data.params.get("architecture", "?"),
        lr=float(r.data.params.get("lr", 0.0)),
        epochs=int(r.data.params.get("epochs", 0)),
    )


def _ensure_registered_model(client: MlflowClient, name: str, crop: str) -> None:
    try:
        client.create_registered_model(
            name,
            description=(
                f"CropSight disease classifier for {crop}. "
                f"EfficientNet-B0 (transfer learning). "
                f"Best run is selected by test_f1, tie-broken by test_acc."
            ),
            tags={"crop": crop, "framework": "pytorch", "owner": "ml-team"},
        )
        print(f"[registry] Created registered model '{name}'")
    except mlflow.exceptions.RestException as e:
        if "RESOURCE_ALREADY_EXISTS" in str(e):
            print(f"[registry] Registered model '{name}' already exists")
        else:
            raise


def _archive_existing_in_stage(client: MlflowClient, name: str, stage: str) -> None:
    """When promoting a new version, demote previous occupants of the target stage."""
    if stage in ("None", None):
        return
    try:
        existing = client.get_latest_versions(name, stages=[stage])
    except mlflow.exceptions.RestException:
        return
    for v in existing:
        client.transition_model_version_stage(
            name=name, version=v.version, stage="Archived",
            archive_existing_versions=False,
        )
        print(f"[registry] Archived previous {stage} version: {name} v{v.version}")


def register_best(client: MlflowClient, crop: str, stage: str = "Staging") -> int:
    """Pick the best run for ``crop`` and register it. Returns new version number."""
    name = _model_name(crop)
    best = _find_best_run(client, crop)

    print(
        f"[registry] {crop}: best run "
        f"id={best.run_id} f1={best.test_f1:.4f} acc={best.test_acc:.4f} "
        f"(arch={best.architecture}, lr={best.lr}, epochs={best.epochs})"
    )

    _ensure_registered_model(client, name, crop)

    # Register the model
    model_uri = f"runs:/{best.run_id}/model"
    mv = client.create_model_version(
        name=name,
        source=model_uri,
        run_id=best.run_id,
        description=(
            f"Run {best.run_name} ({best.run_id[:8]}). "
            f"test_f1={best.test_f1:.4f} test_acc={best.test_acc:.4f}. "
            f"arch={best.architecture}, lr={best.lr}, epochs={best.epochs}."
        ),
        tags={
            "crop": crop,
            "test_f1":  f"{best.test_f1:.4f}",
            "test_acc": f"{best.test_acc:.4f}",
        },
    )
    print(f"[registry] Created model version: {name} v{mv.version}")

    if stage and stage != "None":
        _archive_existing_in_stage(client, name, stage)
        client.transition_model_version_stage(
            name=name, version=mv.version, stage=stage,
            archive_existing_versions=False,
        )
        print(f"[registry] Transitioned {name} v{mv.version} -> {stage}")

    return int(mv.version)


def promote(client: MlflowClient, crop: str, version: int, stage: str) -> None:
    """Move an existing version to a new stage (used by admin dashboard)."""
    name = _model_name(crop)
    if stage not in ("None", "Staging", "Production", "Archived"):
        raise ValueError(f"Invalid stage: {stage}")
    if stage in ("Staging", "Production"):
        _archive_existing_in_stage(client, name, stage)
    client.transition_model_version_stage(
        name=name, version=version, stage=stage,
        archive_existing_versions=False,
    )
    print(f"[registry] {name} v{version} -> {stage}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--crop",   required=True, choices=CROPS + ["all"])
    p.add_argument("--stage",  default="Staging",
                   choices=["None", "Staging", "Production", "Archived"])
    p.add_argument("--promote", action="store_true",
                   help="Promote a specific version (requires --version).")
    p.add_argument("--version", type=int,
                   help="Model version to promote (only with --promote).")
    args = p.parse_args()

    tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "http://127.0.0.1:5000")
    mlflow.set_tracking_uri(tracking_uri)
    client = MlflowClient(tracking_uri=tracking_uri)
    print(f"[registry] tracking_uri={tracking_uri}")

    crops = CROPS if args.crop == "all" else [args.crop]

    if args.promote:
        if args.crop == "all" or args.version is None:
            print("--promote requires both --crop <name> and --version <n>", file=sys.stderr)
            sys.exit(2)
        promote(client, args.crop, args.version, args.stage)
        return

    failures = []
    for crop in crops:
        try:
            register_best(client, crop, stage=args.stage)
        except Exception as e:
            failures.append((crop, str(e)))
            print(f"[registry] FAILED for {crop}: {e}", file=sys.stderr)

    if failures:
        print(f"\n[registry] DONE with {len(failures)} failures: {[c for c,_ in failures]}")
        sys.exit(1)
    print("\n[registry] DONE — all crops registered")


if __name__ == "__main__":
    main()
