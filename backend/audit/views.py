from django.db.models import Q
from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import AuditLog
from .permissions import CanViewAuditLogs
from .serializers import AuditLogSerializer


class AuditLogPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class AuditLogViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Solo lectura. Nadie puede crear/editar/eliminar logs vía API."""

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, CanViewAuditLogs]
    pagination_class = AuditLogPagination

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.select_related("user", "company")

        # ── Aislamiento multi-tenant ──
        if not user.is_platform_admin:
            qs = qs.filter(company_id=user.company_id)

        # ── Filtros ──
        params = self.request.query_params

        action = params.get("action")
        if action:
            qs = qs.filter(action=action)

        resource_type = params.get("resource_type")
        if resource_type:
            qs = qs.filter(resource_type=resource_type)

        tag = params.get("tag")
        if tag:
            qs = qs.filter(tags__contains=[tag])

        search = params.get("search")
        if search:
            qs = qs.filter(
                Q(description__icontains=search)
                | Q(user_display__icontains=search)
                | Q(resource_display__icontains=search)
            )

        date_from = params.get("date_from")
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)

        date_to = params.get("date_to")
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Agregar opciones de filtro para el frontend
        response.data["filter_options"] = {
            "actions": [c[0] for c in AuditLog.ACTION_CHOICES],
            "resource_types": list(
                AuditLog.objects.values_list("resource_type", flat=True).distinct()[:50]
            ),
        }
        return response