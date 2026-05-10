import { api } from "@/lib/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

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

export async function logout() {
  const refreshToken =
    localStorage.getItem(
      "refresh_token"
    );

  await api.post("/auth/logout", {
    refresh_token: refreshToken,
  });

  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

  localStorage.removeItem("user");

  localStorage.removeItem("role");
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

export async function updateProfile(
  payload: {
    name: string;
  }
) {
  const { data } =
    await api.patch(
      "/users/profile",
      payload
    );

  return data;
}

export async function changePassword(
  payload: {
    current_password: string;
    new_password: string;
  }
) {
  const { data } =
    await api.patch(
      "/users/password",
      payload
    );

  return data;
}