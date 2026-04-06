from __future__ import annotations

from .services import log_action


class AuditLogMixin:
    """
    Mixin para ViewSets que registra automáticamente CREATE, UPDATE y DELETE.

    Uso:
        class MyViewSet(AuditLogMixin, viewsets.ModelViewSet):
            audit_resource_type = "mi_recurso"
    """

    audit_resource_type: str | None = None
    audit_exclude_fields: set = {"password", "id", "created_at", "updated_at"}

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if 200 <= response.status_code < 300:
            data = response.data
            resource_type = self._get_resource_type()
            resource_display = self._build_resource_display(data)
            log_action(
                user=request.user,
                action="CREATE",
                resource_type=resource_type,
                resource_id=data.get("id"),
                resource_display=resource_display,
                description=f"Creó {resource_type}: {resource_display}",
                metadata=self._clean_data(data),
                tags=self._get_tags(),
                request=request,
            )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self._serialize_instance(instance)

        response = super().update(request, *args, **kwargs)

        if 200 <= response.status_code < 300:
            new_data = response.data
            changes = self._compute_changes(old_data, new_data)
            resource_type = self._get_resource_type()
            resource_display = self._build_resource_display(new_data)

            if changes:
                changed_fields = ", ".join(changes.keys())
                description = f"Actualizó {resource_type}: {resource_display} ({changed_fields})"
            else:
                description = f"Actualizó {resource_type}: {resource_display}"

            log_action(
                user=request.user,
                action="UPDATE",
                resource_type=resource_type,
                resource_id=new_data.get("id"),
                resource_display=resource_display,
                description=description,
                changes=changes,
                tags=self._get_tags(),
                request=request,
            )
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        old_data = self._serialize_instance(instance)
        resource_type = self._get_resource_type()
        resource_display = str(instance)
        resource_id = instance.pk

        response = super().destroy(request, *args, **kwargs)

        if 200 <= response.status_code < 300:
            log_action(
                user=request.user,
                action="DELETE",
                resource_type=resource_type,
                resource_id=resource_id,
                resource_display=resource_display,
                description=f"Eliminó {resource_type}: {resource_display}",
                metadata=self._clean_data(old_data),
                tags=self._get_tags(),
                request=request,
            )
        return response

    # ── Helpers ──

    def _get_resource_type(self) -> str:
        if self.audit_resource_type:
            return self.audit_resource_type
        model = getattr(self, "queryset", None)
        if model is not None:
            return model.model.__name__.lower()
        return "recurso"

    def _get_tags(self) -> list[str]:
        resource_type = self._get_resource_type()
        return [resource_type]

    def _build_resource_display(self, data: dict) -> str:
        name_fields = ["name", "username", "first_name", "title"]
        for field in name_fields:
            if data.get(field):
                return str(data[field])
        return f"#{data.get('id', '?')}"

    def _serialize_instance(self, instance) -> dict:
        try:
            serializer = self.get_serializer(instance)
            return serializer.data
        except Exception:
            return {"id": instance.pk, "str": str(instance)}

    def _clean_data(self, data: dict) -> dict:
        return {k: v for k, v in data.items() if k not in self.audit_exclude_fields}

    def _compute_changes(self, old_data: dict, new_data: dict) -> dict:
        changes = {}
        all_keys = set(old_data.keys()) | set(new_data.keys())
        for key in all_keys:
            if key in self.audit_exclude_fields:
                continue
            old_val = old_data.get(key)
            new_val = new_data.get(key)
            if old_val != new_val:
                changes[key] = {"old": old_val, "new": new_val}
        return changes