from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    actor_username = serializers.SerializerMethodField()
    actor_role = serializers.SerializerMethodField()
    action_display = serializers.CharField(source="get_action_display", read_only=True)
    module_display = serializers.CharField(source="get_module_display", read_only=True)

    class Meta:
        model = ActivityLog
        fields = (
            "id",
            "actor",
            "actor_name",
            "actor_username",
            "actor_role",
            "action",
            "action_display",
            "module",
            "module_display",
            "entity_name",
            "entity_id",
            "description",
            "changes",
            "ip_address",
            "created_at",
        )
        read_only_fields = fields

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.username
        return "System / Automated"

    def get_actor_username(self, obj):
        return obj.actor.username if obj.actor else None

    def get_actor_role(self, obj):
        return obj.actor.role if obj.actor else None
