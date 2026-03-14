from django.urls import path
from . import views

app_name = 'contract'

urlpatterns = [
    path('generate/', views.generate_contract, name='generate'),
]
