#!/bin/bash

# =============================================================================
# INSTRUCCIONES DE DEPLOYMENT PASO A PASO
# =============================================================================
#
# Este archivo contiene las instrucciones EXACTAS para deployar LearnMind AI
# en el servidor VPS 89.117.75.145 (learnmind-ai.jkhoster.com)
#
# =============================================================================

cat << 'EOF'

╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║                    🚀 LearnMind AI - Production Deployment                ║
║                                                                           ║
║  Servidor: 89.117.75.145                                                 ║
║  Dominio:  learnmind-ai.jkhoster.com                                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════════
PASO 1: PREPARAR SERVIDOR VPS
═══════════════════════════════════════════════════════════════════════════

Conectarse al servidor:

    ssh usuario@89.117.75.145

Actualizar sistema:

    sudo apt update && sudo apt upgrade -y

Instalar Docker:

    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    newgrp docker

Instalar Docker Compose:

    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

Instalar Git:

    sudo apt install git -y

Configurar Firewall:

    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw enable


═══════════════════════════════════════════════════════════════════════════
PASO 2: CLONAR PROYECTO
═══════════════════════════════════════════════════════════════════════════

Ir a directorio /opt:

    cd /opt

Clonar repositorio:

    sudo git clone https://github.com/tu-usuario/learnmind-ai.git

Cambiar permisos:

    sudo chown -R $USER:$USER learnmind-ai
    cd learnmind-ai


═══════════════════════════════════════════════════════════════════════════
PASO 3: CONFIGURAR VARIABLES DE ENTORNO
═══════════════════════════════════════════════════════════════════════════

Copiar template de producción:

    cp .env.production .env

Editar archivo .env:

    nano .env

CAMBIOS OBLIGATORIOS (buscar y reemplazar):

    1. DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD_123!
       → DB_PASSWORD=TuPasswordPostgres2025!

    2. MONGO_PASSWORD=CHANGE_THIS_MONGO_PASSWORD_456!
       → MONGO_PASSWORD=TuPasswordMongo2025!

    3. REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD_789!
       → REDIS_PASSWORD=TuPasswordRedis2025!

    4. MINIO_ROOT_PASSWORD=CHANGE_THIS_MINIO_PASSWORD_ABC!
       → MINIO_ROOT_PASSWORD=TuPasswordMinio2025!

    5. JWT_SECRET=CHANGE_THIS_JWT_SECRET_MINIMUM_32_CHARACTERS_REQUIRED!
       → JWT_SECRET=TuSecretoJWT32CaracteresMinimo12345!

    6. JWT_REFRESH_SECRET=CHANGE_THIS_JWT_REFRESH_SECRET_MINIMUM_32_CHARS!
       → JWT_REFRESH_SECRET=TuSecretoRefresh32CaracteresMin67890!

    7. ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE
       → ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx

    8. GOOGLE_CLOUD_PROJECT_ID=YOUR_GOOGLE_PROJECT_ID
       → GOOGLE_CLOUD_PROJECT_ID=tu-project-id-real

    9. ELEVENLABS_API_KEY=YOUR_ELEVENLABS_API_KEY
       → ELEVENLABS_API_KEY=tu_api_key_elevenlabs

    10. STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
        → STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

Guardar cambios: Ctrl+X, luego Y, luego Enter


═══════════════════════════════════════════════════════════════════════════
PASO 4: AGREGAR CREDENCIALES DE GOOGLE CLOUD
═══════════════════════════════════════════════════════════════════════════

Crear directorio:

    mkdir -p backend/credentials

Crear archivo JSON:

    nano backend/credentials/google-cloud-key.json

Pegar el contenido del archivo JSON de Google Cloud (todo el objeto JSON)

Guardar: Ctrl+X, luego Y, luego Enter


═══════════════════════════════════════════════════════════════════════════
PASO 5: HACER SCRIPTS EJECUTABLES
═══════════════════════════════════════════════════════════════════════════

    chmod +x deploy.sh
    chmod +x setup-ssl.sh
    chmod +x verify-deployment.sh


═══════════════════════════════════════════════════════════════════════════
PASO 6: VERIFICAR PRE-DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════

Ejecutar verificación:

    ./verify-deployment.sh

Debe mostrar:
    ✅ VERIFICACIÓN EXITOSA

Si hay errores, corregirlos antes de continuar.


═══════════════════════════════════════════════════════════════════════════
PASO 7: EJECUTAR DEPLOYMENT (ESTE ES EL COMANDO PRINCIPAL)
═══════════════════════════════════════════════════════════════════════════

    ./deploy.sh

Este script automáticamente:
    1. ✅ Crea directorios necesarios
    2. ✅ Detiene contenedores existentes
    3. ✅ Compila backend en el servidor
    4. ✅ Compila frontend en el servidor
    5. ✅ Inicia bases de datos (PostgreSQL, MongoDB, Redis, MinIO)
    6. ✅ Espera a que las BD estén listas (60 segundos)
    7. ✅ Ejecuta migraciones de base de datos
    8. ✅ Inicia backend y frontend
    9. ✅ Obtiene certificado SSL de Let's Encrypt
    10. ✅ Inicia Nginx con HTTPS

Duración estimada: 10-15 minutos


═══════════════════════════════════════════════════════════════════════════
PASO 8: VERIFICAR DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════

Ver estado de servicios:

    docker-compose -f docker-compose.prod.yml ps

Todos deben estar "Up" y "healthy"

Ver logs en tiempo real:

    docker-compose -f docker-compose.prod.yml logs -f

Health check:

    curl https://learnmind-ai.jkhoster.com/api/health

Debe retornar:
    {
      "status": "ok",
      "database": "connected",
      "redis": "connected",
      "minio": "connected"
    }


═══════════════════════════════════════════════════════════════════════════
PASO 9: ACCEDER A LA APLICACIÓN
═══════════════════════════════════════════════════════════════════════════

URLs:
    Frontend:     https://learnmind-ai.jkhoster.com
    Backend API:  https://learnmind-ai.jkhoster.com/api
    API Docs:     https://learnmind-ai.jkhoster.com/api/docs
    Health Check: https://learnmind-ai.jkhoster.com/api/health

Abrir en navegador: https://learnmind-ai.jkhoster.com


═══════════════════════════════════════════════════════════════════════════
COMANDOS ÚTILES POST-DEPLOYMENT
═══════════════════════════════════════════════════════════════════════════

Ver logs de un servicio específico:

    docker-compose -f docker-compose.prod.yml logs -f backend
    docker-compose -f docker-compose.prod.yml logs -f frontend
    docker-compose -f docker-compose.prod.yml logs -f nginx

Reiniciar un servicio:

    docker-compose -f docker-compose.prod.yml restart backend
    docker-compose -f docker-compose.prod.yml restart frontend

Detener todo:

    docker-compose -f docker-compose.prod.yml down

Iniciar todo:

    docker-compose -f docker-compose.prod.yml up -d

Ver uso de recursos:

    docker stats

Backup de base de datos:

    docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U learnmind_user learnmind_production > backup_$(date +%Y%m%d).sql


═══════════════════════════════════════════════════════════════════════════
TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════

Si algo falla durante el deployment:

1. Ver logs detallados:
   docker-compose -f docker-compose.prod.yml logs

2. Verificar servicios individuales:
   docker-compose -f docker-compose.prod.yml ps

3. Reintentar deployment:
   docker-compose -f docker-compose.prod.yml down
   ./deploy.sh

4. Si SSL falla:
   ./setup-ssl.sh

5. Si migraciones fallan:
   docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run


═══════════════════════════════════════════════════════════════════════════
CONTACTO Y SOPORTE
═══════════════════════════════════════════════════════════════════════════

Email: jc.ulloa@jkarlos.info
Dominio: learnmind-ai.jkhoster.com
IP: 89.117.75.145

Para más detalles, consultar:
    - README.md (documentación completa)
    - DEPLOYMENT.md (guía detallada de deployment)
    - QUICK_DEPLOY.md (referencia rápida)


═══════════════════════════════════════════════════════════════════════════

🎉 ¡Deployment completado! La aplicación está lista para usarse.

═══════════════════════════════════════════════════════════════════════════

EOF
