import { api } from "@/lib/api";

/* ───────────────── TYPES ───────────────── */

export interface Company {
  id: string;
  name: string;
  sector: string;
  logo_url: string | null;
  status: "active" | "suspended";
  created_at?: string;
}

export interface CompanyListResponse {
  data: Company[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages?: number;
  };
}

export interface JoinRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  company_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at: string | null;
}

export interface CompanyUser {
  id: string;
  name: string;
  email: string;

  role:
    | "user"
    | "company_admin"
    | "super_admin";

  company_id: string | null;

  is_active: boolean;

  created_at: string;
}

/* ───────────────── GET COMPANIES ───────────────── */

export async function getCompanies(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "suspended";
}): Promise<CompanyListResponse> {
  const { data } = await api.get(
    "/companies",
    {
      params,
    }
  );

  return data;
}

/* ───────────────── GET COMPANY BY ID ───────────────── */

export async function getCompanyById(
  companyId: string
): Promise<Company> {
  const { data } = await api.get(
    `/companies/${companyId}`
  );

  return data;
}

/* ───────────────── CREATE COMPANY ───────────────── */

export async function createCompany(payload: {
  name: string;
  sector: string;
  logo_url?: string | null;
}): Promise<Company> {
  const { data } = await api.post(
    "/companies",
    payload
  );

  return data;
}

/* ───────────────── UPDATE COMPANY ───────────────── */

export async function updateCompany(
  companyId: string,
  payload: {
    name?: string;
    sector?: string;
    logo_url?: string | null;
  }
): Promise<Company> {
  const { data } = await api.put(
    `/companies/${companyId}`,
    payload
  );

  return data;
}

/* ───────────────── SEARCH COMPANIES ───────────────── */

export async function searchCompanies(
  query: string
): Promise<Company[]> {
  const { data } = await api.get(
    "/companies/search",
    {
      params: {
        query,
      },
    }
  );

  return data;
}

/* ───────────────── JOIN COMPANY ───────────────── */

export async function joinCompany(
  companyId: string
): Promise<JoinRequest> {
  const { data } = await api.post(
    "/companies/join",
    {
      company_id: companyId,
    }
  );

  return data;
}

/* ───────────────── GET JOIN REQUESTS ───────────────── */

export async function getJoinRequests(
  companyId: string,
  status?: "pending" | "approved" | "rejected"
): Promise<JoinRequest[]> {
  const { data } = await api.get(
    `/companies/${companyId}/requests`,
    {
      params: {
        status,
      },
    }
  );

  return data;
}

/* ───────────────── RESOLVE JOIN REQUEST ───────────────── */

export async function resolveJoinRequest(
  companyId: string,
  requestId: string,
  action: "approve" | "reject"
): Promise<JoinRequest> {
  const { data } = await api.put(
    `/companies/${companyId}/requests/${requestId}`,
    {
      action,
    }
  );

  return data;
}

/* ───────────────── COMPANY USERS ───────────────── */

export async function getCompanyUsers(
  companyId: string
): Promise<CompanyUser[]> {
  const { data } = await api.get(
    `/companies/${companyId}/users`
  );

  return data;
}

export async function removeCompanyUser(
  companyId: string,
  userId: string
): Promise<void> {
  await api.delete(
    `/companies/${companyId}/users/${userId}`
  );
}

/* ───────────────── UPDATE COMPANY STATUS ───────────────── */

export async function updateCompanyStatus(
  companyId: string,
  status: "active" | "suspended"
): Promise<Company> {
  const { data } = await api.put(
    `/companies/${companyId}/status`,
    {
      status,
    }
  );

  return data;
}