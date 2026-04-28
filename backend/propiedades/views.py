from django.db.models import Q
from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from .models import Property
from .permissions import PropertyMultiTenantPermission
from .serializers import PropertySerializer, PropertyListSerializer
from audit.mixins import AuditLogMixin


class PropertyPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


class PropertyViewSet(AuditLogMixin, viewsets.ModelViewSet):
    audit_resource_type = "property"

    permission_classes = [IsAuthenticated, PropertyMultiTenantPermission]
    pagination_class = PropertyPagination

    def get_serializer_class(self):
        if self.action == "list":
            return PropertyListSerializer
        return PropertySerializer

    def get_queryset(self):
        user = self.request.user
        qs = Property.objects.select_related(
            "asesor", "created_by", "company"
        ).prefetch_related("propietarios")

        # ── Aislamiento multi-tenant ──
        if user.is_platform_admin:
            pass
        elif user.company_id:
            qs = qs.filter(company_id=user.company_id)
        else:
            return qs.none()

        # ── Filtros ──
        params = self.request.query_params

        # Búsqueda general
        search = params.get("search")
        if search:
            qs = qs.filter(
                Q(codigo__icontains=search)
                | Q(direccion__icontains=search)
                | Q(sector__icontains=search)
                | Q(punto_referencia__icontains=search)
            )

        # Sector
        sector = params.get("sector")
        if sector:
            qs = qs.filter(sector__icontains=sector)

        # Estrato
        estrato = params.get("estrato")
        if estrato:
            qs = qs.filter(estrato=estrato)

        # Pre-inventario
        pre_inventario = params.get("pre_inventario")
        if pre_inventario is not None:
            qs = qs.filter(pre_inventario=pre_inventario.lower() in ("true", "1"))

        # Precio arriendo (rango)
        precio_arriendo_min = params.get("precio_arriendo_min")
        if precio_arriendo_min:
            qs = qs.filter(precio_arriendo__gte=precio_arriendo_min)

        precio_arriendo_max = params.get("precio_arriendo_max")
        if precio_arriendo_max:
            qs = qs.filter(precio_arriendo__lte=precio_arriendo_max)

        # Precio venta (rango)
        precio_venta_min = params.get("precio_venta_min")
        if precio_venta_min:
            qs = qs.filter(precio_venta__gte=precio_venta_min)

        precio_venta_max = params.get("precio_venta_max")
        if precio_venta_max:
            qs = qs.filter(precio_venta__lte=precio_venta_max)

        # Alcobas mínimo
        alcobas_min = params.get("alcobas_min")
        if alcobas_min:
            qs = qs.filter(alcobas__gte=alcobas_min)

        # Baños mínimo
        banos_min = params.get("banos_min")
        if banos_min:
            qs = qs.filter(banos__gte=banos_min)

        # Parqueadero
        parqueadero = params.get("parqueadero")
        if parqueadero is not None:
            qs = qs.filter(parqueadero=parqueadero.lower() in ("true", "1"))

        # Asesor
        asesor = params.get("asesor")
        if asesor:
            qs = qs.filter(asesor_id=asesor)

        # Propietario (filtra propiedades de un propietario específico)
        propietario = params.get("propietario")
        if propietario:
            qs = qs.filter(propietarios__id=propietario)

        # Tipo piso
        tipo_piso = params.get("tipo_piso")
        if tipo_piso:
            qs = qs.filter(tipo_piso=tipo_piso)

        # Tipo cocina
        tipo_cocina = params.get("tipo_cocina")
        if tipo_cocina:
            qs = qs.filter(tipo_cocina=tipo_cocina)

        return qs.distinct()

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