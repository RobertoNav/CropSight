import { api } from "@/lib/api";

/* ───────────────── MODELS ───────────────── */
/*
  ⛔ Aún NO existen en backend
  Dejamos placeholders para después
*/

export async function getModels() {
  const { data } = await api.get(
    "/admin/models"
  );

  return data;
}

export async function getModelByVersion(
  version: string
) {
  const { data } = await api.get(
    `/admin/models/${version}`
  );

  return data;
}

export async function promoteModel(
  version: string
) {
  const { data } = await api.post(
    `/admin/models/${version}/promote`
  );

  return data;
}

export async function rollbackModel(
  version: string
) {
  const { data } = await api.post(
    `/admin/models/${version}/rollback`
  );

  return data;
}

/* ───────────────── METRICS ───────────────── */

export async function getUsageMetrics(
  params?: {
    from?: string;
    to?: string;
  }
) {
  const { data } = await api.get(
    "/admin/metrics/usage",
    {
      params,
    }
  );

  return data;
}

export async function exportUsageMetrics(
  params?: {
    from?: string;
    to?: string;
  }
) {
  const response = await api.get(
    "/admin/metrics/usage/export",
    {
      params,
      responseType: "blob",
    }
  );

  return response.data;
}

export async function getModelMetrics(
  model_version?: string
) {
  const { data } = await api.get(
    "/admin/metrics/model",
    {
      params: {
        model_version,
      },
    }
  );

  return data;
}

export async function getDriftMetrics() {
  const { data } = await api.get(
    "/admin/metrics/drift"
  );

  return data;
}

/* ───────────────── RETRAINING ───────────────── */

export async function triggerRetraining(
  notes?: string
) {
  const { data } = await api.post(
    "/admin/retraining/",
    {
      notes,
    }
  );

  return data;
}

export async function getRetrainingJobs() {
  const { data } = await api.get(
    "/admin/retraining/"
  );

  return data;
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
  const { data } = await api.get(
    "/users/",
    {
      params,
    }
  );

  return data;
}

export async function getUserById(
  id: string
) {
  const { data } = await api.get(
    `/users/${id}`
  );

  return data;
}

export async function updateUserStatus(
  id: string,
  is_active: boolean
) {
  const { data } = await api.put(
    `/users/${id}/status`,
    {
      is_active,
    }
  );

  return data;
}

export async function deleteUser(
  id: string
) {
  const { data } = await api.delete(
    `/users/${id}`
  );

  return data;
}