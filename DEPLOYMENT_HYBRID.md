# LearnMind AI - Hybrid Deployment Guide

## 🎯 Arquitectura Híbrida

**Ventajas de este enfoque:**
- ✅ **Sin rebuilds lentos**: Solo `npm install` una vez
- ✅ **Sin problemas de DNS**: No más errores de Alpine/Docker
- ✅ **Desarrollo rápido**: Solo reiniciar proceso con `pm2 restart`
- ✅ **Menos recursos**: Backend/Frontend nativos consumen menos RAM
- ✅ **Fácil debugging**: Logs directos, sin layers de Docker

### Servicios en Docker (Infraestructura):
- PostgreSQL (puerto 5432)
- MongoDB (puerto 27017)
- Redis (puerto 6379)
- MinIO (puertos 9000, 9001)
- Nginx (puertos 80, 443)
- Certbot (SSL automático)

### Servicios Nativos con PM2:
- Backend NestJS (puerto 3000) - 2 instancias cluster
- Frontend React (puerto 5173) - servido con `serve`
- OCR Service Python (puerto 5001) - 1 instancia

---

## 📋 Prerrequisitos

### En tu VPS (Ubuntu 22.04+):

1. **Docker & Docker Compose**
2. **Node.js 20 LTS**
3. **PM2** (Process Manager)
4. **Python 3** (para OCR)

---

## 🚀 Deployment Paso a Paso

### 1. Conectar al VPS

```bash
ssh usuario@89.117.75.145
```

### 2. Ejecutar Setup Inicial (Solo primera vez)

```bash
# Descargar script de setup
wget https://raw.githubusercontent.com/tu-usuario/learnmind-ai/main/setup-vps.sh
chmod +x setup-vps.sh

# Ejecutar setup
./setup-vps.sh

# IMPORTANTE: Cerrar sesión y volver a conectar
exit
ssh usuario@89.117.75.145
```

Este script instala:
- Docker & Docker Compose
- Node.js 20 LTS
- PM2 global
- Python 3 & pip
- Configura firewall (puertos 22, 80, 443)
- Crea directorio `/opt/learnmind-ai`

### 3. Clonar el Proyecto

```bash
cd /home/sw1/pryectofinalverano
git clone https://github.com/sergio41291/pryectofinalverano.git .
```

### 4. Configurar Variables de Entorno

```bash
# Copiar template
cp .env.hybrid .env

# Editar con tus credenciales
nano .env
```

**CAMBIAR OBLIGATORIAMENTE:**
- `DB_PASSWORD` - Contraseña PostgreSQL
- `MONGODB_PASSWORD` - Contraseña MongoDB
- `REDIS_PASSWORD` - Contraseña Redis
- `MINIO_ROOT_PASSWORD` - Contraseña MinIO
- `JWT_SECRET` - 32+ caracteres aleatorios
- `JWT_REFRESH_SECRET` - 32+ caracteres aleatorios
- `ANTHROPIC_API_KEY` - Tu API key de Claude
- `GOOGLE_CLOUD_PROJECT_ID` - Tu proyecto de Google Cloud
- `ELEVENLABS_API_KEY` - Tu API key de ElevenLabs
- `STRIPE_SECRET_KEY` - Tu secret key de Stripe (sk_live_...)
- `STRIPE_WEBHOOK_SECRET` - Tu webhook secret (whsec_...)

### 5. Agregar Google Cloud Credentials

```bash
mkdir -p /home/sw1/pryectofinalverano/backend/credentials
nano /home/sw1/pryectofinalverano/backend/credentials/google-cloud-key.json
```

Pegar el JSON completo de tu service account de Google Cloud.

### 6. Ejecutar Deployment

```bash
cd /home/sw1/pryectofinalverano
chmod +x deploy-hybrid.sh
./deploy-hybrid.sh
```

El script automáticamente:
1. ✅ Verifica prerrequisitos
2. ✅ Valida archivo .env
3. ✅ Detiene servicios existentes
4. ✅ Inicia servicios Docker (Postgres, MongoDB, Redis, MinIO, Nginx)
5. ✅ Instala dependencias del backend (si no existen)
6. ✅ Compila el backend (`npm run build`)
7. ✅ Ejecuta migraciones de base de datos
8. ✅ Instala dependencias del frontend (si no existen)
9. ✅ Compila el frontend (`npm run build`)
10. ✅ Configura entorno Python para OCR
11. ✅ Inicia todo con PM2 (backend, frontend, OCR)
12. ✅ Guarda configuración PM2
13. ✅ Muestra estado y URLs

**Tiempo estimado:** 10-15 minutos (primera vez), 2-3 minutos (subsecuentes)

---

## 🔍 Verificar Deployment

### Verificar servicios Docker:

```bash
cd /opt/learnmind-ai
docker-compose -f docker-compose.infrastructure.yml ps
```

Todos los servicios deben estar "Up" y "healthy".

### Verificar aplicaciones PM2:

```bash
pm2 list
```

Debes ver:
- `learnmind-backend` - online (2 instancias)
- `learnmind-frontend` - online
- `learnmind-ocr` - online

### Verificar logs:

```bash
# Logs de PM2
pm2 logs

# Logs de Docker
docker-compose -f docker-compose.infrastructure.yml logs -f

# Logs de un servicio específico
pm2 logs learnmind-backend
pm2 logs learnmind-frontend
```

### Health Check:

```bash
curl http://localhost:3000/api/health
curl https://learnmind-ai.jkhoster.com/api/health
```

Debe retornar: `{"status":"ok"}`

### Abrir en navegador:

```
https://learnmind-ai.jkhoster.com
```

---

## 🛠️ Comandos Útiles

### PM2 (Aplicaciones)

```bash
# Ver todas las aplicaciones
pm2 list

# Ver logs en tiempo real
pm2 logs

# Ver logs de una app específica
pm2 logs learnmind-backend
pm2 logs learnmind-frontend

# Reiniciar una aplicación
pm2 restart learnmind-backend
pm2 restart learnmind-frontend
pm2 restart learnmind-ocr

# Reiniciar todas
pm2 restart all

# Detener una aplicación
pm2 stop learnmind-backend

# Monitor en tiempo real (CPU, RAM)
pm2 monit

# Ver información detallada
pm2 show learnmind-backend

# Ver dashboard web
pm2 plus
```

### Docker (Infraestructura)

```bash
# Ver estado de contenedores
docker-compose -f docker-compose.infrastructure.yml ps

# Ver logs
docker-compose -f docker-compose.infrastructure.yml logs -f

# Ver logs de un servicio
docker-compose -f docker-compose.infrastructure.yml logs -f postgres
docker-compose -f docker-compose.infrastructure.yml logs -f nginx

# Reiniciar un servicio
docker-compose -f docker-compose.infrastructure.yml restart postgres
docker-compose -f docker-compose.infrastructure.yml restart nginx

# Detener todo
docker-compose -f docker-compose.infrastructure.yml down

# Iniciar todo
docker-compose -f docker-compose.infrastructure.yml up -d

# Ver uso de recursos
docker stats
```

### Actualizar Código

```bash
# Detener aplicaciones PM2
pm2 stop all

# Pull cambios
cd /opt/learnmind-ai
git pull

# Backend
cd backend
npm install  # Solo si hay nuevas dependencias
npm run build
npm run migration:run  # Solo si hay nuevas migraciones

# Frontend
cd ../frontend
npm install  # Solo si hay nuevas dependencias
npm run build

# Reiniciar aplicaciones
cd ..
pm2 restart all
```

### Backup de Base de Datos

```bash
# PostgreSQL
docker-compose -f docker-compose.infrastructure.yml exec postgres \
  pg_dump -U learnmind_user learnmind_production > backup_$(date +%Y%m%d).sql

# MongoDB
docker-compose -f docker-compose.infrastructure.yml exec mongodb \
  mongodump --uri="mongodb://learnmind_mongo:PASSWORD@localhost:27017/learnmind_ai" \
  --out=/backup

# Copiar backup de MongoDB del contenedor
docker cp learnmind-mongodb:/backup ./mongodb_backup_$(date +%Y%m%d)
```

---

## 🔧 Troubleshooting

### Backend no inicia

```bash
# Ver logs detallados
pm2 logs learnmind-backend --lines 100

# Verificar que las bases de datos están corriendo
docker-compose -f docker-compose.infrastructure.yml ps

# Verificar conectividad a PostgreSQL
docker-compose -f docker-compose.infrastructure.yml exec postgres \
  psql -U learnmind_user -d learnmind_production -c "SELECT 1"

# Reiniciar backend
pm2 restart learnmind-backend
```

### Frontend no carga

```bash
# Ver logs
pm2 logs learnmind-frontend --lines 100

# Verificar que el build existe
ls -la /opt/learnmind-ai/frontend/dist

# Rebuild frontend
cd /opt/learnmind-ai/frontend
npm run build

# Reiniciar
pm2 restart learnmind-frontend
```

### Nginx no funciona

```bash
# Ver logs de Nginx
docker-compose -f docker-compose.infrastructure.yml logs -f nginx

# Verificar configuración
docker-compose -f docker-compose.infrastructure.yml exec nginx nginx -t

# Reiniciar Nginx
docker-compose -f docker-compose.infrastructure.yml restart nginx
```

### SSL no funciona

```bash
# Verificar certificados
ls -la /etc/letsencrypt/live/learnmind-ai.jkhoster.com/

# Obtener certificado manualmente
docker-compose -f docker-compose.infrastructure.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d learnmind-ai.jkhoster.com \
  --email jc.ulloa@jkarlos.info \
  --agree-tos \
  --no-eff-email

# Reiniciar Nginx después de obtener certificado
docker-compose -f docker-compose.infrastructure.yml restart nginx
```

### OCR service no funciona

```bash
# Ver logs
pm2 logs learnmind-ocr --lines 100

# Verificar entorno virtual
ls -la /opt/learnmind-ai/backend/venv_ocr

# Reinstalar entorno virtual
cd /opt/learnmind-ai/backend
rm -rf venv_ocr
python3 -m venv venv_ocr
source venv_ocr/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

# Reiniciar servicio
pm2 restart learnmind-ocr
```

### Base de datos llena

```bash
# Ver tamaño de PostgreSQL
docker-compose -f docker-compose.infrastructure.yml exec postgres \
  psql -U learnmind_user -d learnmind_production -c "\l+"

# Limpiar logs antiguos
pm2 flush

# Limpiar Docker logs
docker system prune -a --volumes
```

---

## 📊 Monitoreo

### PM2 Plus (Dashboard Web)

```bash
pm2 plus
```

Sigue las instrucciones para crear cuenta gratuita y conectar.

### Ver uso de recursos

```bash
# PM2
pm2 monit

# Docker
docker stats

# Sistema
htop
```

### Logs persistentes

Los logs de PM2 se guardan en:
- `/opt/learnmind-ai/logs/backend-*.log`
- `/opt/learnmind-ai/logs/frontend-*.log`
- `/opt/learnmind-ai/logs/ocr-*.log`

---

## 🔐 Seguridad

### Actualizar contraseñas

Después del deployment, cambiar todas las contraseñas en `.env`:

```bash
cd /opt/learnmind-ai
nano .env
```

Cambiar:
- `DB_PASSWORD`
- `MONGODB_PASSWORD`
- `REDIS_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Luego reiniciar servicios:

```bash
docker-compose -f docker-compose.infrastructure.yml down
docker-compose -f docker-compose.infrastructure.yml up -d
pm2 restart all
```

### Firewall

```bash
# Ver reglas actuales
sudo ufw status

# Bloquear ping
sudo ufw deny icmp

# Limitar intentos SSH
sudo ufw limit ssh
```

---

## 📈 Performance

### Escalar Backend

Editar `ecosystem.config.js`:

```javascript
{
  name: 'learnmind-backend',
  instances: 4,  // Cambiar de 2 a 4
  ...
}
```

Luego:

```bash
pm2 reload ecosystem.config.js
```

### Cachear con Redis

Redis ya está configurado en `localhost:6379` y es usado automáticamente por el backend para:
- Sesiones de usuario
- Rate limiting
- Cache de traducciones
- Cache de respuestas de IA

---

## 🎉 Conclusión

Con esta arquitectura híbrida:

✅ **Desarrollo rápido**: No más esperas de builds de Docker
✅ **Estable**: Sin problemas de DNS de Alpine Linux
✅ **Eficiente**: Menos recursos, mejor performance
✅ **Simple**: Fácil debug y monitoreo
✅ **Escalable**: PM2 cluster mode para backend

**URLs finales:**
- Frontend: https://learnmind-ai.jkhoster.com
- API: https://learnmind-ai.jkhoster.com/api
- API Docs: https://learnmind-ai.jkhoster.com/api/docs

¡Deployment completado! 🚀
