"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";

import type { AppUserRole, UserPermissions } from "@/lib/auth/roles";
import { derivePermissions } from "@/lib/auth/roles";

export interface CurrentUser {
  id: number;
  name: string | null;
  email: string;
  role: AppUserRole;
  permissions: UserPermissions;
}

export interface UseCurrentUserResult {
  user: CurrentUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  permissions: UserPermissions;
}

const anonymousPermissions = derivePermissions(null);

export function useCurrentUser(): UseCurrentUserResult {
  const { data, status } = useSession();

  const user = useMemo<CurrentUser | null>(() => {
    const sessionUser = data?.user;
    if (!sessionUser?.email) {
      return null;
    }

    const role = (sessionUser as { role?: AppUserRole | null | undefined }).role ?? null;
    if (!role) {
      return null;
    }

    const permissions = derivePermissions(role);

    const idRaw = (sessionUser as { id?: number | string | null | undefined }).id;
    const idValue =
      typeof idRaw === "number"
        ? idRaw
        : idRaw !== undefined && idRaw !== null
          ? Number(idRaw)
          : undefined;

    return {
      id: idValue ?? 0,
      name: sessionUser.name ?? null,
      email: sessionUser.email,
      role,
      permissions,
    };
  }, [data?.user]);

  return {
    user,
    status,
    isAuthenticated: status === "authenticated" && user !== null,
    permissions: user?.permissions ?? anonymousPermissions,
  };
}
