from django.db.models import Q
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Owner
from .permissions import OwnerMultiTenantPermission
from .serializers import OwnerSerializer, OwnerListSerializer
from audit.mixins import AuditLogMixin


class OwnerPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class OwnerViewSet(AuditLogMixin, viewsets.ModelViewSet):
    audit_resource_type = "owner"

    permission_classes = [IsAuthenticated, OwnerMultiTenantPermission]
    pagination_class = OwnerPagination

    # Deshabilitar el método DELETE a nivel de viewset
    http_method_names = ["get", "post", "put", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action == "list":
            return OwnerListSerializer
        return OwnerSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Owner.objects.select_related("created_by", "company")

        # ── Aislamiento multi-tenant ──
        if user.is_platform_admin:
            pass
        elif user.company_id:
            qs = qs.filter(company_id=user.company_id)
        else:
            return qs.none()

        # ── Filtros ──
        params = self.request.query_params

        is_active = params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ("true", "1"))

        search = params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(cedula__icontains=search)
                | Q(phone__icontains=search)
                | Q(email__icontains=search)
            )

        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_platform_admin:
            company_id = self.request.data.get("company")
            if not company_id:
                raise serializers.ValidationError(
                    {"company": "La compañía es obligatoria para el admin de plataforma."}
                )
            from companies.models import Company
            company = Company.objects.get(pk=company_id)
            serializer.save(created_by=user, company=company)
        else:
            serializer.save(created_by=user, company=user.company)

    @action(detail=True, methods=["patch"], url_path="toggle-active")
    def toggle_active(self, request, pk=None):
        """
        PATCH /owners/{id}/toggle-active/
        Alterna el estado activo/inactivo del propietario.
        """
        owner = self.get_object()
        owner.is_active = not owner.is_active
        owner.save(update_fields=["is_active", "updated_at"])
        serializer = OwnerSerializer(owner, context=self.get_serializer_context())
        return Response(serializer.data)