from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsPlatformAdmin

from .models import Company
from .serializers import CompanySerializer


class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all().order_by("-id")
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
