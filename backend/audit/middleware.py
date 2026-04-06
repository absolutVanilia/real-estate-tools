from contextvars import ContextVar

_current_request: ContextVar = ContextVar("audit_current_request", default=None)


def get_current_request():
    return _current_request.get(None)


class AuditMiddleware:
    """Almacena el request actual en contextvars para acceso global."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _current_request.set(request)
        response = self.get_response(request)
        _current_request.set(None)
        return response