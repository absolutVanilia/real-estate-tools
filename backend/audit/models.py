from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("CREATE", "Creación"),
        ("UPDATE", "Actualización"),
        ("DELETE", "Eliminación"),
        ("LOGIN", "Inicio de sesión"),
        ("LOGOUT", "Cierre de sesión"),
        ("OTHER", "Otro"),
    ]

    # ── Quién ──
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    user_display = models.CharField(
        max_length=255,
        blank=True,
        help_text="Nombre desnormalizado para mantener legibilidad si el usuario se elimina",
    )

    # ── Tenant ──
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    # ── Qué acción ──
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, db_index=True)

    # ── Sobre qué recurso ──
    resource_type = models.CharField(max_length=100, db_index=True)
    resource_id = models.IntegerField(null=True, blank=True)
    resource_display = models.CharField(max_length=255, blank=True)

    # ── Detalles ──
    description = models.TextField(blank=True)
    changes = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)

    # ── Contexto HTTP ──
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)

    # ── Cuándo ──
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Log de auditoría"
        verbose_name_plural = "Logs de auditoría"
        indexes = [
            models.Index(fields=["company", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["action", "-created_at"]),
            models.Index(fields=["resource_type", "-created_at"]),
        ]

    def __str__(self):
        return f"[{self.action}] {self.user_display} → {self.resource_type} ({self.created_at:%Y-%m-%d %H:%M})"