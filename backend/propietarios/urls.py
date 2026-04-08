from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OwnerViewSet

router = DefaultRouter()
router.register("owners", OwnerViewSet, basename="owners")

urlpatterns = [
    path("", include(router.urls)),
]