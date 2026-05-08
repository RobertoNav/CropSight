"""Lightweight import + shape tests for the registry CLI.

We don't spin up an MLflow server here; the live registry interaction is
exercised end-to-end by ``python -m src.registry.register --crop ...`` against
a real tracking URI.
"""
from __future__ import annotations


def test_module_exports():
    from cropsight.CropSight.merged_ml.src.registry import register
    for fn in ("register_best", "promote", "main", "_find_best_run", "_model_name"):
        assert hasattr(register, fn), f"missing: {fn}"


def test_model_name_format():
    from cropsight.CropSight.merged_ml.src.registry.register import _model_name
    assert _model_name("tomato") == "cropsight-tomato"
    assert _model_name("grape")  == "cropsight-grape"


def test_supported_crops():
    from cropsight.CropSight.merged_ml.src.registry.register import CROPS
    assert CROPS == ["tomato", "potato", "corn", "grape"]


def test_cli_help_runs():
    """The CLI should at least parse --help without importing MLflow connection."""
    import subprocess, sys
    out = subprocess.run(
        [sys.executable, "-m", "src.registry.register", "--help"],
        capture_output=True, text=True, timeout=120,
        cwd=__file__.rsplit("/", 2)[0],   # ml/
    )
    assert out.returncode == 0, out.stderr
    assert "--crop" in out.stdout
    assert "--stage" in out.stdout
