"""
Custom Throttle Classes & Progressive Exponential Backoff for Authentication.
"""

import time
import logging
from django.conf import settings
from django.core.cache import cache
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle, BaseThrottle
from rest_framework.exceptions import Throttled

logger = logging.getLogger("smart_inventory.errors")


class ConfigurableAnonRateThrottle(AnonRateThrottle):
    """
    Throttle for unauthenticated anonymous requests.
    Reads rate dynamically from settings / environment variables.
    """
    scope = "anon"


class ConfigurableUserRateThrottle(UserRateThrottle):
    """
    Throttle for authenticated user requests.
    Reads rate dynamically from settings / environment variables.
    """
    scope = "user"


class ExponentialBackoffAuthThrottle(BaseThrottle):
    """
    Progressive exponential backoff throttle for sensitive auth routes (login, register).
    Combines client IP and targeted account identifier to prevent distributed credential stuffing
    and targeted brute-force attacks without permanent hard lockouts.
    """

    def __init__(self):
        self.wait_time = None

    def get_ident(self, request):
        """Extract client IP address, prioritizing X-Forwarded-For if behind a proxy."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "127.0.0.1")

    def get_cache_key(self, request):
        ip = self.get_ident(request)
        # Check payload identifier (username or email)
        raw_identifier = (
            request.data.get("username")
            or request.data.get("email")
            or ""
        )
        identifier = str(raw_identifier).strip().lower()
        return f"auth_backoff_{ip}_{identifier or 'anonymous'}"

    def allow_request(self, request, view):
        if request.method not in ("POST", "PUT", "PATCH"):
            return True

        cache_key = self.get_cache_key(request)
        record = cache.get(cache_key)

        if not record:
            return True

        attempts = record.get("attempts", 0)
        last_attempt = record.get("last_attempt", 0)
        now = time.time()

        max_free = getattr(settings, "AUTH_MAX_FREE_ATTEMPTS", 3)
        initial_backoff = getattr(settings, "AUTH_INITIAL_BACKOFF_SEC", 15)
        max_backoff = getattr(settings, "AUTH_MAX_BACKOFF_SEC", 900)

        if attempts >= max_free:
            exponent = attempts - max_free
            backoff_duration = min(initial_backoff * (2 ** exponent), max_backoff)
            elapsed = now - last_attempt

            if elapsed < backoff_duration:
                self.wait_time = int(backoff_duration - elapsed)
                logger.warning(
                    "Auth rate limit triggered for %s. Backoff active for %ds.",
                    cache_key,
                    self.wait_time,
                )
                return False

        return True

    def wait(self):
        return self.wait_time

    @classmethod
    def record_failure(cls, request):
        """Record a failed login attempt with progressive backoff."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        ip = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else request.META.get("REMOTE_ADDR", "127.0.0.1")
        raw_identifier = request.data.get("username") or request.data.get("email") or ""
        identifier = str(raw_identifier).strip().lower()
        cache_key = f"auth_backoff_{ip}_{identifier or 'anonymous'}"

        record = cache.get(cache_key, {"attempts": 0, "last_attempt": 0})
        record["attempts"] = record["attempts"] + 1
        record["last_attempt"] = time.time()

        max_backoff = getattr(settings, "AUTH_MAX_BACKOFF_SEC", 900)
        # Keep record in cache for double the max backoff period
        cache.set(cache_key, record, timeout=max_backoff * 2)

    @classmethod
    def record_success(cls, request):
        """Clear backoff penalty immediately upon valid authentication."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        ip = x_forwarded_for.split(",")[0].strip() if x_forwarded_for else request.META.get("REMOTE_ADDR", "127.0.0.1")
        raw_identifier = request.data.get("username") or request.data.get("email") or ""
        identifier = str(raw_identifier).strip().lower()
        cache_key = f"auth_backoff_{ip}_{identifier or 'anonymous'}"
        cache.delete(cache_key)
