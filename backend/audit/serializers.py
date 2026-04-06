from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "user_display",
            "company",
            "action",
            "resource_type",
            "resource_id",
            "resource_display",
            "description",
            "changes",
            "metadata",
            "tags",
            "ip_address",
            "user_agent",
            "created_at",
        ]
        read_only_fields = fields