from typing import Optional
import httpx
from app.config import settings


GITHUB_API = "https://api.github.com"
STATUS_MAP = {
    "queued": "running",
    "in_progress": "running",
}


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
        Retorna el run_id del workflow iniciado.
        """
        url = f"{GITHUB_API}/repos/{self.repo}/actions/workflows/{self.workflow_id}/dispatches"
        payload = {
            "ref": "main",
            "inputs": {"notes": notes or ""},
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers, timeout=15)
            response.raise_for_status()

        # Obtener el run_id del workflow recién iniciado
        runs_url = f"{GITHUB_API}/repos/{self.repo}/actions/workflows/{self.workflow_id}/runs"
        async with httpx.AsyncClient() as client:
            runs = await client.get(runs_url, headers=self.headers, timeout=15)
            data = runs.json()
            if data.get("workflow_runs"):
                return str(data["workflow_runs"][0]["id"])
        return None

    async def get_run_status(self, run_id: str) -> str:
        """Consulta el estado actual de un workflow run. Retorna nuestro enum interno."""
        url = f"{GITHUB_API}/repos/{self.repo}/actions/runs/{run_id}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            data = response.json()

        gh_status = data.get("status", "")
        conclusion = data.get("conclusion")

        if gh_status in ("queued", "in_progress"):
            return "running"
        if gh_status == "completed":
            return "success" if conclusion == "success" else "failed"
        return "pending"
