import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

import type { AppUserRole } from "@/lib/auth/roles";
import { hasRequiredRole } from "@/lib/auth/roles";

const DASHBOARD_PREFIXES = [
  "/dashboard",
  "/clients",
  "/duties",
  "/notifications",
  "/settings",
  "/reports",
  "/admin",
  "/manager",
];

const ROLE_RULES: Array<{ pattern: RegExp; roles: AppUserRole[] }> = [
  { pattern: /^\/admin(\/|$)/, roles: ["ADMIN"] },
  { pattern: /^\/manager(\/|$)/, roles: ["ADMIN", "MANAGER"] },
];

function isDashboardRoute(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  return DASHBOARD_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function resolveRoleAccess(pathname: string): AppUserRole[] | null {
  const rule = ROLE_RULES.find((entry) => entry.pattern.test(pathname));
  return rule ? rule.roles : null;
}

const middleware = withAuth(
  function middlewareHandler(_req: NextRequestWithAuth) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        if (pathname.startsWith("/auth")) {
          return true;
        }

        if (!isDashboardRoute(pathname)) {
          return true;
        }

        if (!token) {
          return false;
        }

        const role = token.role as AppUserRole | undefined;

        const allowedRoles = resolveRoleAccess(pathname);
        if (allowedRoles) {
          return hasRequiredRole(role, allowedRoles);
        }

        return Boolean(role);
      },
    },
  }
);

export default middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
