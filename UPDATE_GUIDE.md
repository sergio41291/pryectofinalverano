# 🔄 Actualización y Re-deployment - LearnMind AI

## 📋 Guía Rápida de Actualización

### 1. Actualizar Código en el VPS

```bash
# Conectar al VPS
ssh root@89.117.75.145

# Ir al directorio del proyecto
cd /home/sw1/pryectofinalverano

# Hacer pull de los últimos cambios
git pull origin main
```

---

## 🔧 Actualizar Backend

### 1. Instalar dependencias nuevas (si las hay)

```bash
cd backend
npm install
```

### 2. Ejecutar migraciones de base de datos

```bash
# Ejecutar migraciones pendientes
npm run migration:run

# Ver estado de migraciones
npm run migration:show
```

### 3. Reiniciar el backend

```bash
cd ..
pm2 restart learnmind-backend
pm2 logs learnmind-backend --lines 30
```

---

## 🎨 Actualizar Frontend

### 1. Actualizar configuración de producción

```bash
cd frontend

# Copiar configuración de producción
cp .env.production .env
```

### 2. Instalar dependencias y reconstruir

```bash
# Instalar dependencias nuevas (si las hay)
npm install

# Reconstruir para producción
npm run build
```

### 3. Recargar Nginx

```bash
# Recargar nginx para servir los nuevos archivos
docker exec learnmind-nginx nginx -s reload
```

**Nota:** No necesitas reiniciar PM2 para el frontend porque Nginx sirve directamente desde `frontend/dist`

---

## 🐍 Actualizar Servicio OCR

### 1. Actualizar dependencias Python

```bash
cd backend/scripts

# Activar entorno virtual
source ../../venv_ocr/bin/activate

# Actualizar paquetes (si requirements.txt cambió)
pip install -r ../requirements.txt
```

### 2. Reiniciar el servicio

```bash
cd ../..
pm2 restart learnmind-ocr
pm2 logs learnmind-ocr --lines 30
```

---

## 🗄️ Gestión de Base de Datos

### Ejecutar Migraciones

```bash
cd /home/sw1/pryectofinalverano/backend

# Ver migraciones pendientes
npm run migration:show

# Ejecutar migraciones
npm run migration:run

# Revertir última migración (si es necesario)
npm run migration:revert
```

### Generar Nueva Migración

```bash
# Generar migración automática desde cambios en entities
npm run migration:generate -- src/migrations/NombreDeMigracion

# Crear migración vacía (manual)
npm run migration:create -- src/migrations/NombreDeMigracion
```

### Verificar Tablas en la Base de Datos

```bash
# Conectar a PostgreSQL
docker exec -it learnmind-postgres psql -U learnmind_user -d learnmind_production

# Listar tablas
\dt

# Ver estructura de una tabla
\d users

# Consultar datos
SELECT * FROM users;

# Salir
\q
```

### Reset Completo de Base de Datos (⚠️ PELIGROSO)

```bash
# SOLO SI NECESITAS EMPEZAR DESDE CERO
docker exec learnmind-postgres psql -U learnmind_user -d learnmind_production -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO learnmind_user; GRANT ALL ON SCHEMA public TO public;"

# Luego ejecutar todas las migraciones
cd /home/sw1/pryectofinalverano/backend
npm run migration:run
```

---

## 🐳 Actualizar Infraestructura Docker

### Actualizar contenedores

```bash
cd /home/sw1/pryectofinalverano

# Detener contenedores
docker-compose -f docker-compose.infrastructure.yml down

# Actualizar imágenes
docker-compose -f docker-compose.infrastructure.yml pull

# Iniciar contenedores
docker-compose -f docker-compose.infrastructure.yml up -d

# Verificar estado
docker ps
```

---

## ✅ Verificación Post-Actualización

### 1. Verificar servicios PM2

```bash
pm2 status
pm2 logs --lines 50
```

Debes ver:
- ✅ `learnmind-backend` - online (2 instancias)
- ✅ `learnmind-ocr` - online

### 2. Verificar servicios Docker

```bash
docker ps

# Ver logs
docker-compose -f docker-compose.infrastructure.yml logs -f
```

### 3. Health Checks

```bash
# Backend local
curl http://localhost:3000/api/health

# Backend público
curl https://learnmind-ai.jkhoster.com/api/health

# Frontend (debe retornar HTML)
curl -I https://learnmind-ai.jkhoster.com
```

### 4. Verificar en navegador

1. Abrir: `https://learnmind-ai.jkhoster.com`
2. Limpiar caché: `Ctrl + Shift + R`
3. Abrir DevTools (F12) y verificar Network tab
4. Intentar registrar/login

---

## 🚨 Troubleshooting Común

### Frontend no se actualiza

```bash
# Limpiar cache y reconstruir
cd /home/sw1/pryectofinalverano/frontend
rm -rf dist node_modules
npm install
npm run build

# Recargar nginx
docker exec learnmind-nginx nginx -s reload
```

### Backend muestra errores de base de datos

```bash
# Ver estado de migraciones
cd /home/sw1/pryectofinalverano/backend
npm run migration:show

# Ejecutar migraciones pendientes
npm run migration:run

# Reiniciar backend
pm2 restart learnmind-backend
pm2 logs learnmind-backend
```

### OCR Service crasheando

```bash
# Ver logs
pm2 logs learnmind-ocr --lines 100

# Verificar sintaxis Python
cd /home/sw1/pryectofinalverano/backend/scripts
python3 -m py_compile paddle_ocr_service.py

# Reinstalar dependencias
source ../../venv_ocr/bin/activate
pip install --upgrade -r ../requirements.txt

# Reiniciar
pm2 restart learnmind-ocr
```

### Nginx no sirve archivos actualizados

```bash
# Verificar que dist/ existe y tiene contenido
ls -lh /home/sw1/pryectofinalverano/frontend/dist/

# Ver últimos archivos modificados
ls -lt /home/sw1/pryectofinalverano/frontend/dist/ | head -10

# Recargar nginx
docker exec learnmind-nginx nginx -s reload

# Si no funciona, reiniciar contenedor
docker restart learnmind-nginx
```

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
# PM2 Monitoring
pm2 monit

# Docker stats
docker stats

# Espacio en disco
df -h

# Memoria
free -h
```

### Ver logs en tiempo real

```bash
# PM2 (todas las apps)
pm2 logs

# Solo backend
pm2 logs learnmind-backend --lines 100

# Solo OCR
pm2 logs learnmind-ocr --lines 50

# Docker (todos los servicios)
docker-compose -f docker-compose.infrastructure.yml logs -f

# Solo PostgreSQL
docker logs -f learnmind-postgres

# Solo Nginx
docker logs -f learnmind-nginx
```

---

## 🔐 Backup Antes de Actualizar

### Backup de Base de Datos

```bash
# Crear backup de PostgreSQL
docker exec learnmind-postgres pg_dump -U learnmind_user learnmind_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Crear backup de MongoDB
docker exec learnmind-mongodb mongodump --out=/backup --db=learnmind_db

# Copiar backup de MongoDB del contenedor
docker cp learnmind-mongodb:/backup ./mongodb_backup_$(date +%Y%m%d_%H%M%S)
```

### Restaurar desde Backup

```bash
# Restaurar PostgreSQL
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i learnmind-postgres psql -U learnmind_user -d learnmind_production

# Restaurar MongoDB
docker exec -i learnmind-mongodb mongorestore /backup
```

---

## 📝 Notas Importantes

### Variables de Entorno del Frontend

El frontend tiene 3 archivos de configuración:

- **`.env.local`** - Desarrollo local (localhost:3000)
- **`.env.production`** - Producción (learnmind-ai.jkhoster.com)
- **`.env`** - Usado actualmente

**En el VPS, siempre usa:**
```bash
cd frontend
cp .env.production .env
npm run build
```

### Migraciones de Base de Datos

**IMPORTANTE:** Las migraciones deben ejecutarse en orden cronológico por timestamp. Si generaste una migración con timestamp futuro (año 2026), renómbrala a un timestamp pasado para que se ejecute primero.

Ejemplo:
```bash
# Renombrar archivo con timestamp incorrecto
mv src/migrations/1770167455061-InitialSchema.ts src/migrations/1700000000000-InitialSchema.ts

# Editar el archivo y cambiar el nombre de la clase
# De: export class InitialSchema1770167455061
# A:  export class InitialSchema1700000000000
```

### PM2 Startup

Para que los servicios se reinicien automáticamente al reiniciar el servidor:

```bash
# Configurar PM2 startup
pm2 startup

# Copiar y ejecutar el comando que PM2 genera

# Guardar la configuración actual
pm2 save
```

---

## 🎯 Checklist de Actualización

- [ ] Backup de base de datos
- [ ] `git pull` en el VPS
- [ ] `npm install` en backend (si hay cambios en package.json)
- [ ] `npm run migration:run` en backend
- [ ] `pm2 restart learnmind-backend`
- [ ] `cp .env.production .env` en frontend
- [ ] `npm install` en frontend (si hay cambios en package.json)
- [ ] `npm run build` en frontend
- [ ] `docker exec learnmind-nginx nginx -s reload`
- [ ] Verificar health checks
- [ ] Probar en navegador (modo incógnito o limpiar caché)

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `pm2 logs`
2. Verifica el estado: `pm2 status && docker ps`
3. Consulta la documentación: `DEPLOYMENT_HYBRID.md`
4. Revisa la sección de Troubleshooting arriba
