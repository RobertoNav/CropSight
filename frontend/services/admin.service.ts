import { api } from "@/lib/api";

/* ───────────────── TYPES ───────────────── */

export interface UsageMetrics {
  total_predictions: number;

  feedback_rate: number;

  active_users: number;

  active_companies: number;

  predictions_by_day: {
    date: string;
    count: number;
  }[];
}

export interface ModelMetrics {
  accuracy?: number;

  precision?: number;

  recall?: number;

  f1_score?: number;

  model_version?: string;

  evaluated_at?: string;
}

export interface DriftMetrics {
  drift_score?: number;

  threshold?: number;

  status?: string;

  generated_at?: string;
}

export interface RetrainingJob {
  id: string;

  status:
    | "pending"
    | "running"
    | "completed"
    | "failed";

  notes?: string;

  created_at: string | null;

  started_at: string | null;

  completed_at?: string | null;
}

/* ───────────────── METRICS ───────────────── */

export async function getUsageMetrics(
  params?: {
    from?: string;
    to?: string;
  }
): Promise<UsageMetrics> {
  const response =
    await api.get(
      "/admin/metrics/usage",
      {
        params,
      }
    );

  return response.data;
}

export async function exportUsageMetrics(
  params?: {
    from?: string;
    to?: string;
  }
): Promise<Blob> {
  const response =
    await api.get(
      "/admin/metrics/usage/export",
      {
        params,

        responseType:
          "blob",
      }
    );

  return response.data;
}

export async function exportMetricsCsv(): Promise<Blob> {
  const response =
    await api.get(
      "/admin/metrics/export",
      {
        responseType:
          "blob",
      }
    );

  return response.data;
}

export async function getModelMetrics(
  model_version?: string
): Promise<ModelMetrics> {
  const response =
    await api.get(
      "/admin/metrics/model",
      {
        params: {
          model_version,
        },
      }
    );

  return response.data;
}

export async function getDriftMetrics(): Promise<DriftMetrics> {
  const response =
    await api.get(
      "/admin/metrics/drift"
    );

  return response.data;
}

/* ───────────────── RETRAINING ───────────────── */

export async function triggerRetraining(
  notes?: string
): Promise<RetrainingJob> {
  const response =
    await api.post(
      "/admin/retraining/",
      {
        notes,
      }
    );

  return response.data;
}

export async function getRetrainingJobs(): Promise<
  RetrainingJob[]
> {
  const response =
    await api.get(
      "/admin/retraining/"
    );

  /*
    algunos backends regresan:
    { data: [...] }

    otros:
    [...]
  */

  return (
    response.data?.data ||
    response.data ||
    []
  );
}

/* ───────────────── USERS ───────────────── */

export async function getUsers(params?: {
  page?: number;

  limit?: number;

  search?: string;

  role?:
    | "user"
    | "company_admin"
    | "super_admin";

  company_id?: string;
}) {
  const response =
    await api.get(
      "/users/",
      {
        params,
      }
    );

  return response.data;
}

export async function getUserById(
  id: string
) {
  const response =
    await api.get(
      `/users/${id}`
    );

  return response.data;
}

export async function updateUserStatus(
  id: string,
  is_active: boolean
) {
  const response =
    await api.put(
      `/users/${id}/status`,
      {
        is_active,
      }
    );

  return response.data;
}

export async function deleteUser(
  id: string
) {
  const response =
    await api.delete(
      `/users/${id}`
    );

  return response.data;
}

/* ───────────────── IMPORTANT ───────────────── */
/*
  ❌ ELIMINADOS porque NO existen
  en backend todavía:

  - /admin/models
  - /admin/models/:version
  - /promote
  - /rollback

  Si los dejas y algún componente
  los llama -> 404.
*/