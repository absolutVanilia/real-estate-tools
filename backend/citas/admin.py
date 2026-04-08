from django.contrib import admin
from .models import Appointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "date",
        "time",
        "status",
        "interested_name",
        "property_address",
        "sector",
        "scheduled_by",
        "company",
    ]
    list_filter = ["status", "company", "sector", "date"]
    search_fields = [
        "interested_name",
        "property_address",
        "property_code",
        "sector",
        "interested_phone",
    ]
    date_hierarchy = "date"
    raw_id_fields = ["scheduled_by", "company"]
    readonly_fields = ["created_at", "updated_at"]