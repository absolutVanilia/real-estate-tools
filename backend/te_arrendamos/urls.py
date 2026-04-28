from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "healthy"}, status=200)


urlpatterns = [
    path('api/health/', health_check, name='health-check'),  
    path('admin/', admin.site.urls),
    path("api/", include("audit.urls")),
    path('api/contracts/', include('contract.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/', include('users.urls')),
    path('api/', include('companies.urls')),
    path("api/", include("citas.urls")),
    path("api/", include("propietarios.urls")),
    path("api/", include("propiedades.urls")),
]
