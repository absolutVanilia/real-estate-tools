#!/bin/bash
# backend/entrypoint.sh
set -e

echo "============================================"
echo "  🚀 Iniciando te_arrendamos backend"
echo "  Entorno: $DJANGO_ENV"
echo "============================================"

# ---- Esperar a que PostgreSQL esté listo ----
echo "⏳ Esperando a PostgreSQL..."

# Intentar hasta 30 veces (60 segundos max)
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if python -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'te_arrendamos'),
        user=os.environ.get('DB_USER', 'postgres'),
        password=os.environ.get('DB_PASSWORD', ''),
        host=os.environ.get('DB_HOST', 'db'),
        port=os.environ.get('DB_PORT', '5432')
    )
    conn.close()
    print('OK')
except Exception as e:
    print(f'Error: {e}')
    exit(1)
" 2>/dev/null; then
        echo "✅ PostgreSQL disponible"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   PostgreSQL no disponible (intento $RETRY_COUNT/$MAX_RETRIES)..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ No se pudo conectar a PostgreSQL después de $MAX_RETRIES intentos"
    exit 1
fi

# ---- Ejecutar migraciones ----
echo "📦 Ejecutando migraciones..."
python manage.py migrate --noinput
echo "✅ Migraciones completadas"

# ---- Recolectar archivos estáticos ----
echo "📁 Recolectando archivos estáticos..."
python manage.py collectstatic --noinput
echo "✅ Archivos estáticos listos"

# ---- Iniciar servidor ----
echo "============================================"
echo "  🟢 Servidor iniciando en puerto 8000"
echo "============================================"

# exec reemplaza el proceso bash con gunicorn
exec "$@"