export const APP_USER_ROLES = ["ADMIN", "MANAGER", "CLIENT"] as const;

export type AppUserRole = (typeof APP_USER_ROLES)[number];

export interface UserPermissions {
  isAdmin: boolean;
  isManager: boolean;
  isClient: boolean;
  canManageUsers: boolean;
  canManageClients: boolean;
  canManageDuties: boolean;
}

const PERMISSIONS_MAP: Record<AppUserRole, UserPermissions> = {
  ADMIN: {
    isAdmin: true,
    isManager: true,
    isClient: true,
    canManageUsers: true,
    canManageClients: true,
    canManageDuties: true,
  },
  MANAGER: {
    isAdmin: false,
    isManager: true,
    isClient: true,
    canManageUsers: false,
    canManageClients: true,
    canManageDuties: true,
  },
  CLIENT: {
    isAdmin: false,
    isManager: false,
    isClient: true,
    canManageUsers: false,
    canManageClients: false,
    canManageDuties: false,
  },
};

const DEFAULT_PERMISSIONS: UserPermissions = {
  isAdmin: false,
  isManager: false,
  isClient: false,
  canManageUsers: false,
  canManageClients: false,
  canManageDuties: false,
};

export function derivePermissions(role?: AppUserRole | null): UserPermissions {
  if (!role) {
    return DEFAULT_PERMISSIONS;
  }

  return PERMISSIONS_MAP[role];
}

export function hasRequiredRole(role: AppUserRole | null | undefined, allowed: AppUserRole[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
