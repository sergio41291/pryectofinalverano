# 🚀 LearnMind AI - Guía de Inicio Rápido

Bienvenido a **LearnMind AI**, plataforma de procesamiento de documentos con IA para estudiantes.

---

## 📋 Requisitos Previos

### Software Requerido
- **Docker Desktop** (incluye Docker + Docker Compose)
  - [Descargar para Windows](https://www.docker.com/products/docker-desktop)
- **Node.js 18+** (para desarrollo)
  - [Descargar](https://nodejs.org/)
- **Python 3.9+** (para Paddle OCR)
  - [Descargar](https://www.python.org/)
- **Git** (control de versiones)

### APIs Externas (Opcional para desarrollo)
- Cuenta en [Anthropic Claude API](https://console.anthropic.com) (resúmenes)
- Cuenta en [Google Cloud](https://cloud.google.com) (traducciones)
- Cuenta en [ElevenLabs](https://elevenlabs.io) (TTS)
- Cuenta en [Stripe](https://stripe.com) (pagos)

---

## ⚡ Quick Start (5 minutos)

### 1. Clonar o descargar el proyecto

```bash
cd c:\work\U\pryectofinalverano
```

### 2. Crear archivo .env local

El archivo `.env` ya existe en la raíz. Si no, cópialo:

```bash
copy .env.example .env
```

### 3. Iniciar bases de datos con Docker Compose

```bash
# Iniciar todos los servicios (PostgreSQL, MongoDB, Redis, MinIO)
docker-compose up -d

# Verificar que los contenedores estén corriendo
docker-compose ps
```

**Esperado:**
```
CONTAINER ID   IMAGE                 STATUS
xxx            postgres:16-alpine    Up 2 minutes
xxx            mongo:7-alpine        Up 2 minutes
xxx            redis:7-alpine        Up 2 minutes
xxx            minio/minio:latest    Up 2 minutes
```

### 4. Verificar Servicios

```bash
# PostgreSQL
# Host: localhost, Puerto: 5432
# Usuario: postgres, Contraseña: postgres
# BD: learpmind_dev

# MongoDB
# URL: mongodb://admin:mongodb@localhost:27017/learpmind_dev
# Puerto: 27017

# Redis
# Host: localhost, Puerto: 6379
# Contraseña: redis123

# MinIO (Almacenamiento)
# Acceder a: http://localhost:9001
# Usuario: minioadmin
# Contraseña: minioadmin123
```

### 5. Instalar dependencias del Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en: **http://localhost:5173**

### 6. Backend (Próximos pasos)

```bash
cd backend
npm install
npm run start:dev
```

Backend disponible en: **http://localhost:3000**

---

## 📁 Estructura del Proyecto

```
learnmind-ai/
├── frontend/                 # React + Vite (autenticación UI)
│   ├── src/
│   │   ├── App.tsx          # Login/Signup
│   │   ├── pages/Home.tsx   # Dashboard post-login
│   │   └── components/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # NestJS (por crear)
│   ├── src/
│   │   ├── modules/
│   │   ├── config/
│   │   └── app.module.ts
│   ├── scripts/
│   │   ├── init-db.sql      # Init PostgreSQL
│   │   ├── init-mongo.js    # Init MongoDB
│   │   └── paddle_ocr_service.py  # Servicio OCR Python
│   └── package.json
│
├── docker-compose.yml        # Servicios: PostgreSQL, MongoDB, Redis, MinIO
├── .env                      # Variables de entorno (NO commitear)
├── .env.example              # Template de variables
├── ROADMAP.md                # Fases del proyecto (4 fases)
└── CLAUDE_STREAMING_GUIDE.md # Guía de Claude API Streaming
```

---

## 🗄️ Bases de Datos

### PostgreSQL (Principal)

```bash
# Conectarse a PostgreSQL
psql -h localhost -U postgres -d learpmind_dev

# Ver tablas creadas
\dt learpmind.*

# Ejecutar query
SELECT * FROM learpmind.users;
```

**Tablas principales creadas automáticamente:**
- `users` - Usuarios del sistema
- `subscription_tiers` - Planes (FREE, PRO, BUSINESS)
- `user_subscriptions` - Suscripción de cada usuario
- `documents` - Archivos subidos
- `categories` - Categorías de documentos
- `processing_results` - Resultados de IA (resumen, OCR, etc)
- `groups` - Grupos/equipos de usuarios
- `group_members` - Miembros de grupos
- `payments` - Historial de pagos

### MongoDB (Opcional)

```bash
# Conectarse a MongoDB
mongosh "mongodb://admin:mongodb@localhost:27017/learpmind_dev"

# Ver colecciones
show collections

# Ver documentos
db.summaries.find().pretty()
```

**Colecciones creadas:**
- `ocr_results` - Textos extraídos por OCR
- `summaries` - Resúmenes generados
- `mindmaps` - Mapas mentales
- `conceptmaps` - Mapas conceptuales
- `translations` - Traducciones
- `text_to_speech` - Audios generados

### Redis (Caché)

```bash
# Conectarse a Redis
redis-cli -a redis123

# Ver claves
keys *

# Ver valor de clave
get mi_clave
```

**Uso:**
- Caché de resúmenes
- Cola de trabajos (Bull)
- Sesiones de usuario

### MinIO (Almacenamiento)

```bash
# Acceder a: http://localhost:9001
# Usuario: minioadmin
# Contraseña: minioadmin123
```

**Buckets creados:**
- `documents` - Archivos originales
- `temp` - Archivos temporales
- `results` - Resultados procesados

---

## 🐍 Paddle OCR Setup

### Instalar Python

1. **Descargar Python 3.11** desde [python.org](https://www.python.org/)
2. **Durante la instalación, marcar "Add Python to PATH"**

### Instalar dependencias

```bash
# Crear virtual environment (recomendado)
python -m venv venv

# Activar
# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install paddleocr pillow pdf2image numpy

# Si necesitas convertir PDFs a imágenes:
# Instalar poppler (Windows):
# https://github.com/oschwartz10612/poppler-windows/releases/
```

### Probar OCR

```bash
# Ver si funciona
python backend/scripts/paddle_ocr_service.py path/to/image.jpg output.json
```

---

## 🔑 Variables de Entorno Importantes

### Para Desarrollo Local

```env
# JWT
JWT_SECRET=tu_secreto_cambiar_en_produccion

# Claude API (NECESARIO para resúmenes)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Google Translate (OPCIONAL)
GOOGLE_CLOUD_PROJECT_ID=tu-project

# ElevenLabs (OPCIONAL, para TTS)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx

# Stripe (OPCIONAL, para pagos)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

**Obtener llaves API:**
1. Claude: [console.anthropic.com](https://console.anthropic.com)
2. Google: [console.cloud.google.com](https://console.cloud.google.com)
3. ElevenLabs: [elevenlabs.io](https://elevenlabs.io)
4. Stripe: [stripe.com](https://stripe.com)

---

## 📊 Roadmap por Fases

### ✅ Fase 1: MVP Backend & Autenticación (Semanas 1-4)
- [ ] Inicializar NestJS
- [ ] Autenticación JWT
- [ ] Modelo de usuarios y suscripción
- [ ] Upload de archivos a MinIO

**Estado:** No iniciado  
**Siguientes pasos:**
```bash
cd backend
npm init
npm install @nestjs/core @nestjs/common
```

### ⏳ Fase 2: Procesamiento IA (Semanas 5-8)
- [ ] OCR con Paddle
- [ ] Resúmenes con Claude (Streaming)
- [ ] Mapas mentales
- [ ] Traducciones

### 🔄 Fase 3: Grupos & Pagos (Semanas 9-12)
- [ ] Gestión de grupos
- [ ] Integración con Stripe
- [ ] Categorías de documentos

### 🚀 Fase 4: Frontend & Deploy (Semanas 13-16)
- [ ] Integración completa
- [ ] UI para procesamiento IA
- [ ] Deploy a producción

**Ver detalles:** [ROADMAP.md](./ROADMAP.md)

---

## 📚 Documentación

| Documento | Descripción |
|-----------|------------|
| [ROADMAP.md](./ROADMAP.md) | Plan completo del proyecto por fases |
| [CLAUDE_STREAMING_GUIDE.md](./CLAUDE_STREAMING_GUIDE.md) | Cómo implementar streaming para resúmenes |
| [.env.example](./.env.example) | Todas las variables de entorno |
| [docker-compose.yml](./docker-compose.yml) | Configuración de servicios |

---

## 🐛 Troubleshooting

### "No se puede conectar a PostgreSQL"
```bash
# Reiniciar Docker
docker-compose restart postgres

# Ver logs
docker-compose logs postgres
```

### "MinIO no está disponible"
```bash
# Esperar a que inicie (tarda ~30 segundos)
docker-compose logs minio
```

### "No encuentra Python"
```bash
# Verificar instalación
python --version

# Si no funciona, agregar a PATH en Windows:
# C:\Users\TU_USUARIO\AppData\Local\Programs\Python\Python311
```

### "Port already in use"
```bash
# Si el puerto 3000 está en uso:
docker-compose stop
# O cambiar puerto en .env:
# BACKEND_PORT=3001
```

---

## 💡 Próximos Pasos

1. **Inicializar Backend NestJS**
   ```bash
   cd backend
   npm install -g @nestjs/cli
   nest new . --skip-git
   ```

2. **Crear estructura de módulos** (Ver ROADMAP.md)

3. **Implementar autenticación JWT**

4. **Conectar a PostgreSQL con TypeORM**

5. **Crear endpoints de upload**

---

## 🤝 Contribuir

Este es un proyecto educativo en desarrollo. 

Antes de cada commit:
```bash
# Asegúrate que tu .env NO se suba
git status
# .env no debe aparecer (debe estar en .gitignore)
```

---

## 📞 Contacto & Soporte

Para dudas sobre:
- **Arquitectura:** Ver [ROADMAP.md](./ROADMAP.md)
- **Claude Streaming:** Ver [CLAUDE_STREAMING_GUIDE.md](./CLAUDE_STREAMING_GUIDE.md)
- **Variables de entorno:** Ver [.env.example](./.env.example)

---

## 📄 Licencia

MIT - Libre para uso personal y educativo

---

## ✨ Checklist Inicial

- [ ] Docker Desktop instalado y corriendo
- [ ] `docker-compose up -d` ejecutado
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Pueden acceder a PostgreSQL
- [ ] Pueden acceder a MinIO en http://localhost:9001
- [ ] Archivo .env configurado
- [ ] APIs externas (Claude, etc) agregadas a .env
- [ ] Próximo paso: Inicializar backend NestJS

---

**¡Listo para comenzar!** 🎉

*Última actualización: Enero 29, 2026*
