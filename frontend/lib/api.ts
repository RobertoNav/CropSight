import axios from "axios";

/*
  IMPORTANT:
  usamos proxy interno de Next.js

  frontend:
  https://amplifyapp.com/api/v1/...

  next rewrite ->
  http://backend-alb/api/v1/...
*/

export const API_URL =
  "/api/v1";

export const api =
  axios.create({
    baseURL: API_URL,

    headers: {
      "Content-Type":
        "application/json",
    },
  });

/* ─────────────────────────────────────────────
   REQUEST INTERCEPTOR
───────────────────────────────────────────── */

api.interceptors.request.use(
  (config) => {
    /*
      localStorage solo client-side
    */

    if (
      typeof window !==
      "undefined"
    ) {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (token) {
        config.headers.Authorization =
          `Bearer ${token}`;
      }
    }

    return config;
  }
);

/* ─────────────────────────────────────────────
   RESPONSE INTERCEPTOR
───────────────────────────────────────────── */

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest =
      error.config;

    /*
      token expirado
    */

    if (
      error.response
        ?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry =
        true;

      try {
        const refreshToken =
          localStorage.getItem(
            "refresh_token"
          );

        if (!refreshToken) {
          throw new Error(
            "No refresh token"
          );
        }

        /*
          pedir nuevo token
        */

        const response =
          await axios.post(
            `${API_URL}/auth/refresh`,
            {
              refresh_token:
                refreshToken,
            }
          );

        const newAccessToken =
          response.data
            .access_token;

        /*
          guardar nuevo token
        */

        localStorage.setItem(
          "access_token",
          newAccessToken
        );

        /*
          actualizar header
        */

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        /*
          retry request
        */

        return api(
          originalRequest
        );
      } catch (
        refreshError
      ) {
        /*
          logout forzado
        */

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

        if (
          typeof window !==
          "undefined"
        ) {
          window.location.href =
            "/login";
        }

        return Promise.reject(
          refreshError
        );
      }
    }

    return Promise.reject(
      error
    );
  }
);
