import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/index.html",

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

    pathname ===
      "/index.html" ||

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
    AUTH PAGES
  */

  const isAuthPage =
    pathname === "/login" ||
    pathname ===
      "/register" ||
    pathname ===
      "/register/company";

  /*
    ALLOW PUBLIC ROUTES
  */

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  /*
    TOKEN
  */

  const token =
    request.cookies.get(
      "access_token"
    )?.value;

  /*
    NO TOKEN
  */

  if (!token) {
    /*
      allow auth pages
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
    DECODE JWT
  */

  const payload =
    parseJwt(token);

  /*
    INVALID TOKEN
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
    ROLE
  */

  const role =
    payload.role ||
    request.cookies.get(
      "role"
    )?.value;

  /*
    REDIRECT AUTH USERS
    AWAY FROM LOGIN/REGISTER
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
    ADMIN ROUTES
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
    COMPANY ROUTES
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
    USER ROUTES
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