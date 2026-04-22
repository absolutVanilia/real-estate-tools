from .base import *

DEBUG = False

SECRET_KEY = os.environ['DJANGO_SECRET_KEY']

# El ALB y CloudFront van aquí
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# RDS PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# CORS - Solo tu dominio de CloudFront (y dominio custom si tienes)
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', ''
).split(',')

# Seguridad en producción
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# NO activar SECURE_SSL_REDIRECT porque el ALB maneja SSL
SECURE_SSL_REDIRECT = False

# Para que Django confíe en el header del ALB
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

CSRF_TRUSTED_ORIGINS = [
    'https://domia.inmovisionlabs.com',
    'https://api.domia.inmovisionlabs.com',
]