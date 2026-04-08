from django.conf import settings
from django.db import models


class Owner(models.Model):
    # ── Datos del propietario ──
    name = models.CharField(
        max_length=255,
        verbose_name="Nombre",
    )
    cedula = models.CharField(
        max_length=20,
        verbose_name="Cédula",
        db_index=True,
    )
    phone = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Teléfono",
    )
    email = models.EmailField(
        blank=True,
        verbose_name="Correo electrónico",
    )

    # ── Estado activo / inactivo ──
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Activo",
    )

    # ── Quien registra (automático) ──
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="owners_created",
        verbose_name="Creado por",
    )

    # ── Tenant ──
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="owners",
        verbose_name="Compañía",
    )

    # ── Timestamps ──
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Propietario"
        verbose_name_plural = "Propietarios"
        constraints = [
            models.UniqueConstraint(
                fields=["company", "cedula"],
                name="unique_cedula_per_company",
            ),
        ]
        indexes = [
            models.Index(fields=["company", "is_active", "name"]),
            models.Index(fields=["company", "cedula"]),
            models.Index(fields=["created_by"]),
        ]

    def __str__(self):
        status = "Activo" if self.is_active else "Inactivo"
        return f"{self.name} — {self.cedula} ({status})"