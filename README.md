# 🧠 LearnMind AI - Plataforma de Procesamiento de Documentos con IA

**LearnMind AI** es una plataforma SaaS de próxima generación que transforma documentos (PDFs, imágenes) en conocimiento estructurado mediante IA. Permite a estudiantes y profesionales extraer, resumir, visualizar y aprender de manera más eficiente.

## 🎯 Características Principales

### 📄 Procesamiento de Documentos
- ✅ **OCR** (Paddle OCR) - Extracción de texto de imágenes y PDFs
- ✅ **Resúmenes Inteligentes** (Claude API) - Síntesis automática de contenido
- ✅ **Mapas Mentales** - Visualización jerárquica de conceptos
- ✅ **Mapas Conceptuales** - Relaciones entre ideas
- ✅ **Traducciones** (Google Translate API) - Soporte multiidioma
- ✅ **Texto a Audio** (ElevenLabs) - Aprendizaje auditivo

### 👥 Gestión de Usuarios
- ✅ Autenticación JWT con refresh tokens
- ✅ Sistema de suscripción (FREE/PRO/BUSINESS)
- ✅ Grupos de usuarios con roles
- ✅ Integración de pagos (Stripe)

### 💾 Almacenamiento y Caché
- ✅ MinIO (compatible S3) para archivos
- ✅ PostgreSQL para datos estructurados
- ✅ MongoDB para documentos procesados
- ✅ Redis para caché y colas

---

## 🏗️ Stack Tecnológico

### Frontend
```
React 19 + Vite + TypeScript
Tailwind CSS + Lucide Icons
React Query + Axios
```

### Backend
```
NestJS + TypeScript
PostgreSQL + MongoDB + Redis
Bull Queue + MinIO
Docker Compose (dev)
```

### Servicios Externos
```
Claude API (resúmenes con streaming)
Paddle OCR (extracción de texto)
Google Cloud Translate (traducciones)
ElevenLabs API (TTS)
Stripe (pagos)
```

---

## 📂 Estructura del Proyecto

```
learpmind-ai/
├── frontend/                      # React + Vite SPA
│   ├── src/
│   │   ├── components/           # Componentes reutilizables
│   │   │   ├── Sidebar.tsx      # Navegación
│   │   │   └── UploadModal.tsx  # Subida de archivos
│   │   ├── pages/               # Páginas
│   │   │   ├── Home.tsx         # Dashboard post-login
│   │   │   └── App.tsx          # Login/Signup
│   │   └── services/            # API client
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                       # NestJS API
│   ├── src/
│   │   ├── modules/             # Módulos funcionales
│   │   │   ├── auth/            # Autenticación JWT
│   │   │   ├── users/           # Gestión de usuarios
│   │   │   ├── documents/       # Almacenamiento
│   │   │   ├── processing/      # Servicios IA
│   │   │   │   ├── ocr/
│   │   │   │   ├── summarize/
│   │   │   │   ├── mindmap/
│   │   │   │   └── ...
│   │   │   ├── subscriptions/   # Planes
│   │   │   ├── payments/        # Stripe integration
│   │   │   └── groups/          # Colaboración
│   │   ├── config/              # Configuración
│   │   └── app.module.ts        # Módulo raíz
│   ├── scripts/
│   │   ├── init-db.sql          # Init PostgreSQL
│   │   ├── init-mongo.js        # Init MongoDB
│   │   └── paddle_ocr_service.py # Servicio OCR Python
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
│
├── docker-compose.yml            # Orquestación de servicios
├── .env                          # Variables de entorno (local)
├── .env.example                  # Template de variables
│
├── 📘 ROADMAP.md                 # Plan del proyecto (4 fases)
├── 🌊 CLAUDE_STREAMING_GUIDE.md   # Implementación de streaming
├── ⚡ QUICKSTART.md              # Guía de inicio rápido
├── 🐍 PADDLE_OCR_SETUP.md        # Setup de OCR
└── README.md                     # Este archivo
```

---

## 🚀 Quick Start

### Requisitos
- Docker Desktop
- Node.js 18+
- Python 3.9+
- Git

### Pasos (5 minutos)

```bash
# 1. Clonar proyecto
cd c:\work\U\pryectofinalverano

# 2. Iniciar servicios
docker-compose up -d

# 3. Frontend
cd frontend
npm install
npm run dev
# Accede a: http://localhost:5173

# 4. Backend (próxima fase)
cd backend
npm install
npm run start:dev
# Accede a: http://localhost:3000
```

**Ver [QUICKSTART.md](./QUICKSTART.md) para más detalles.**

---

## 📋 Roadmap de Desarrollo

### ✅ Fase 1: MVP Backend & Autenticación (Semanas 1-4)
**ACTUAL - NO INICIADO**

- [ ] Estructura NestJS
- [ ] Autenticación JWT
- [ ] PostgreSQL setup
- [ ] Upload a MinIO
- [ ] Modelo de suscripción

**Entregables:** 10 endpoints básicos

### ⏳ Fase 2: Procesamiento IA (Semanas 5-8)

- [ ] OCR con Paddle
- [ ] Resúmenes Claude (Streaming ✨)
- [ ] Mapas mentales
- [ ] Mapas conceptuales
- [ ] Traducciones

**Entregables:** 5 nuevos endpoints de IA

### 🔄 Fase 3: Grupos & Negocio (Semanas 9-12)

- [ ] Gestión de grupos
- [ ] Integración Stripe
- [ ] Categorías de documentos
- [ ] Búsqueda avanzada

**Entregables:** Sistema de monetización

### 🎨 Fase 4: Frontend Completo & Deploy (Semanas 13-16)

- [ ] Integración frontend-backend
- [ ] Interfaces IA
- [ ] Panel de suscripción
- [ ] Deploy a producción

**Entregables:** App en vivo

**Ver [ROADMAP.md](./ROADMAP.md) para detalles completos.**

---

## 🔌 Servicios Dockerizados

```bash
# Verificar estado
docker-compose ps

# PostgreSQL
HOST: localhost
PORT: 5432
USER: postgres
PASS: postgres
DB: learpmind_dev

# MongoDB
MONGO_URI: mongodb://admin:mongodb@localhost:27017

# Redis
HOST: localhost
PORT: 6379
PASS: redis123

# MinIO (S3-compatible)
URL: http://localhost:9001
USER: minioadmin
PASS: minioadmin123
```

---

## 🔐 Variables de Entorno Necesarias

**Para desarrollo local (.env):**

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=tu_secreto_cambiar_en_produccion

# Claude API (Resúmenes) - NECESARIO
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx

# Google Translate (Traducciones)
GOOGLE_CLOUD_PROJECT_ID=tu-project

# ElevenLabs (TTS - opcional)
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx

# Stripe (Pagos - opcional)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

**Ver [.env.example](./.env.example) para todas las variables.**

---

## 🌊 Características Especiales

### Streaming con Claude API ✨
Resúmenes que se generan **palabra por palabra** en tiempo real:

```typescript
// Backend: Streaming Server-Sent Events
for await (const chunk of summarizeStream(text)) {
  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
}

// Frontend: Actualización automática
for await (const chunk of streaming) {
  setSummary(prev => prev + chunk);
}
```

**Ventaja:** Usuario ve progreso inmediato, mejor UX

**Ver [CLAUDE_STREAMING_GUIDE.md](./CLAUDE_STREAMING_GUIDE.md) para implementación.**

---

## 🐍 Paddle OCR (Extracción de Texto)

Servicio Python integrado para OCR:

```bash
# Instalación
pip install paddleocr pillow pdf2image

# Uso
python backend/scripts/paddle_ocr_service.py image.jpg output.json
```

**Ventajas:**
- ✅ Gratis (código abierto)
- ✅ Preciso (>95% en español)
- ✅ Multi-idioma (80+)
- ✅ Sin dependencias de APIs pagas

**Ver [PADDLE_OCR_SETUP.md](./PADDLE_OCR_SETUP.md) para setup completo.**

---

## 🧪 Testing & Calidad

```bash
# Backend
npm run test              # Unit tests
npm run test:e2e          # Integration tests
npm run test:cov          # Coverage report

# Frontend
npm run test              # Jest tests
npm run lint              # ESLint

# Objetivo
Coverage: 80%+
Performance: <200ms (p95)
```

---

## 📊 Métricas de Éxito

| Métrica | Meta | Estado |
|---------|------|--------|
| **Test Coverage** | >80% | ⏳ Fase 4 |
| **Response Time** | <200ms (p95) | ⏳ Fase 3 |
| **Uptime** | 99.5% | ⏳ Deploy |
| **Documentación** | 100% | ✅ En progreso |
| **Security** | OWASP Top 10 | ✅ Diseñado |
| **Mobile Responsive** | 100% | ✅ Frontend |

---

## 🔒 Seguridad

- ✅ JWT con refresh tokens
- ✅ Bcrypt 12 rounds para contraseñas
- ✅ CORS configurado
- ✅ Rate limiting (100 req/min)
- ✅ Validación de entrada (Zod)
- ✅ SQL injection prevention (TypeORM)
- ✅ XSS protection (React)
- ✅ HTTPS en producción (TLS 1.3)

---

## 📦 Deployment

### Desarrollo Local
```bash
docker-compose up -d  # Servicios
npm run dev           # Frontend + Backend
```

### Staging/Producción
```bash
# Frontend: Vercel
# Backend: Railway o Render
# BD: AWS RDS PostgreSQL
# Storage: AWS S3
# Caché: AWS ElastiCache (Redis)
```

---

## 🤝 Contribuir

Este es un proyecto educativo en desarrollo. Antes de commit:

```bash
# Verificar que .env no se sube
git status

# .env debe estar en .gitignore ✅
```

---

## 📞 Soporte

### Documentación
- [ROADMAP.md](./ROADMAP.md) - Plan detallado del proyecto
- [QUICKSTART.md](./QUICKSTART.md) - Guía de inicio rápido
- [CLAUDE_STREAMING_GUIDE.md](./CLAUDE_STREAMING_GUIDE.md) - Implementación de streaming
- [PADDLE_OCR_SETUP.md](./PADDLE_OCR_SETUP.md) - Setup de OCR
- [.env.example](./.env.example) - Variables de entorno

### Solución de problemas
Ver secciones de **Troubleshooting** en cada guía.

---

## 📄 Licencia

MIT - Libre para uso personal y educativo

---

## 🎯 Próximos Pasos

1. **Leer [QUICKSTART.md](./QUICKSTART.md)** - Inicio en 5 minutos
2. **Leer [ROADMAP.md](./ROADMAP.md)** - Entender plan completo
3. **Ejecutar:** `docker-compose up -d` - Iniciar servicios
4. **Instalar:** `pip install paddleocr` - OCR
5. **Comenzar Fase 1:** Backend NestJS setup

---

## ✨ Tech Stack Resumido

```
Frontend:  React 19 + TypeScript + Tailwind + Vite
Backend:   NestJS + PostgreSQL + MongoDB + Redis + Bull
Storage:   MinIO (S3-compatible)
OCR:       Paddle OCR (Python)
AI:        Claude API + Google Translate + ElevenLabs
Payments:  Stripe
DevOps:    Docker + Docker Compose + GitHub Actions
```

---

## 📊 Estadísticas del Proyecto

- **Líneas de código (estimadas):** 25,000+
- **Endpoints API:** 25+
- **Tablas BD:** 15+
- **Colecciones MongoDB:** 6+
- **Componentes React:** 30+
- **Timeline:** 12-16 semanas
- **Story points:** ~250

---

**Última actualización:** Enero 29, 2026  
**Versión:** 1.0.0-alpha  
**Estado:** En desarrollo - Fase 1 (no iniciada)

¡Bienvenido a LearnMind AI! 🚀
