from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "role",
            "company",
            "is_platform_admin",
            "password",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "is_platform_admin": {"read_only": True},
        }

    def validate(self, attrs):
        request = self.context.get("request")
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Este campo es obligatorio."})

        if (
            request
            and request.user.is_authenticated
            and getattr(request.user, "is_platform_admin", False)
            and self.instance is None
            and not attrs.get("company")
        ):
            raise serializers.ValidationError(
                {"company": "La compañía es obligatoria para el administrador de plataforma."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.is_staff = user.role == "admin" or user.is_platform_admin
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if "role" in validated_data:
            instance.is_staff = (
                validated_data["role"] == "admin" or instance.is_platform_admin
            )

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["role"] = user.role
        token["is_platform_admin"] = user.is_platform_admin
        token["company_id"] = user.company_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
