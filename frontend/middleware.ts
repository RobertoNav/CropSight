import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/register/company",
  "/forgot-password",
  "/reset-password",
  "/403",
  "/404",
];

/* ───────────────── HELPERS ───────────────── */

function isPublic(
  pathname: string
): boolean {
  return (
    PUBLIC_PATHS.includes(
      pathname
    ) ||
    pathname.startsWith(
      "/_next"
    ) ||
    pathname.startsWith(
      "/favicon"
    ) ||
    pathname.match(
      /\.(png|jpg|jpeg|gif|svg|ico|webp|css|js)$/
    ) !== null
  );
}

function parseJwt(
  token: string
) {
  try {
    const payload =
      token.split(".")[1];

    if (!payload)
      return null;

    return JSON.parse(
      atob(payload)
    );
  } catch {
    return null;
  }
}

/* ───────────────── MIDDLEWARE ───────────────── */

export function middleware(
  request: NextRequest
) {
  const { pathname } =
    request.nextUrl;

  /*
    Auth pages
  */

  const isAuthPage =
    pathname === "/login" ||
    pathname ===
      "/register" ||
    pathname ===
      "/register/company";

  /*
    Public routes
  */

  if (
    isPublic(pathname) &&
    !isAuthPage
  ) {
    return NextResponse.next();
  }

  /*
    Read token
  */

  const token =
    request.cookies.get(
      "access_token"
    )?.value;

  /*
    No token
  */

  if (!token) {
    /*
      Allow auth pages
    */

    if (isAuthPage) {
      return NextResponse.next();
    }

    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    loginUrl.searchParams.set(
      "next",
      pathname
    );

    return NextResponse.redirect(
      loginUrl
    );
  }

  /*
    Decode JWT
  */

  const payload =
    parseJwt(token);

  /*
    Invalid token
  */

  if (!payload) {
    const response =
      NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );

    response.cookies.delete(
      "access_token"
    );

    response.cookies.delete(
      "refresh_token"
    );

    response.cookies.delete(
      "role"
    );

    return response;
  }

  /*
    Role
    fallback to cookie
  */

  const role =
    payload.role ||
    request.cookies.get(
      "role"
    )?.value;

  /*
    Redirect authenticated users
    away from auth pages
  */

  if (isAuthPage) {
    if (
      role ===
      "super_admin"
    ) {
      return NextResponse.redirect(
        new URL(
          "/admin",
          request.url
        )
      );
    }

    if (
      role ===
      "company_admin"
    ) {
      return NextResponse.redirect(
        new URL(
          "/company",
          request.url
        )
      );
    }

    return NextResponse.redirect(
      new URL(
        "/dashboard",
        request.url
      )
    );
  }

  /*
    Admin routes
  */

  if (
    pathname.startsWith(
      "/admin"
    )
  ) {
    if (
      role !==
      "super_admin"
    ) {
      return NextResponse.redirect(
        new URL(
          "/403",
          request.url
        )
      );
    }
  }

  /*
    Company routes
  */

  if (
    pathname.startsWith(
      "/company"
    )
  ) {
    if (
      role !==
        "company_admin" &&
      role !==
        "super_admin"
    ) {
      return NextResponse.redirect(
        new URL(
          "/403",
          request.url
        )
      );
    }
  }

  /*
    User routes
  */

  if (
    pathname.startsWith(
      "/dashboard"
    ) ||
    pathname.startsWith(
      "/predict"
    ) ||
    pathname.startsWith(
      "/predictions"
    ) ||
    pathname.startsWith(
      "/profile"
    )
  ) {
    if (
      ![
        "user",
        "company_admin",
        "super_admin",
      ].includes(role)
    ) {
      return NextResponse.redirect(
        new URL(
          "/403",
          request.url
        )
      );
    }
  }

  return NextResponse.next();
}

/* ───────────────── CONFIG ───────────────── */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};