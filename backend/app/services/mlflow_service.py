from typing import List, Optional
import mlflow
from mlflow.tracking import MlflowClient
from app.config import settings


class MLflowService:
    def __init__(self):
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        self.client = MlflowClient()
        self.model_name = settings.mlflow_model_name

    def list_versions(self) -> List[dict]:
        """Retorna todas las versiones del modelo registrado."""
        versions = self.client.search_model_versions(f"name='{self.model_name}'")
        return [self._version_to_dict(v) for v in versions]

    def get_version_detail(self, version: str) -> dict:
        """Retorna detalle completo de una versión incluyendo métricas del run."""
        mv = self.client.get_model_version(self.model_name, version)
        run = self.client.get_run(mv.run_id)
        result = self._version_to_dict(mv)
        result.update({
            "accuracy": run.data.metrics.get("accuracy"),
            "f1_score": run.data.metrics.get("f1_score"),
            "precision": run.data.metrics.get("precision"),
            "recall": run.data.metrics.get("recall"),
            "dataset_version": run.data.params.get("dataset_version"),
        })
        return result

    def promote_to_production(self, version: str) -> dict:
        """Archiva la versión actual en Production y promueve la especificada."""
        current = self._get_production_version()
        if current and current != version:
            self.client.transition_model_version_stage(
                name=self.model_name, version=current, stage="Archived"
            )
        self.client.transition_model_version_stage(
            name=self.model_name, version=version, stage="Production"
        )
        return self.get_version_detail(version)

    def rollback(self, version: str) -> dict:
        """Revierte a la versión especificada como Production."""
        return self.promote_to_production(version)

    def _get_production_version(self) -> Optional[str]:
        versions = self.client.get_latest_versions(self.model_name, stages=["Production"])
        return versions[0].version if versions else None

    def _version_to_dict(self, mv) -> dict:
        return {
            "version": mv.version,
            "stage": mv.current_stage,
            "run_id": mv.run_id,
            "created_at": mv.creation_timestamp,
        }
