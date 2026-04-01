from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_platform_admin", False)
        )


class IsCompanyAdmin(BasePermission):
    """Administrador de una inmobiliaria (tenant), no el super admin de plataforma."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
            and not getattr(request.user, "is_platform_admin", False)
        )


class UserMultiTenantPermission(BasePermission):
    """
    Platform admin: full access.
    Company admin (role=admin): users in same company; create/delete within company.
    Promotor: only own profile; no create/delete users.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if view.action == "create":
            return user.is_platform_admin or user.role == "admin"

        if view.action == "destroy":
            return user.is_platform_admin or user.role == "admin"

        return True

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.is_platform_admin:
            return True

        if obj.pk == user.pk:
            return view.action != "destroy"

        if user.role == "admin" and user.company_id and obj.company_id == user.company_id:
            return True

        return False
