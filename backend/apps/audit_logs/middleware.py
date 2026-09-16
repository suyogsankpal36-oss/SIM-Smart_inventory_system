import threading

_thread_locals = threading.local()


def get_current_user():
    """Returns the authenticated user for the current request thread, if any."""
    return getattr(_thread_locals, "user", None)


def get_current_ip():
    """Returns the client IP address for the current request thread, if any."""
    return getattr(_thread_locals, "ip_address", None)


class AuditLogMiddleware:
    """
    Middleware that captures the current user and remote IP address
    in thread-local storage for audit trail instrumentation.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Capture current user if authenticated
        user = getattr(request, "user", None)
        _thread_locals.user = user if (user and user.is_authenticated) else None

        # Capture client IP (handling reverse proxies if present)
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR")
        _thread_locals.ip_address = ip

        response = self.get_response(request)

        # Cleanup thread locals to prevent memory leaks across pooled threads
        _thread_locals.user = None
        _thread_locals.ip_address = None

        return response
