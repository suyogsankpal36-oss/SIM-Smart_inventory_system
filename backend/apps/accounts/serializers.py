import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .validators import (
    validate_clean_name,
    validate_password_complexity,
    validate_strict_email,
    validate_strict_phone,
    validate_strict_username,
)

User = get_user_model()



class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_admin = serializers.ReadOnlyField()
    is_manager = serializers.ReadOnlyField()
    is_employee = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "phone",
            "is_active",
            "is_admin",
            "is_manager",
            "is_employee",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "is_admin",
            "is_manager",
            "is_employee",
        )

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Enhanced JWT login serializer.
    Supports authenticating via either username OR email.
    Returns tokens along with the serialized user profile in the payload.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field] = serializers.CharField(
            label="Username or Email",
            help_text="Enter your username or registered email address.",
        )

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, "copy") else dict(data)
        if self.username_field not in data or not data[self.username_field]:
            alt = data.get("identifier") or data.get("email")
            if alt:
                data[self.username_field] = alt
        return super().to_internal_value(data)

    def validate(self, attrs):
        identifier = attrs.get(self.username_field, "").strip()
        password = attrs.get("password", "")

        # Lookup user by username OR email
        matched_user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username__iexact=identifier)
        ).first()

        if matched_user:
            attrs[self.username_field] = matched_user.username
            if matched_user.check_password(password) and not matched_user.is_active:
                raise serializers.ValidationError(
                    {"detail": "This account is inactive or has been suspended. Please contact your administrator."}
                )

        data = super().validate(attrs)

        # Add custom claims to tokens
        token = self.get_token(self.user)
        token["email"] = self.user.email
        token["role"] = self.user.role
        token["username"] = self.user.username

        # Return user details in response body
        data["user"] = UserSerializer(self.user).data
        return data


class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, validators=[validate_strict_username])
    email = serializers.EmailField(required=True, validators=[validate_strict_email])
    phone = serializers.CharField(required=False, allow_blank=True, validators=[validate_strict_phone])
    first_name = serializers.CharField(required=False, allow_blank=True, validators=[validate_clean_name])
    last_name = serializers.CharField(required=False, allow_blank=True, validators=[validate_clean_name])
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password, validate_password_complexity],
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(
        choices=User.Role.choices,
        default=User.Role.EMPLOYEE,
        required=False,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone",
            "role",
            "password",
            "password_confirm",
        )
        extra_kwargs = {
            "username": {"required": False},
            "email": {"required": True},
        }

    def validate_username(self, value):
        return validate_strict_username(value)

    def validate_phone(self, value):
        return validate_strict_phone(value)

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError({"password": "Passwords do not match."})

        email = attrs.get("email", "").lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with this email address already exists."})

        # Generate username from email prefix if not explicitly provided
        username = attrs.get("username")
        if not username:
            base_username = email.split("@")[0] if "@" in email else "user"
            base_username = re.sub(r"[^a-zA-Z0-9_.-]", "", base_username)[:30] or "user"
            candidate = base_username
            counter = 1
            while User.objects.filter(username__iexact=candidate).exists():
                candidate = f"{base_username}{counter}"
                counter += 1
            attrs["username"] = candidate
        else:
            if User.objects.filter(username__iexact=username).exists():
                raise serializers.ValidationError({"username": "A user with this username already exists."})

        return attrs


    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password, validate_password_complexity],
    )
    new_password_confirm = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is not correct.")
        return value

    def validate(self, attrs):
        if attrs.get("new_password") != attrs.get("new_password_confirm"):
            raise serializers.ValidationError({"new_password": "New passwords do not match."})
        return attrs


class UserAdminSerializer(serializers.ModelSerializer):
    """
    Serializer for Admin-level user creation and management.
    """
    username = serializers.CharField(
        required=False,
        allow_blank=True,
        validators=[validate_strict_username],
    )
    email = serializers.EmailField(required=True, validators=[validate_strict_email])
    phone = serializers.CharField(required=False, allow_blank=True, validators=[validate_strict_phone])
    first_name = serializers.CharField(required=False, allow_blank=True, validators=[validate_clean_name])
    last_name = serializers.CharField(required=False, allow_blank=True, validators=[validate_clean_name])
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        validators=[validate_password, validate_password_complexity],
    )
    full_name = serializers.SerializerMethodField()
    orders_count = serializers.IntegerField(read_only=True, default=0)
    total_sales = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, default=0.00)
    last_login = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "phone",
            "is_active",
            "password",
            "orders_count",
            "total_sales",
            "last_login",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "last_login", "orders_count", "total_sales")

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def validate_email(self, value):
        user_id = self.instance.id if self.instance else None
        value = value.lower().strip()
        qs = User.objects.filter(email__iexact=value)
        if user_id:
            qs = qs.exclude(id=user_id)
        if qs.exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return value

    def validate(self, attrs):
        user_id = self.instance.id if self.instance else None
        username = attrs.get("username", "").strip() if attrs.get("username") else ""

        if not username:
            if not self.instance:
                # Auto-generate unique username for new accounts
                email = attrs.get("email", "")
                base_username = email.split("@")[0] if "@" in email else "staff"
                base_username = re.sub(r"[^a-zA-Z0-9_.-]", "", base_username)[:30] or "staff"
                candidate = base_username
                counter = 1
                while User.objects.filter(username__iexact=candidate).exists():
                    candidate = f"{base_username}{counter}"
                    counter += 1
                attrs["username"] = candidate
        else:
            qs = User.objects.filter(username__iexact=username)
            if user_id:
                qs = qs.exclude(id=user_id)
            if qs.exists():
                raise serializers.ValidationError({"username": "A user with this username already exists."})
            attrs["username"] = username

        # Clean empty password
        if "password" in attrs and not attrs["password"]:
            attrs.pop("password")

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        if not password:
            # Default initial password if none provided by admin
            password = "ChangeMe123!"
        user = User.objects.create_user(password=password, **validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user



class AdminResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password, validate_password_complexity],
    )
    new_password_confirm = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs.get("new_password") != attrs.get("new_password_confirm"):
            raise serializers.ValidationError({"new_password": "New passwords do not match."})
        return attrs
