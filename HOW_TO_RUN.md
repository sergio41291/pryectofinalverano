# 🚀 Cómo Ejecutar el Proyecto - LearnMind AI

## 📝 Índice

1. [Setup Inicial](#setup-inicial)
2. [Iniciar Docker](#iniciar-docker)
3. [Frontend](#frontend)
4. [Backend (Próximas Fases)](#backend-próximas-fases)
5. [Verificar Todo Funciona](#verificar-todo-funciona)
6. [Parar Servicios](#parar-servicios)
7. [Troubleshooting](#troubleshooting)

---

## Setup Inicial

### Paso 1: Verificar Requisitos

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File check-requirements.ps1

# Linux/Mac (Bash)
bash check-requirements.sh
```

Esto verifica:
- ✅ Docker instalado
- ✅ Node.js/NPM
- ✅ Python 3.9+
- ✅ Git
- ✅ Archivos de configuración

### Paso 2: Clonar/Descargar Proyecto

```bash
# Si es un repositorio Git
git clone <tu-repo>
cd learpmind-ai

# Si descargaste manual
cd c:\work\U\pryectofinalverano
```

### Paso 3: Configurar .env

```bash
# El archivo .env ya debe existir
# Verificar que contiene:
# - DB_* variables
# - REDIS_* variables
# - MINIO_* variables
# - APIs (Claude, Stripe, etc) - opcional para desarrollo
```

---

## Iniciar Docker

### Comando Principal

```bash
# Iniciar todos los servicios (PostgreSQL, MongoDB, Redis, MinIO)
docker-compose up -d

# Ver estado
docker-compose ps
```

**Output esperado:**
```
CONTAINER ID   IMAGE                      STATUS
xxx            postgres:16-alpine         Up 30 seconds
xxx            mongo:7-alpine             Up 30 seconds
xxx            redis:7-alpine             Up 30 seconds
xxx            minio/minio:latest         Up 30 seconds
xxx            minio/mc:latest            Exited (0)
```

### Verificar que Todo Está Corriendo

```bash
# Test PostgreSQL
psql -h localhost -U postgres -d learpmind_dev -c "SELECT VERSION();"
# Output: PostgreSQL version...

# Test MongoDB
mongosh "mongodb://admin:mongodb@localhost:27017/learpmind_dev"
# Output: connection successful

# Test Redis
redis-cli -a redis123 ping
# Output: PONG

# Test MinIO
curl http://localhost:9000/minio/health/live
# Output: OK (o similar)
```

### Ver Logs de Servicios

```bash
# Ver logs de todos
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio

# Salir: Presionar Ctrl+C
```

---

## Frontend

### 1️⃣ Instalar Dependencias

```bash
cd frontend
npm install

# Esto instalará:
# - React 19
# - Vite
# - Tailwind CSS
# - Lucide Icons
# - Y más...

# Tiempo: 2-5 minutos
```

### 2️⃣ Ejecutar en Desarrollo

```bash
# Desde carpeta frontend/
npm run dev

# Output:
# ✓ vite v7.2.4 building for development
# VITE v7.2.4 ready in XXX ms
# ➜ Local:   http://localhost:5173/
# ➜ Press q to quit
```

### 3️⃣ Acceder a la Aplicación

```
Abre tu navegador en: http://localhost:5173
```

**Verás:**
- Página de Login
- Opción para crear cuenta
- Mock de dashboard (después del login)

### 4️⃣ Probar Funcionalidad

```
1. Haz clic en "Regístrate gratis"
2. Rellena email y contraseña
3. Haz clic en "Registrarse"
4. Verás el dashboard
5. Intenta subir un archivo (mock por ahora)
```

---

## Backend (Próximas Fases)

### Fase 1 Setup (Próximamente)

```bash
cd backend

# 1. Instalar dependencias
npm install

# 2. Generar estructura NestJS
npm run start:dev

# Output:
# [Nest] XX, XX/XX/XXXX, X:XXAM     LOG [NestFactory] Starting Nest application...
# [Nest] XX, XX/XX/XXXX, X:XXAM     LOG [InstanceLoader] ...modules loaded
# [Nest] XX, XX/XX/XXXX, X:XXAM     LOG [NestApplication] Nest application successfully started +XXms
```

### Backend estará en

```
http://localhost:3000
API en: http://localhost:3000/api/v1
Docs: http://localhost:3000/api/docs (Swagger)
```

---

## Verificar Todo Funciona

### Checklist de Inicio Rápido

- [ ] Docker corriendo (`docker ps` muestra 4 contenedores)
- [ ] PostgreSQL accesible (`psql` funciona)
- [ ] Redis accesible (`redis-cli ping` = PONG)
- [ ] MinIO accesible (http://localhost:9001)
- [ ] Frontend accesible (http://localhost:5173)
- [ ] Backend accesible (http://localhost:3000) [Fase 2]

### URLs de Referencia

```
Frontend:        http://localhost:5173
Backend API:     http://localhost:3000
Backend Docs:    http://localhost:3000/api/docs
MinIO Console:   http://localhost:9001
PostgreSQL:      localhost:5432
MongoDB:         localhost:27017
Redis:           localhost:6379
```

### Credenciales por Defecto

```
PostgreSQL
- User: postgres
- Pass: postgres
- DB: learpmind_dev

MongoDB
- User: admin
- Pass: mongodb
- DB: learpmind_dev

MinIO Console
- User: minioadmin
- Pass: minioadmin123

Redis
- Pass: redis123
```

---

## Parar Servicios

### Opción 1: Parar Docker (Guardar datos)

```bash
# Parar sin eliminar volúmenes
docker-compose stop

# Reiniciar después
docker-compose start
```

### Opción 2: Parar y Resetear (Limpiar todo)

```bash
# Parar y eliminar volúmenes (⚠️ Elimina datos)
docker-compose down -v

# Reiniciar desde cero
docker-compose up -d
```

### Opción 3: Parar Individual

```bash
# Parar solo un servicio
docker-compose stop postgres
docker-compose stop redis

# Reiniciar solo uno
docker-compose start redis
```

### Parar Frontend

```bash
# En la terminal donde corre npm run dev
Presionar: Ctrl + C
```

---

## Workflow Diario

```bash
# MAÑANA:
# 1. Abrir terminal
cd c:\work\U\pryectofinalverano

# 2. Iniciar Docker si no está corriendo
docker-compose up -d

# 3. Verificar que está todo bien
docker-compose ps

# 4. Abrir terminal 2 - Frontend
cd frontend
npm run dev
# → http://localhost:5173

# 5. Abrir terminal 3 - Backend (cuando esté listo)
cd backend
npm run start:dev
# → http://localhost:3000

# NOCHE:
# Opción A: Parar sin limpiar
docker-compose stop

# Opción B: Resetear todo
docker-compose down -v
```

---

## Troubleshooting

### "Error: connect ECONNREFUSED 127.0.0.1:5432"

PostgreSQL no está corriendo.

```bash
# Ver estado
docker-compose ps

# Reiniciar PostgreSQL
docker-compose restart postgres

# Ver logs
docker-compose logs postgres

# Si sigue sin funcionar, resetear
docker-compose down -v
docker-compose up -d
```

### "Error: Port 5173 already in use"

Otro proceso está usando el puerto.

```bash
# Opción 1: Cambiar puerto en frontend
# En: frontend/vite.config.ts
// server: { port: 5174 }

# Opción 2: Matar proceso
# Windows PowerShell
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5173
kill -9 <PID>
```

### "Docker daemon not running"

Docker Desktop no está iniciado.

```bash
# Windows/Mac
# Abre Docker Desktop desde el menú Inicio

# Verificar
docker ps
```

### "ModuleNotFoundError: paddleocr"

Python OCR no instalado (Fase 2).

```bash
pip install paddleocr pillow pdf2image opencv-python
```

### "CORS error en consola"

Backend aún no está implementado (Fase 1).

```
Esto es normal en desarrollo. Se resolverá cuando 
Backend esté listo. Por ahora es solo frontend.
```

---

## Monitoreo en Tiempo Real

### Ver qué hace Docker

```bash
# Ver recursos usados
docker stats

# Ver eventos
docker events

# Ver logs en tiempo real
docker-compose logs -f --tail=50
```

### Ver base de datos

```bash
# PostgreSQL
psql -h localhost -U postgres -d learpmind_dev
> \dt learpmind.*          # Ver tablas
> SELECT * FROM learpmind.users;  # Ver datos

# MongoDB
mongosh mongodb://admin:mongodb@localhost:27017/learpmind_dev
> show collections
> db.ocr_results.find().pretty()

# Redis
redis-cli -a redis123
> keys *                   # Ver claves
> get mi_clave             # Ver valor
```

---

## Performance & Optimización

### Limpieza

```bash
# Eliminar imágenes no usadas
docker image prune -f

# Eliminar contenedores detenidos
docker container prune -f

# Limpiar volúmenes no usados
docker volume prune -f

# Limpiar todo (agresivo)
docker system prune -f -a
```

### Aumentar Recursos

Si Docker es lento:

```bash
# Docker Desktop > Settings > Resources
# Aumentar:
# - CPUs: 4 → 8
# - Memory: 2GB → 8GB
# - Disk Image Size: 50GB → 100GB
```

---

## Próximos Pasos

1. **Fase 1:** Inicializar backend NestJS
2. **Fase 2:** Integrar Paddle OCR y Claude API
3. **Fase 3:** Implementar sistema de pagos
4. **Fase 4:** Conectar todo en frontend

Ver [ROADMAP.md](./ROADMAP.md) para detalles.

---

## ⚡ Comandos Rápidos

```bash
# Docker
docker-compose up -d              # Iniciar
docker-compose ps                 # Ver estado
docker-compose logs -f            # Ver logs
docker-compose stop               # Parar
docker-compose down -v            # Limpiar

# Frontend
cd frontend && npm install        # Instalar
npm run dev                       # Ejecutar
npm run build                     # Compilar
npm run lint                      # Validar código

# Backend (Cuando esté listo)
cd backend && npm install
npm run start:dev                 # Ejecutar
npm run test                      # Tests
npm run build                     # Compilar

# Python
pip install paddleocr             # OCR
python -c "import paddleocr; print('✅')" # Verificar
```

---

## 🆘 Soporte

Si algo no funciona:

1. Lee [QUICKSTART.md](./QUICKSTART.md)
2. Revisa [PADDLE_OCR_SETUP.md](./PADDLE_OCR_SETUP.md)
3. Ejecuta `check-requirements.ps1` (Windows) o `check-requirements.sh` (Linux/Mac)
4. Busca en troubleshooting arriba

---

*Última actualización: Enero 29, 2026*
