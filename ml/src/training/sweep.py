"""
Hyperparameter sweep — runs at least 3 training configurations per crop so
the MLflow comparison view has something meaningful to show.

Each configuration is launched as an independent subprocess of
``python -m src.training.train`` so PyTorch / MLflow / CUDA state never
leaks between runs.

Usage:
    # one crop
    python -m src.training.sweep \
        --crop tomato \
        --data_dir   data/processed/tomato \
        --heldout_dir data/heldout/tomato

    # all four crops, sequentially (data_dir / heldout_dir become parent dirs)
    python -m src.training.sweep \
        --crop all \
        --data_dir   data/processed \
        --heldout_dir data/heldout
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path


CROPS = ["tomato", "potato", "corn", "pepper"]


@dataclass(frozen=True)
class SweepConfig:
    lr: float
    epochs: int
    batch_size: int
    weight_decay: float = 1e-4

    def cli(self, crop: str, data_dir: str, heldout_dir: str) -> list[str]:
        return [
            sys.executable, "-m", "src.training.train",
            "--crop",         crop,
            "--data_dir",     data_dir,
            "--heldout_dir",  heldout_dir,
            "--epochs",       str(self.epochs),
            "--lr",           str(self.lr),
            "--batch_size",   str(self.batch_size),
            "--weight_decay", str(self.weight_decay),
        ]


# Three configurations per crop. Different learning rates produce visibly
# different curves in the comparison view; epochs are tuned per crop size so
# we always converge but never burn compute on tiny datasets.
DEFAULT_SWEEP: dict[str, list[SweepConfig]] = {
    "tomato": [
        SweepConfig(lr=1e-3, epochs=8, batch_size=64),
        SweepConfig(lr=1e-4, epochs=8, batch_size=64),
        SweepConfig(lr=5e-5, epochs=8, batch_size=64),
    ],
    "potato": [
        SweepConfig(lr=1e-3, epochs=10, batch_size=32),
        SweepConfig(lr=1e-4, epochs=10, batch_size=32),
        SweepConfig(lr=5e-5, epochs=10, batch_size=32),
    ],
    "corn": [
        SweepConfig(lr=1e-3, epochs=10, batch_size=32),
        SweepConfig(lr=1e-4, epochs=10, batch_size=32),
        SweepConfig(lr=5e-5, epochs=10, batch_size=32),
    ],
    "pepper": [
        SweepConfig(lr=1e-3, epochs=10, batch_size=32),
        SweepConfig(lr=1e-4, epochs=10, batch_size=32),
        SweepConfig(lr=5e-5, epochs=10, batch_size=32),
    ],
}


def _resolve_dirs(crop: str, data_dir: str, heldout_dir: str, multi: bool) -> tuple[str, str]:
    """When the sweep is run per-crop, ``data_dir``/``heldout_dir`` already
    point at the per-crop folder. When ``--crop all`` is used they are parent
    dirs and we append the crop name."""
    if multi:
        return str(Path(data_dir) / crop), str(Path(heldout_dir) / crop)
    return data_dir, heldout_dir


def run_sweep(crop: str, data_dir: str, heldout_dir: str, configs: list[SweepConfig]) -> int:
    print(f"\n{'=' * 70}\n[sweep] crop={crop}  configs={len(configs)}\n{'=' * 70}")
    failures = 0
    for i, cfg in enumerate(configs, 1):
        cmd = cfg.cli(crop, data_dir, heldout_dir)
        print(f"\n[sweep] {crop} run {i}/{len(configs)}: lr={cfg.lr} bs={cfg.batch_size} ep={cfg.epochs}")
        print(f"[sweep] $ {' '.join(cmd)}")
        t0 = time.time()
        rc = subprocess.call(cmd, env=os.environ.copy())
        dt = time.time() - t0
        if rc != 0:
            failures += 1
            print(f"[sweep] FAILED  crop={crop} run={i} rc={rc} dt={dt:.0f}s")
        else:
            print(f"[sweep] OK      crop={crop} run={i} dt={dt:.0f}s")
    return failures


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--crop",         required=True, choices=CROPS + ["all"])
    p.add_argument("--data_dir",     required=True,
                   help="Training pool. Per-crop folder when --crop=<name>, "
                        "parent folder when --crop=all.")
    p.add_argument("--heldout_dir",  required=True,
                   help="Held-out test pool, in the same per-crop / parent shape as --data_dir.")
    args = p.parse_args()

    multi = args.crop == "all"
    crops = CROPS if multi else [args.crop]

    total_failures = 0
    for crop in crops:
        data_dir, heldout_dir = _resolve_dirs(crop, args.data_dir, args.heldout_dir, multi)
        total_failures += run_sweep(crop, data_dir, heldout_dir, DEFAULT_SWEEP[crop])

    if total_failures:
        print(f"\n[sweep] DONE with {total_failures} failed run(s)")
        sys.exit(1)
    print("\n[sweep] DONE — all runs succeeded")


if __name__ == "__main__":
    main()
