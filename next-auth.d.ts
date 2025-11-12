import { type DefaultSession } from "next-auth";

import type { AppUserRole, UserPermissions } from "@/lib/auth/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      role: AppUserRole;
      permissions: UserPermissions;
    } & DefaultSession["user"];
  }

  interface User {
    id: number;
    role: AppUserRole;
    hashedPassword?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    role?: AppUserRole;
  }
}
