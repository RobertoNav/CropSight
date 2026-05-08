import asyncio
from typing import Optional

import httpx

from app.config import settings


GITHUB_API = "https://api.github.com"
GITHUB_TIMEOUT = 15.0
WORKFLOW_REF = "main"
RUN_LOOKUP_ATTEMPTS = 5
RUN_LOOKUP_DELAY_SECONDS = 1


class GitHubService:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        self.repo = settings.github_repo
        self.workflow_id = settings.github_workflow_id

    async def trigger_workflow(self, notes: Optional[str] = None) -> Optional[str]:
        """
        Dispara el workflow de retraining en GitHub Actions.
        Retorna el run_id del workflow iniciado cuando GitHub lo expone.
        """
        latest_run_id = await self._get_latest_workflow_run_id()
        url = self._workflow_url("dispatches")
        payload = {
            "ref": WORKFLOW_REF,
            "inputs": {"notes": notes or ""},
        }

        async with httpx.AsyncClient(timeout=GITHUB_TIMEOUT) as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()

        return await self._wait_for_new_workflow_run(latest_run_id)

    async def get_run_status(self, run_id: str) -> str:
        """Consulta el estado actual de un workflow run. Retorna nuestro enum interno."""
        url = f"{GITHUB_API}/repos/{self.repo}/actions/runs/{run_id}"
        async with httpx.AsyncClient(timeout=GITHUB_TIMEOUT) as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()

        return self._map_run_status(
            github_status=data.get("status"),
            conclusion=data.get("conclusion"),
        )

    async def _wait_for_new_workflow_run(
        self,
        previous_latest_run_id: Optional[int],
    ) -> Optional[str]:
        for _ in range(RUN_LOOKUP_ATTEMPTS):
            latest_run_id = await self._get_latest_workflow_run_id()
            if latest_run_id and latest_run_id != previous_latest_run_id:
                return str(latest_run_id)
            await asyncio.sleep(RUN_LOOKUP_DELAY_SECONDS)
        return None

    async def _get_latest_workflow_run_id(self) -> Optional[int]:
        url = self._workflow_url("runs")
        params = {
            "branch": WORKFLOW_REF,
            "event": "workflow_dispatch",
            "per_page": 1,
        }
        async with httpx.AsyncClient(timeout=GITHUB_TIMEOUT) as client:
            response = await client.get(url, params=params, headers=self.headers)
            response.raise_for_status()
            data = response.json()

        workflow_runs = data.get("workflow_runs") or []
        if not workflow_runs:
            return None

        return int(workflow_runs[0]["id"])

    def _workflow_url(self, suffix: str) -> str:
        return (
            f"{GITHUB_API}/repos/{self.repo}/actions/workflows/"
            f"{self.workflow_id}/{suffix}"
        )

    def _map_run_status(
        self,
        github_status: Optional[str],
        conclusion: Optional[str],
    ) -> str:
        if github_status in ("queued", "waiting", "requested"):
            return "pending"
        if github_status in ("in_progress", "pending"):
            return "running"
        if github_status == "completed":
            return "success" if conclusion == "success" else "failed"
        return "pending"
