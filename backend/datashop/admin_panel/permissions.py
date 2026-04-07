from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Only admin and superadmin roles can access."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'superadmin']
        )


class IsSuperAdmin(BasePermission):
    """Only superadmin can access."""
    message = 'Super Admin access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'superadmin'
        )


class IsAdminOrFinance(BasePermission):
    message = 'Admin or Finance role required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'superadmin', 'finance']
        )


class IsAdminOrOps(BasePermission):
    message = 'Admin or Operations role required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['admin', 'superadmin', 'ops']
        )
