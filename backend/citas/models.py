from django.conf import settings
from django.db import models


class Appointment(models.Model):
    STATUS_CHOICES = [
        ("pendiente", "Pendiente"),
        ("confirmada", "Confirmada"),
        ("cancelada", "Cancelada"),
    ]

    # ── Datos de la cita ──
    date = models.DateField(verbose_name="Fecha")
    time = models.TimeField(verbose_name="Hora")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pendiente",
        db_index=True,
        verbose_name="Estado",
    )

    # ── Propiedad ──
    property_code = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Código de propiedad",
    )
    key_number = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Número de llave",
    )
    property_address = models.CharField(
        max_length=500,
        verbose_name="Dirección de la propiedad",
    )
    sector = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Sector",
    )

    # ── Interesado ──
    interested_name = models.CharField(
        max_length=255,
        verbose_name="Nombre del interesado",
    )
    interested_phone = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Teléfono del interesado",
    )

    # ── Quien agenda (automático) ──
    scheduled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="appointments",
        verbose_name="Agendada por",
    )

    # ── Tenant ──
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="appointments",
        verbose_name="Compañía",
    )

    # ── Notas opcionales ──
    notes = models.TextField(
        blank=True,
        verbose_name="Notas adicionales",
    )

    # ── Timestamps ──
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-time"]
        verbose_name = "Cita"
        verbose_name_plural = "Citas"
        indexes = [
            models.Index(fields=["company", "-date", "-time"]),
            models.Index(fields=["scheduled_by", "-date"]),
            models.Index(fields=["status", "-date"]),
            models.Index(fields=["company", "status"]),
        ]

    def __str__(self):
        return (
            f"Cita #{self.pk} — {self.interested_name} "
            f"({self.date} {self.time:%H:%M})"
        )