from rest_framework import serializers
from .models import Owner


class OwnerSerializer(serializers.ModelSerializer):
    created_by_display = serializers.SerializerMethodField()
    company_display = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Owner
        fields = [
            "id",
            "name",
            "cedula",
            "phone",
            "email",
            "is_active",
            "status_label",
            "created_by",
            "created_by_display",
            "company",
            "company_display",
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

    def get_created_by_display(self, obj) -> str:
        if obj.created_by:
            full = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return full or obj.created_by.username
        return ""

    def get_company_display(self, obj) -> str:
        return obj.company.name if obj.company else ""

    def get_status_label(self, obj) -> str:
        return "Activo" if obj.is_active else "Inactivo"


class OwnerListSerializer(serializers.ModelSerializer):
    """Serializer liviano para listados."""

    created_by_display = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Owner
        fields = [
            "id",
            "name",
            "cedula",
            "phone",
            "email",
            "is_active",
            "status_label",
            "created_by",
            "created_by_display",
            "created_at",
        ]

    def get_created_by_display(self, obj) -> str:
        if obj.created_by:
            full = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return full or obj.created_by.username
        return ""

    def get_status_label(self, obj) -> str:
        return "Activo" if obj.is_active else "Inactivo"