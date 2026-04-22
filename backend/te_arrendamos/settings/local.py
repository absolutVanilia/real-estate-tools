from .base import *
from dotenv import load_dotenv

# Cargar .env solo en local
load_dotenv(BASE_DIR / '.env')

DEBUG = True

SECRET_KEY = 'django-insecure-+bvgri)x9#bmw!hzud-4n0phyj*-4&=2f=*m#-4s!vc&95ix=='

ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    'proelimination-kamron-mistakably.ngrok-free.dev',
]

# Base de datos local / Docker Compose
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'te_arrendamos'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# CORS - Permisivo en desarrollo
CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://127.0.0.1:4200',
    'http://192.168.208.26:4200',
    'https://proelimination-kamron-mistakably.ngrok-free.dev',
]