from django.db.models import Q
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import Appointment
from .permissions import AppointmentMultiTenantPermission
from .serializers import AppointmentSerializer, AppointmentListSerializer
from audit.mixins import AuditLogMixin


class AppointmentPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class AppointmentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    audit_resource_type = "appointment"

    permission_classes = [IsAuthenticated, AppointmentMultiTenantPermission]
    pagination_class = AppointmentPagination

    def get_serializer_class(self):
        if self.action == "list":
            return AppointmentListSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.select_related("scheduled_by", "company")

        # ── Aislamiento multi-tenant ──
        if user.is_platform_admin:
            pass
        elif user.company_id:
            qs = qs.filter(company_id=user.company_id)
        else:
            return qs.none()

        # ── Filtros ──
        params = self.request.query_params

        status = params.get("status")
        if status:
            qs = qs.filter(status=status)

        date_from = params.get("date_from")
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = params.get("date_to")
        if date_to:
            qs = qs.filter(date__lte=date_to)

        sector = params.get("sector")
        if sector:
            qs = qs.filter(sector__icontains=sector)

        search = params.get("search")
        if search:
            qs = qs.filter(
                Q(interested_name__icontains=search)
                | Q(property_address__icontains=search)
                | Q(property_code__icontains=search)
                | Q(sector__icontains=search)
                | Q(interested_phone__icontains=search)
                | Q(key_number__icontains=search)
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
            serializer.save(scheduled_by=user, company=company)
        else:
            serializer.save(scheduled_by=user, company=user.company)