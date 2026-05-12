"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getMe,
  logout as logoutService,
} from "@/services/auth.service";

/* ───────────────── TYPES ───────────────── */

type UserRole =
  | "user"
  | "company_admin"
  | "super_admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string | null;
}

interface LoginPayload {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  login: (
    data: LoginPayload
  ) => void;

  logout: () => Promise<void>;
}

/* ───────────────── CONTEXT ───────────────── */

const AuthContext =
  createContext<AuthContextValue | null>(
    null
  );

/* ───────────────── PROVIDER ───────────────── */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  /* ───────────────── RESTORE SESSION ───────────────── */

  useEffect(() => {
    async function loadUser() {
      try {
        /*
          token desde localStorage
          o cookies
        */

        const token =
          localStorage.getItem(
            "access_token"
          ) ||
          document.cookie
            .split("; ")
            .find((row) =>
              row.startsWith(
                "access_token="
              )
            )
            ?.split("=")[1];

        if (!token) {
          setLoading(false);
          return;
        }

        /*
          Restaurar rápido desde localStorage
        */

        const storedUser =
          localStorage.getItem(
            "user"
          );

        if (storedUser) {
          setUser(
            JSON.parse(storedUser)
          );
        }

        /*
          Sincronizar con backend
        */

        const me =
          await getMe();

        setUser(me);

        localStorage.setItem(
          "user",
          JSON.stringify(me)
        );

        localStorage.setItem(
          "role",
          me.role
        );
      } catch (error) {
        console.error(error);

        /*
          limpiar localStorage
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

        /*
          limpiar cookies
        */

        document.cookie =
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        document.cookie =
          "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  /* ───────────────── LOGIN ───────────────── */

  function login(
    data: LoginPayload
  ) {
    /*
      localStorage
    */

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

    /*
      cookies para middleware
    */

    document.cookie =
      `access_token=${data.access_token}; path=/; SameSite=Lax`;

    document.cookie =
      `refresh_token=${data.refresh_token}; path=/; SameSite=Lax`;

    /*
      opcional:
      guardar role también
      por si JWT no trae role
    */

    document.cookie =
      `role=${data.user.role}; path=/; SameSite=Lax`;

    setUser(data.user);
  }

  /* ───────────────── LOGOUT ───────────────── */

  async function logout() {
    try {
      await logoutService();
    } catch (error) {
      console.error(error);
    } finally {
      /*
        limpiar localStorage
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

      /*
        limpiar cookies
      */

      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      document.cookie =
        "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      document.cookie =
        "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      setUser(null);

      window.location.href =
        "/login";
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated:
          !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ───────────────── HOOK ───────────────── */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}