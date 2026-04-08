from rest_framework import serializers
from .models import Appointment


class AppointmentSerializer(serializers.ModelSerializer):
    scheduled_by_display = serializers.SerializerMethodField()
    company_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "date",
            "time",
            "status",
            "status_display",
            "property_code",
            "key_number",
            "property_address",
            "sector",
            "interested_name",
            "interested_phone",
            "scheduled_by",
            "scheduled_by_display",
            "company",
            "company_display",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "scheduled_by",
            "company",
            "created_at",
            "updated_at",
        ]

    def get_scheduled_by_display(self, obj) -> str:
        if obj.scheduled_by:
            full = f"{obj.scheduled_by.first_name} {obj.scheduled_by.last_name}".strip()
            return full or obj.scheduled_by.username
        return ""

    def get_company_display(self, obj) -> str:
        return obj.company.name if obj.company else ""

    def get_status_display(self, obj) -> str:
        return obj.get_status_display()


class AppointmentListSerializer(serializers.ModelSerializer):
    """Serializer liviano para listados."""

    scheduled_by_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            "id",
            "date",
            "time",
            "status",
            "status_display",
            "property_address",
            "sector",
            "interested_name",
            "interested_phone",
            "scheduled_by",
            "scheduled_by_display",
            "property_code",
            "key_number",
            "created_at",
        ]

    def get_scheduled_by_display(self, obj) -> str:
        if obj.scheduled_by:
            full = f"{obj.scheduled_by.first_name} {obj.scheduled_by.last_name}".strip()
            return full or obj.scheduled_by.username
        return ""

    def get_status_display(self, obj) -> str:
        return obj.get_status_display()