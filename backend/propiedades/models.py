from django.conf import settings
from django.db import models


class Property(models.Model):
    # ── Choices ──
    TIPO_ZONA_SOCIAL_CHOICES = [
        ("sala", "Sala"),
        ("comedor", "Comedor"),
        ("sala_comedor", "Sala comedor"),
        ("ninguno", "Ninguno"),
    ]

    TIPO_COCINA_CHOICES = [
        ("integral", "Integral"),
        ("semi_integral", "Semi integral"),
        ("sencilla", "Sencilla"),
        ("tipo_americano", "Tipo americano"),
        ("otro", "Otro"),
    ]

    TIPO_PISO_CHOICES = [
        ("ceramica", "Cerámica"),
        ("marmol", "Mármol"),
        ("porcelanato", "Porcelanato"),
        ("madera", "Madera"),
        ("baldosa", "Baldosa"),
        ("cemento", "Cemento"),
        ("laminado", "Laminado"),
        ("otro", "Otro"),
    ]

    # ═══════════════════════════════════
    #  1. IDENTIFICACIÓN
    # ═══════════════════════════════════
    codigo = models.CharField(
        max_length=50,
        db_index=True,
        verbose_name="Código",
    )
    pre_inventario = models.BooleanField(
        default=False,
        verbose_name="Pre-inventario",
    )

    # ═══════════════════════════════════
    #  2. UBICACIÓN
    # ═══════════════════════════════════
    sector = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Sector",
    )
    direccion = models.CharField(
        max_length=500,
        verbose_name="Dirección",
    )
    punto_referencia = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Punto de referencia",
    )

    # ═══════════════════════════════════
    #  3. INFORMACIÓN COMERCIAL
    # ═══════════════════════════════════
    precio_arriendo = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Precio arriendo",
    )
    precio_venta = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Precio venta",
    )

    # ═══════════════════════════════════
    #  4. CARACTERÍSTICAS GENERALES
    # ═══════════════════════════════════
    area = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Área (m²)",
    )
    piso_numero = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Piso / Nivel",
    )
    estrato = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Estrato",
    )

    # ═══════════════════════════════════
    #  5. DISTRIBUCIÓN
    # ═══════════════════════════════════
    alcobas = models.IntegerField(
        default=0,
        verbose_name="Alcobas",
    )
    banos = models.IntegerField(
        default=0,
        verbose_name="Baños",
    )
    tipo_zona_social = models.CharField(
        max_length=20,
        choices=TIPO_ZONA_SOCIAL_CHOICES,
        default="ninguno",
        verbose_name="Tipo zona social",
    )
    alcoba_servicio = models.BooleanField(
        default=False,
        verbose_name="Alcoba de servicio",
    )

    # ═══════════════════════════════════
    #  6. ESPACIOS ADICIONALES
    # ═══════════════════════════════════
    cuarto_util = models.BooleanField(default=False, verbose_name="Cuarto útil")
    patio = models.BooleanField(default=False, verbose_name="Patio")
    zona_ropa = models.BooleanField(default=False, verbose_name="Zona de ropa")
    balcon = models.BooleanField(default=False, verbose_name="Balcón")
    terraza = models.BooleanField(default=False, verbose_name="Terraza")
    solar = models.BooleanField(default=False, verbose_name="Solar")
    sotano = models.BooleanField(default=False, verbose_name="Sótano")

    # ═══════════════════════════════════
    #  7. PARQUEO Y ALMACENAMIENTO
    # ═══════════════════════════════════
    parqueadero = models.BooleanField(
        default=False,
        verbose_name="Parqueadero",
    )
    numero_closets = models.IntegerField(
        default=0,
        verbose_name="Número de closets",
    )
    numero_llaves = models.IntegerField(
        default=0,
        verbose_name="Número de llaves",
    )

    # ═══════════════════════════════════
    #  8. SERVICIOS
    # ═══════════════════════════════════
    luz_trifilar = models.BooleanField(default=False, verbose_name="Luz trifilar")
    gas = models.BooleanField(default=False, verbose_name="Gas")
    calentador = models.BooleanField(default=False, verbose_name="Calentador")

    # ═══════════════════════════════════
    #  9. COCINA Y ACABADOS
    # ═══════════════════════════════════
    tipo_cocina = models.CharField(
        max_length=30,
        choices=TIPO_COCINA_CHOICES,
        blank=True,
        verbose_name="Tipo de cocina",
    )
    tipo_piso = models.CharField(
        max_length=20,
        choices=TIPO_PISO_CHOICES,
        blank=True,
        verbose_name="Tipo de piso",
    )

    # ═══════════════════════════════════
    #  10. OBSERVACIONES
    # ═══════════════════════════════════
    observacion = models.TextField(
        blank=True,
        verbose_name="Observación",
    )
    novedad = models.TextField(
        blank=True,
        verbose_name="Novedad",
    )

    # ═══════════════════════════════════
    #  11. RELACIONES
    # ═══════════════════════════════════
    propietarios = models.ManyToManyField(
        "propietarios.Owner",
        blank=True,
        related_name="propiedades",
        verbose_name="Propietarios",
    )
    asesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="propiedades_asignadas",
        verbose_name="Asesor",
    )

    # ── Quien crea (automático) ──
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="propiedades_creadas",
        verbose_name="Creado por",
    )

    # ── Tenant ──
    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="propiedades",
        verbose_name="Compañía",
    )

    # ── Timestamps ──
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Propiedad"
        verbose_name_plural = "Propiedades"
        constraints = [
            models.UniqueConstraint(
                fields=["company", "codigo"],
                name="unique_codigo_per_company",
            ),
        ]
        indexes = [
            models.Index(fields=["company", "-created_at"]),
            models.Index(fields=["company", "codigo"]),
            models.Index(fields=["company", "sector"]),
            models.Index(fields=["company", "estrato"]),
            models.Index(fields=["asesor"]),
            models.Index(fields=["company", "pre_inventario"]),
        ]

    def __str__(self):
        return f"{self.codigo} — {self.direccion}"