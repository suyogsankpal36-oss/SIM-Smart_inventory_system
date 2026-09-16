"""
Custom Exception Handler for Django REST Framework.
Prevents information leakage by masking database errors and unhandled exceptions,
logging tracebacks securely server-side, and returning consistent, clean JSON responses.
"""

import logging
from django.db import Error as DatabaseError, IntegrityError, OperationalError
from rest_framework import status
from rest_framework.exceptions import Throttled
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger("smart_inventory.errors")


def custom_exception_handler(exc, context):
    """
    Robust, production-grade exception handler preventing information leakage.
    - Formats Throttling with HTTP 429 and Retry-After header.
    - Masks database errors (IntegrityError, OperationalError) to clean, safe JSON.
    - Catches unhandled 500 server errors, logs full traceback server-side,
      and returns generic safe responses without file paths or stack traces.
    - Formats 400 validation errors cleanly.
    """
    # 1. Handle Throttling specifically with Retry-After header
    if isinstance(exc, Throttled):
        wait_seconds = int(exc.wait) if exc.wait is not None else 60
        response = Response(
            {
                "detail": f"Request limit exceeded. Please wait {wait_seconds} seconds before retrying.",
                "errors": {"rate_limit": [f"Backoff active. Retry after {wait_seconds} seconds."]},
                "retry_after": wait_seconds,
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(wait_seconds)},
        )
        return response

    # 2. Intercept raw Database errors (IntegrityError, OperationalError, etc.)
    if isinstance(exc, DatabaseError):
        req = context.get("request")
        path = req.path if req else "unknown"
        method = req.method if req else "unknown"
        logger.error(
            "Database error on %s %s: %s",
            method,
            path,
            str(exc),
            exc_info=True,
        )

        if isinstance(exc, IntegrityError):
            return Response(
                {
                    "detail": "The requested operation violates a database uniqueness or constraint rule.",
                    "errors": {
                        "non_field_errors": [
                            "A record with conflicting unique values already exists or related items prevent this action."
                        ]
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "detail": "A database operation error occurred. Please try again later.",
                "errors": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # 3. Call standard DRF exception handler
    response = exception_handler(exc, context)

    # 4. If DRF handled it (e.g. ValidationError, PermissionDenied, NotAuthenticated, Http404)
    if response is not None:
        raw_data = response.data

        if isinstance(raw_data, dict):
            detail = raw_data.get("detail")
            errors_dict = {k: v for k, v in raw_data.items() if k != "detail"}
            if not detail and errors_dict:
                first_msgs = []
                for field, errs in errors_dict.items():
                    field_label = "" if field in ("non_field_errors", "error") else f"{field.replace('_', ' ').capitalize()}: "
                    if isinstance(errs, list) and errs:
                        first_msgs.append(f"{prefix_lbl}{errs[0]}" if (prefix_lbl := field_label) else str(errs[0]))
                    elif isinstance(errs, str):
                        first_msgs.append(f"{field_label}{errs}")
                    elif isinstance(errs, dict):
                        for subk, subv in errs.items():
                            first_msgs.append(f"{subk}: {subv[0] if isinstance(subv, list) else subv}")
                detail = "; ".join(first_msgs[:2]) if first_msgs else "Please correct the validation errors."

            response.data = {
                **raw_data,
                "detail": detail or "An error occurred while processing your request.",
                "errors": errors_dict,
            }

        elif isinstance(raw_data, list):
            response.data = {
                "detail": raw_data[0] if raw_data else "Validation error.",
                "errors": {"non_field_errors": raw_data},
            }
        else:
            response.data = {
                "detail": str(raw_data),
                "errors": {},
            }
        return response

    # 5. Unhandled Server Exception (response is None -> 500)
    req = context.get("request")
    path = req.path if req else "unknown"
    method = req.method if req else "unknown"
    logger.critical(
        "Unhandled 500 exception on %s %s: %s",
        method,
        path,
        str(exc),
        exc_info=True,
    )

    return Response(
        {
            "detail": "An unexpected internal server error occurred. Please try again later.",
            "errors": {},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
