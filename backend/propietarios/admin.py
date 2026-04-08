from django.contrib import admin
from .models import Owner


@admin.register(Owner)
class OwnerAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "cedula",
        "phone",
        "email",
        "is_active",
        "created_by",
        "company",
        "created_at",
    ]
    list_filter = ["is_active", "company"]
    search_fields = [
        "name",
        "cedula",
        "phone",
        "email",
    ]
    raw_id_fields = ["created_by", "company"]
    readonly_fields = ["created_at", "updated_at"]
    list_editable = ["is_active"]