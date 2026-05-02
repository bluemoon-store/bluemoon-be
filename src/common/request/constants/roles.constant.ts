import { Role } from '@prisma/client';

/** Staff roles that may access all `/admin/*` APIs (not end-users). */
export const ADMIN_ROLES: Role[] = [
    Role.OWNER,
    Role.MOD,
    Role.ALLIANCE,
    Role.SUPPORT,
];

export function isSuperAdminRole(role: Role): boolean {
    return role === Role.SUPER_ADMIN;
}

export function isAdminStaffRole(role: Role): boolean {
    return ADMIN_ROLES.includes(role);
}

/** Super admin or any admin staff — for service-layer checks (e.g. delete user). */
export function isPrivilegedAdminRole(role: Role): boolean {
    return isSuperAdminRole(role) || isAdminStaffRole(role);
}
