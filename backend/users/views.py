from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import User
from .permissions import UserMultiTenantPermission
from .serializers import CustomTokenObtainPairSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, UserMultiTenantPermission]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.all().order_by("-id").select_related("company")

        if user.is_platform_admin:
            return qs

        if user.role == "admin" and user.company_id:
            return qs.filter(company_id=user.company_id)

        return qs.filter(pk=user.pk)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        if not self.request.user.is_platform_admin:
            serializer.save(company=self.request.user.company)
        else:
            serializer.save()
