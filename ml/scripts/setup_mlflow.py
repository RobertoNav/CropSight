import os
import sys
import time

import mlflow
from mlflow.tracking import MlflowClient

TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000")
CROPS = ["tomato", "potato", "corn", "grape"]

S3_BUCKET = os.getenv("S3_BUCKET", "")


def wait_for_server(client: MlflowClient, retries: int = 12, delay: float = 5.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            client.search_experiments()
            print(f"MLflow server reachable at {TRACKING_URI}")
            return
        except Exception:
            print(f"Waiting for MLflow server... ({attempt}/{retries})")
            time.sleep(delay)
    print("ERROR: MLflow server did not become available. Check docker compose logs.")
    sys.exit(1)


def main() -> None:
    mlflow.set_tracking_uri(TRACKING_URI)
    client = MlflowClient()

    wait_for_server(client)

    for crop in CROPS:
        name = f"cropsight-{crop}"
        existing = client.get_experiment_by_name(name)
        if existing is not None:
            print(f"  [skip] experiment '{name}' already exists (id={existing.experiment_id})")
            continue

        kwargs: dict = {"tags": {"crop": crop, "project": "CropSight"}}
        if S3_BUCKET:
            kwargs["artifact_location"] = f"s3://{S3_BUCKET}/mlflow-artifacts/{name}"

        exp_id = client.create_experiment(name, **kwargs)
        print(f"  [ok]   created experiment '{name}' (id={exp_id})")

    print("\nDone. All 4 experiments are ready.")


if __name__ == "__main__":
    main()
