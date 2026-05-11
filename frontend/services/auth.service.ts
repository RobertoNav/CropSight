import { api } from "@/lib/api";

/* ───────────────── TYPES ───────────────── */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/* ───────────────── AUTH ───────────────── */

export async function login(
  payload: LoginPayload
) {
  const { data } = await api.post(
    "/auth/login",
    payload
  );

  localStorage.setItem(
    "access_token",
    data.access_token
  );

  localStorage.setItem(
    "refresh_token",
    data.refresh_token
  );

  localStorage.setItem(
    "user",
    JSON.stringify(data.user)
  );

  localStorage.setItem(
    "role",
    data.user.role
  );

  return data;
}

export async function register(
  payload: RegisterPayload
) {
  const { data } = await api.post(
    "/auth/register",
    payload
  );

  return data;
}

export async function getMe() {
  const { data } = await api.get(
    "/auth/me"
  );

  return data;
}

export async function refreshToken() {
  const refresh_token =
    localStorage.getItem(
      "refresh_token"
    );

  const { data } = await api.post(
    "/auth/refresh",
    {
      refresh_token,
    }
  );

  return data;
}

export async function logout() {
  try {
    const refresh_token =
      localStorage.getItem(
        "refresh_token"
      );

    if (refresh_token) {
      await api.post(
        "/auth/logout",
        {
          refresh_token,
        }
      );
    }
  } catch (error) {
    console.error(error);
  } finally {
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "role"
    );

    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export async function forgotPassword(
  email: string
) {
  await api.post(
    "/auth/forgot-password",
    {
      email,
    }
  );
}

export async function resetPassword(
  payload: {
    token: string;
    password: string;
  }
) {
  const { data } = await api.post(
    "/auth/reset-password",
    payload
  );

  return data;
}

/* ───────────────── USERS ───────────────── */

export async function getMyProfile() {
  const { data } = await api.get(
    "/users/me"
  );

  return data;
}

export async function updateProfile(
  payload: {
    name?: string;
    email?: string;
    password?: string;
  }
) {
  const { data } = await api.put(
    "/users/me",
    payload
  );

  return data;
}

export async function getUsers() {
  const { data } = await api.get(
    "/users/"
  );

  return data;
}

export async function getUserById(
  userId: string
) {
  const { data } = await api.get(
    `/users/${userId}`
  );

  return data;
}

export async function deleteUser(
  userId: string
) {
  const { data } = await api.delete(
    `/users/${userId}`
  );

  return data;
}

export async function updateUserStatus(
  userId: string,
  is_active: boolean
) {
  const { data } = await api.put(
    `/users/${userId}/status`,
    {
      is_active,
    }
  );

  return data;
}