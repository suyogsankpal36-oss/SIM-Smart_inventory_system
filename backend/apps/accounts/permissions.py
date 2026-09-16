from rest_framework import permissions


class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role or Django superuser status.
    """

    message = "Admin access required for this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role == "admin" or request.user.is_superuser)
        )


class IsManagerRole(permissions.BasePermission):
    """
    Allows access to users with 'admin' or 'manager' role, or Django superusers.
    """

    message = "Manager or Admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.role in ["admin", "manager"] or request.user.is_superuser)
        )


class IsEmployeeRole(permissions.BasePermission):
    """
    Allows access to any authenticated and active employee/user.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_active)


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Read permissions allowed for any authenticated user; write permissions restricted to Admin.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user.role == "admin" or request.user.is_superuser)
