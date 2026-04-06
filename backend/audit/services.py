from __future__ import annotations

import logging
from typing import Any

from .middleware import get_current_request

logger = logging.getLogger("audit")


def log_action(
    *,
    user=None,
    action: str,
    resource_type: str,
    resource_id: int | None = None,
    resource_display: str = "",
    description: str = "",
    changes: dict | None = None,
    metadata: dict | None = None,
    tags: list[str] | None = None,
    company=None,
    request=None,
) -> None:
    """
    Registra una acción en el log de auditoría.

    Se puede llamar desde cualquier parte del código.
    Si no se pasa request, intenta obtenerlo del middleware.
    """
    from .models import AuditLog  # Import tardío para evitar circular

    if request is None:
        request = get_current_request()

    # Resolver usuario
    if user is None and request and hasattr(request, "user") and request.user.is_authenticated:
        user = request.user

    # Resolver compañía
    if company is None and user and hasattr(user, "company_id"):
        company = user.company

    # User display desnormalizado
    user_display = ""
    if user:
        full_name = f"{user.first_name} {user.last_name}".strip()
        user_display = f"{full_name} ({user.username})" if full_name else user.username

    # Contexto HTTP
    ip_address = None
    user_agent = ""
    if request:
        ip_address = _get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]

    try:
        AuditLog.objects.create(
            user=user,
            user_display=user_display,
            company=company,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_display=resource_display,
            description=description,
            changes=changes or {},
            metadata=metadata or {},
            tags=tags or [],
            ip_address=ip_address,
            user_agent=user_agent,
        )
    except Exception:
        logger.exception("Error al crear log de auditoría")


def _get_client_ip(request) -> str | None:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")