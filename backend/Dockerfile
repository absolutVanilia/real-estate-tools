# backend/Dockerfile

# ==============================
#  STAGE 1: Base
# ==============================
FROM python:3.12-slim AS base

# Variables de entorno de Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dependencias del sistema para psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    libxml2-dev \
    libxslt-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código
COPY . .

# ==============================
#  STAGE 2: Test
# ==============================
FROM base AS test

RUN pip install --no-cache-dir coverage

ENV DJANGO_ENV=local
ENV DB_HOST=localhost

CMD ["python", "manage.py", "test", "--verbosity=2"]

# ==============================
#  STAGE 3: Production
# ==============================
FROM base AS production

# Instalar gunicorn (por si no está en requirements.txt)
RUN pip install --no-cache-dir gunicorn

# Variables de entorno por defecto
ENV DJANGO_ENV=production
ENV PYTHONPATH=/app

# Crear directorio para archivos estáticos
RUN mkdir -p /app/staticfiles

# Copiar y dar permisos al entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Puerto que expone Django/Gunicorn
EXPOSE 8000

# Script de inicio
ENTRYPOINT ["/entrypoint.sh"]

# Comando: Gunicorn con tu proyecto
CMD ["gunicorn", "te_arrendamos.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]