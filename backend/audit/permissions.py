from rest_framework.permissions import BasePermission


class CanViewAuditLogs(BasePermission):
    """
    Platform admin: todos los logs.
    Company admin: logs de su compañía.
    Promotor: sin acceso.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_platform_admin:
            return True
        if user.role == "admin" and user.company_id:
            return True
        return False