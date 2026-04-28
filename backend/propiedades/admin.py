from django.contrib import admin
from .models import Property


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "codigo",
        "direccion",
        "sector",
        "estrato",
        "alcobas",
        "banos",
        "precio_arriendo",
        "precio_venta",
        "pre_inventario",
        "asesor",
        "company",
        "created_at",
    ]
    list_filter = [
        "company",
        "sector",
        "estrato",
        "pre_inventario",
        "tipo_zona_social",
        "tipo_piso",
        "tipo_cocina",
        "parqueadero",
    ]
    search_fields = [
        "codigo",
        "direccion",
        "sector",
        "punto_referencia",
    ]
    filter_horizontal = ["propietarios"]
    raw_id_fields = ["asesor", "created_by", "company"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Identificación", {
            "fields": ("codigo", "pre_inventario", "company"),
        }),
        ("Ubicación", {
            "fields": ("direccion", "sector", "punto_referencia"),
        }),
        ("Información comercial", {
            "fields": ("precio_arriendo", "precio_venta"),
        }),
        ("Características generales", {
            "fields": ("area", "piso_numero", "estrato"),
        }),
        ("Distribución", {
            "fields": ("alcobas", "banos", "tipo_zona_social", "alcoba_servicio"),
        }),
        ("Espacios adicionales", {
            "fields": (
                "cuarto_util", "patio", "zona_ropa",
                "balcon", "terraza", "solar", "sotano",
            ),
        }),
        ("Parqueo y almacenamiento", {
            "fields": ("parqueadero", "numero_closets", "numero_llaves"),
        }),
        ("Servicios", {
            "fields": ("luz_trifilar", "gas", "calentador"),
        }),
        ("Cocina y acabados", {
            "fields": ("tipo_cocina", "tipo_piso"),
        }),
        ("Observaciones", {
            "fields": ("observacion", "novedad"),
        }),
        ("Relaciones", {
            "fields": ("propietarios", "asesor", "created_by"),
        }),
        ("Auditoría", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )