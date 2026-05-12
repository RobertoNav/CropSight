"use client";

import {
  Suspense,
  useState,
} from "react";

import Link from "next/link";

import {
  useSearchParams,
} from "next/navigation";

import { Logo } from "@/components/ui/Logo";

export const dynamic =
  "force-dynamic";

function ResetPasswordContent() {
  const params =
    useSearchParams();

  const token =
    params.get("token") ??
    "";

  const [done, setDone] =
    useState(false);

  const [showPass, setShowPass] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <Logo />

          <div
            className="alert alert--error"
            style={{
              marginTop: "1rem",
            }}
          >
            Invalid or missing
            reset token.
          </div>

          <p className="auth-footer">
            <Link
              href="/forgot-password"
              className="link"
            >
              Request new link
            </Link>
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const fd = new FormData(
      e.currentTarget
    );

    const password = fd.get(
      "password"
    ) as string;

    const confirm = fd.get(
      "confirm"
    ) as string;

    if (
      password !== confirm
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    if (
      password.length < 8
    ) {
      setError(
        "Password must be at least 8 characters."
      );

      return;
    }

    setLoading(true);

    try {
      const res =
        await fetch(
          "/api/v1/auth/reset-password",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              {
                token,
                new_password:
                  password,
              }
            ),
          }
        );

      if (
        res.status !== 204 &&
        !res.ok
      ) {
        throw new Error(
          "Could not reset password"
        );
      }

      setDone(true);
    } catch (err: any) {
      setError(
        err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />

        {!done ? (
          <>
            <h1 className="auth-title">
              Set new password
            </h1>

            <form
              onSubmit={
                handleSubmit
              }
            >
              <div className="form-group">
                <label className="form-label">
                  New password
                </label>

                <div className="input-wrapper">
                  <input
                    className="form-input"
                    type={
                      showPass
                        ? "text"
                        : "password"
                    }
                    name="password"
                    required
                  />

                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() =>
                      setShowPass(
                        (
                          p
                        ) =>
                          !p
                      )
                    }
                  >
                    👁
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Confirm password
                </label>

                <input
                  className="form-input"
                  type="password"
                  name="confirm"
                  required
                />
              </div>

              {error && (
                <div className="alert alert--error">
                  {error}
                </div>
              )}

              <button
                className="btn btn--primary"
                type="submit"
                disabled={
                  loading
                }
              >
                {loading
                  ? "Saving..."
                  : "Set new password"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="auth-title">
              Password updated
            </h1>

            <Link
              href="/login"
              className="btn btn--primary"
            >
              Sign in now
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <div className="auth-card">
            Loading...
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}