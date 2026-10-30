/**
 * AuthModel.js
 * Domain Model defining User Session, User Roles, and Authentication Contracts.
 */

export const UserRoles = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
});

export const RolePermissions = Object.freeze({
  [UserRoles.ADMIN]: {
    canManageUsers: true,
    canDeleteRecords: true,
    canEditSettings: true,
    canViewReports: true,
    canManageInventory: true,
    canExecuteSales: true,
  },
  [UserRoles.MANAGER]: {
    canManageUsers: false,
    canDeleteRecords: false,
    canEditSettings: false,
    canViewReports: true,
    canManageInventory: true,
    canExecuteSales: true,
  },
  [UserRoles.EMPLOYEE]: {
    canManageUsers: false,
    canDeleteRecords: false,
    canEditSettings: false,
    canViewReports: false,
    canManageInventory: false,
    canExecuteSales: true,
  },
});

export class AuthUserModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || "";
    this.email = data.email || "";
    this.firstName = data.first_name || data.firstName || "";
    this.lastName = data.last_name || data.lastName || "";
    this.role = data.role || UserRoles.EMPLOYEE;
    this.avatar = data.avatar || null;
    this.isActive = Boolean(data.is_active ?? true);
    this.createdAt = data.created_at || new Date().toISOString();
  }

  get fullName() {
    const parts = [this.firstName, this.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : this.username || "Staff Member";
  }

  get isAdmin() {
    return this.role === UserRoles.ADMIN;
  }

  get isManager() {
    return this.role === UserRoles.MANAGER || this.isAdmin;
  }

  hasPermission(permissionKey) {
    const permissions = RolePermissions[this.role] || {};
    return Boolean(permissions[permissionKey]);
  }
}
