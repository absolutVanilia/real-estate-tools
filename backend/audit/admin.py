from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "user_display",
        "action",
        "resource_type",
        "resource_display",
        "company",
    ]
    list_filter = ["action", "resource_type", "company", "created_at"]
    search_fields = ["description", "user_display", "resource_display"]
    readonly_fields = [
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
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser