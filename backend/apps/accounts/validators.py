"""
Strict Input Schema Validators.
Rejects any input that fails strict type, length, and format requirements,
preventing injection attacks and bad data.
"""

import re
from rest_framework.exceptions import ValidationError

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,48}[a-zA-Z0-9]?$")
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$")
PHONE_REGEX = re.compile(r"^\+?[0-9]{7,15}$")
FORBIDDEN_CHARS_REGEX = re.compile(r"[<>{}()[\];`\\]")


def validate_strict_username(value):
    """
    Validates username against length (2-50), allowed character set
    (alphanumeric, underscore, dot, hyphen), and boundary constraints.
    Gracefully extracts local username if an email was entered/autofilled.
    """
    if not isinstance(value, str):
        raise ValidationError("Username must be a valid string.")

    cleaned = value.strip()
    if not cleaned:
        return ""

    if FORBIDDEN_CHARS_REGEX.search(cleaned):
        raise ValidationError("Username contains invalid characters or script tags.")

    # If an email was pasted or autofilled as username, extract the user portion
    if "@" in cleaned:
        cleaned = cleaned.split("@")[0].strip()

    if len(cleaned) < 2 or len(cleaned) > 50:
        raise ValidationError("Username must be between 2 and 50 characters long.")

    if not USERNAME_REGEX.match(cleaned):
        raise ValidationError(
            "Username may only contain letters, numbers, dots, hyphens, and underscores."
        )

    return cleaned



def validate_strict_email(value):
    """
    Validates email format against strict RFC-compatible regex and length bounds.
    """
    if not isinstance(value, str):
        raise ValidationError("Email must be a valid string.")

    cleaned = value.strip().lower()
    if len(cleaned) < 5 or len(cleaned) > 254:
        raise ValidationError("Email address must be between 5 and 254 characters long.")

    if not EMAIL_REGEX.match(cleaned) or ".." in cleaned:
        raise ValidationError("Enter a valid, properly formatted email address.")

    return cleaned


def validate_strict_phone(value):
    """
    Validates phone against E.164 international standard or standard national digits.
    """
    if not value:
        return ""

    if not isinstance(value, str):
        raise ValidationError("Phone number must be a valid string.")

    cleaned = value.strip().replace(" ", "").replace("-", "")
    if not cleaned:
        return ""

    if not PHONE_REGEX.match(cleaned):
        raise ValidationError(
            "Phone number must contain between 7 and 15 digits and can optionally start with '+'."
        )

    return cleaned


def validate_clean_name(value, field_name="Name"):
    """
    Validates personal or descriptive name strings, strictly rejecting HTML/script injection.
    """
    if not value:
        return ""

    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be a valid string.")

    cleaned = value.strip()
    if len(cleaned) > 50:
        raise ValidationError(f"{field_name} cannot exceed 50 characters.")

    if FORBIDDEN_CHARS_REGEX.search(cleaned):
        raise ValidationError(f"{field_name} contains forbidden special characters.")

    return cleaned


def validate_password_complexity(value):
    """
    Validates password security bounds:
    - Minimum 6 characters, maximum 128 characters
    - Must include at least one numeric digit (0-9)
    """
    if not isinstance(value, str):
        raise ValidationError("Password must be a valid string.")

    if len(value) < 6:
        raise ValidationError("Password must be at least 6 characters long.")
    if len(value) > 128:
        raise ValidationError("Password cannot exceed 128 characters.")

    if not re.search(r"[0-9]", value):
        raise ValidationError("Password must include at least one numeric digit (0-9).")

    return value


