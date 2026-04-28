from rest_framework import serializers
from .models import Property
from propietarios.models import Owner


# ─── Mini serializer para mostrar propietarios dentro de la propiedad ───
class OwnerMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Owner
        fields = [
            "id",
            "name",
            "cedula",
            "phone",
            "email",
            "is_active",
        ]


# ═══════════════════════════════════════════
#  SERIALIZER COMPLETO (detail / create / update)
# ═══════════════════════════════════════════
class PropertySerializer(serializers.ModelSerializer):
    # ── Read-only displays ──
    propietarios_detail = OwnerMiniSerializer(
        source="propietarios",
        many=True,
        read_only=True,
    )
    asesor_display = serializers.SerializerMethodField()
    created_by_display = serializers.SerializerMethodField()
    company_display = serializers.SerializerMethodField()
    tipo_zona_social_display = serializers.SerializerMethodField()
    tipo_cocina_display = serializers.SerializerMethodField()
    tipo_piso_display = serializers.SerializerMethodField()

    # ── Write-only: lista de IDs de propietarios ──
    propietarios_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=[],
    )

    class Meta:
        model = Property
        fields = [
            # Identificación
            "id",
            "codigo",
            "pre_inventario",
            # Ubicación
            "sector",
            "direccion",
            "punto_referencia",
            # Comercial
            "precio_arriendo",
            "precio_venta",
            # Características
            "area",
            "piso_numero",
            "estrato",
            # Distribución
            "alcobas",
            "banos",
            "tipo_zona_social",
            "tipo_zona_social_display",
            "alcoba_servicio",
            # Espacios adicionales
            "cuarto_util",
            "patio",
            "zona_ropa",
            "balcon",
            "terraza",
            "solar",
            "sotano",
            # Parqueo
            "parqueadero",
            "numero_closets",
            "numero_llaves",
            # Servicios
            "luz_trifilar",
            "gas",
            "calentador",
            # Cocina y acabados
            "tipo_cocina",
            "tipo_cocina_display",
            "tipo_piso",
            "tipo_piso_display",
            # Observaciones
            "observacion",
            "novedad",
            # Relaciones
            "propietarios_detail",
            "propietarios_ids",
            "asesor",
            "asesor_display",
            "created_by",
            "created_by_display",
            "company",
            "company_display",
            # Timestamps
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "company",
            "created_at",
            "updated_at",
        ]

    # ── Display helpers ──
    def get_asesor_display(self, obj) -> str:
        if obj.asesor:
            full = f"{obj.asesor.first_name} {obj.asesor.last_name}".strip()
            return full or obj.asesor.username
        return ""

    def get_created_by_display(self, obj) -> str:
        if obj.created_by:
            full = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return full or obj.created_by.username
        return ""

    def get_company_display(self, obj) -> str:
        return obj.company.name if obj.company else ""

    def get_tipo_zona_social_display(self, obj) -> str:
        return obj.get_tipo_zona_social_display()

    def get_tipo_cocina_display(self, obj) -> str:
        return obj.get_tipo_cocina_display() if obj.tipo_cocina else ""

    def get_tipo_piso_display(self, obj) -> str:
        return obj.get_tipo_piso_display() if obj.tipo_piso else ""

    # ── Validación de propietarios (mismo tenant) ──
    def _get_company(self):
        request = self.context.get("request")
        if not request:
            return None
        user = request.user
        if user.is_platform_admin:
            # En create viene del payload; en update del objeto existente
            if self.instance:
                return self.instance.company
            company_id = request.data.get("company")
            if company_id:
                from companies.models import Company
                return Company.objects.filter(pk=company_id).first()
            return None
        return user.company

    def validate_propietarios_ids(self, value):
        if not value:
            return value
        company = self._get_company()
        if company:
            owners = Owner.objects.filter(pk__in=value, company=company)
            if owners.count() != len(value):
                raise serializers.ValidationError(
                    "Uno o más propietarios no pertenecen a su compañía."
                )
        return value

    def validate_asesor(self, value):
        if value is None:
            return value
        company = self._get_company()
        if company and hasattr(value, "company_id"):
            if value.company_id != company.pk:
                raise serializers.ValidationError(
                    "El asesor debe pertenecer a la misma compañía."
                )
        return value

    # ── Create / Update con M2M ──
    def create(self, validated_data):
        owner_ids = validated_data.pop("propietarios_ids", [])
        instance = super().create(validated_data)
        if owner_ids:
            instance.propietarios.set(owner_ids)
        return instance

    def update(self, instance, validated_data):
        owner_ids = validated_data.pop("propietarios_ids", None)
        instance = super().update(instance, validated_data)
        if owner_ids is not None:
            instance.propietarios.set(owner_ids)
        return instance


# ═══════════════════════════════════════════
#  SERIALIZER LIVIANO (listado)
# ═══════════════════════════════════════════
class PropertyListSerializer(serializers.ModelSerializer):
    asesor_display = serializers.SerializerMethodField()
    created_by_display = serializers.SerializerMethodField()
    propietarios_count = serializers.SerializerMethodField()
    tipo_piso_display = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id",
            "codigo",
            "direccion",
            "sector",
            "estrato",
            "area",
            "alcobas",
            "banos",
            "precio_arriendo",
            "precio_venta",
            "pre_inventario",
            "tipo_piso",
            "tipo_piso_display",
            "parqueadero",
            "asesor",
            "asesor_display",
            "created_by",
            "created_by_display",
            "propietarios_count",
            "numero_llaves",
            "created_at",
        ]

    def get_asesor_display(self, obj) -> str:
        if obj.asesor:
            full = f"{obj.asesor.first_name} {obj.asesor.last_name}".strip()
            return full or obj.asesor.username
        return ""

    def get_created_by_display(self, obj) -> str:
        if obj.created_by:
            full = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return full or obj.created_by.username
        return ""

    def get_propietarios_count(self, obj) -> int:
        return obj.propietarios.count()

    def get_tipo_piso_display(self, obj) -> str:
        return obj.get_tipo_piso_display() if obj.tipo_piso else ""