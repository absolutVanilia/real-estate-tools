from rest_framework.permissions import BasePermission


class OwnerMultiTenantPermission(BasePermission):
    """
    Platform admin: acceso total.
    Cualquier usuario con compañía: CRUD (sin eliminar) dentro de su compañía.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Bloquear DELETE para todos los usuarios
        if view.action == "destroy":
            return False

        if user.is_platform_admin:
            return True

        return bool(user.company_id)

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_platform_admin:
            return True

        return obj.company_id == user.company_id