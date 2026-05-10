export const API_URL = 'http://localhost:8000'
import axios from "axios";

import { env } from "./env";

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ─────────────────────────────────────────────
   REQUEST INTERCEPTOR
───────────────────────────────────────────── */

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/* ─────────────────────────────────────────────
   RESPONSE INTERCEPTOR
───────────────────────────────────────────── */

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    /*
      Token expirado
    */

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken =
          localStorage.getItem(
            "refresh_token"
          );

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        /*
          Pedir nuevo access token
        */

        const response = await axios.post(
          `${env.apiUrl}/auth/refresh`,
          {
            refresh_token: refreshToken,
          }
        );

        const newAccessToken =
          response.data.access_token;

        localStorage.setItem(
          "access_token",
          newAccessToken
        );

        /*
          Reintentar request original
        */

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        /*
          Logout forzado
        */

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "refresh_token"
        );

        localStorage.removeItem("user");

        if (
          typeof window !== "undefined"
        ) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);