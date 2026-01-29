# 📚 LearnMind AI - Documentación Completa

Bienvenido a **LearnMind AI**. Esta carpeta contiene toda la documentación y código del proyecto.

---

## 🚀 Comienza Aquí

### Para comenzar inmediatamente (5 minutos):
1. Lee [**QUICKSTART.md**](./QUICKSTART.md) ← **EMPIEZA AQUÍ** 🎯
2. Ejecuta `docker-compose up -d`
3. Lee `HOW_TO_RUN.md` para detalles
4. ¡Comienza a desarrollar!

### Para entender el plan completo (30 minutos):
1. Lee [**ROADMAP.md**](./ROADMAP.md) - Plan del proyecto por fases
2. Entiende la arquitectura
3. Revisa los hitos y entregas

---

## 📖 Documentación Principal

### 🎯 [QUICKSTART.md](./QUICKSTART.md)
**Guía rápida de 5 minutos**
- Requisitos previos
- Instalación Docker
- Iniciar servicios
- Acceder a la aplicación
- Troubleshooting básico

**Leer cuando:** Necesitas empezar rápido

---

### 📊 [ROADMAP.md](./ROADMAP.md)
**Plan completo del proyecto (16 semanas)**
- Visión general y objetivos
- Stack tecnológico completo
- 4 fases de desarrollo detalladas:
  - **Fase 1 (Sem 1-4):** MVP Backend & Autenticación
  - **Fase 2 (Sem 5-8):** Procesamiento IA
  - **Fase 3 (Sem 9-12):** Grupos & Pagos
  - **Fase 4 (Sem 13-16):** Frontend & Deploy
- Métricas de éxito
- Detalles de cada tarea

**Leer cuando:** Quieres entender el proyecto completo

---

### 🌊 [CLAUDE_STREAMING_GUIDE.md](./CLAUDE_STREAMING_GUIDE.md)
**Implementación de Claude API con Streaming**
- ¿Qué es streaming?
- Arquitectura del streaming
- Implementación en NestJS
- Cliente React
- Alternativa con WebSocket
- Costos y límites

**Leer cuando:** Necesitas implementar resúmenes con IA

**Clave:** Sí, Claude soporta streaming perfecto para textos largos

---

### ⚡ [HOW_TO_RUN.md](./HOW_TO_RUN.md)
**Cómo ejecutar el proyecto día a día**
- Setup inicial
- Iniciar Docker
- Ejecutar Frontend
- Ejecutar Backend
- Verificar todo funciona
- Parar servicios
- Workflow diario
- Troubleshooting completo
- Comandos rápidos

**Leer cuando:** Necesitas ejecutar el proyecto

---

### 🐍 [PADDLE_OCR_SETUP.md](./PADDLE_OCR_SETUP.md)
**Instalación y uso de Paddle OCR**
- ¿Qué es PaddleOCR?
- Instalación paso a paso (Windows, Mac, Linux)
- Verificación
- Integración en NestJS
- Configuración de rendimiento
- Troubleshooting
- Optimización

**Leer cuando:** Necesitas configurar OCR

**Clave:** Gratis, preciso (>95% español), multi-idioma

---

## 📂 Estructura de Carpetas

```
learpmind-ai/
├── 📘 README.md                    # Descripción general del proyecto
├── 🎯 QUICKSTART.md                # Guía rápida (5 min)
├── 📊 ROADMAP.md                   # Plan 16 semanas
├── ⚡ HOW_TO_RUN.md                # Cómo ejecutar
├── 🌊 CLAUDE_STREAMING_GUIDE.md    # Claude API Streaming
├── 🐍 PADDLE_OCR_SETUP.md          # OCR Configuration
│
├── .env                            # Variables de entorno (dev)
├── .env.example                    # Template de variables
├── .gitignore                      # Lo que no hacer commit
├── docker-compose.yml              # Servicios Docker
│
├── frontend/                       # React + Vite
│   ├── src/
│   │   ├── App.tsx                # Login/Signup
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   └── Home.tsx           # Dashboard
│   │   └── components/
│   │       ├── Sidebar.tsx
│   │       └── UploadModal.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                        # NestJS (próxima fase)
│   ├── src/
│   │   └── (estructura por crear)
│   ├── scripts/
│   │   ├── init-db.sql            # Init PostgreSQL
│   │   ├── init-mongo.js          # Init MongoDB
│   │   └── paddle_ocr_service.py  # Servicio OCR
│   ├── package.json
│   ├── tsconfig.json
│   ├── eslint.config.js
│   └── Dockerfile
│
└── check-requirements.*            # Scripts de verificación
    ├── check-requirements.sh       # Linux/Mac
    └── check-requirements.ps1      # Windows
```

---

## 🔧 Archivos de Configuración

### [docker-compose.yml](./docker-compose.yml)
Orquestación de servicios:
- PostgreSQL (Base de datos principal)
- MongoDB (Documentos procesados)
- Redis (Caché + Colas)
- MinIO (Almacenamiento S3-compatible)

### [.env.example](./.env.example) y [.env](./.env)
Variables de entorno:
- Configuración de BD
- APIs externas (Claude, Google, Stripe)
- Secretos (JWT, etc)

### Backend Config
- `tsconfig.json` - TypeScript
- `eslint.config.js` - Linting
- `package.json` - Dependencias
- `Dockerfile` - Imagen Docker

---

## 🎯 Mapa de Lectura Recomendado

### 👤 Soy principiante
```
1. QUICKSTART.md          (5 min)  → Entender setup básico
2. README.md              (10 min) → Visión general
3. HOW_TO_RUN.md          (15 min) → Aprender a ejecutar
4. ROADMAP.md             (30 min) → Entender el proyecto
```

### 👨‍💻 Soy desarrollador
```
1. QUICKSTART.md          (5 min)  → Setup rápido
2. ROADMAP.md             (30 min) → Plan técnico
3. CLAUDE_STREAMING_GUIDE.md (20 min) → Para resúmenes
4. PADDLE_OCR_SETUP.md    (20 min) → Para OCR
5. HOW_TO_RUN.md          (10 min) → Comandos
```

### 🏗️ Soy architect
```
1. README.md              (10 min) → Stack general
2. ROADMAP.md             (30 min) → Plan detallado
3. docker-compose.yml     (5 min)  → Infraestructura
4. CLAUDE_STREAMING_GUIDE.md (20 min) → Scalability
```

---

## ✅ Checklist de Setup

- [ ] Docker Desktop instalado
- [ ] Node.js 18+ instalado
- [ ] Python 3.9+ instalado
- [ ] Ejecutar `check-requirements.ps1` (Windows) o `.sh` (Linux)
- [ ] `docker-compose up -d` ✓
- [ ] `cd frontend && npm install && npm run dev` ✓
- [ ] Frontend abierto en http://localhost:5173 ✓
- [ ] Leer ROADMAP.md ✓
- [ ] Leer HOW_TO_RUN.md ✓

---

## 🔌 Servicios Disponibles

| Servicio | URL | Usuario | Contraseña |
|----------|-----|---------|-----------|
| Frontend | http://localhost:5173 | - | - |
| Backend API | http://localhost:3000 | - | - |
| Swagger Docs | http://localhost:3000/api/docs | - | - |
| MinIO Console | http://localhost:9001 | minioadmin | minioadmin123 |
| PostgreSQL | localhost:5432 | postgres | postgres |
| MongoDB | localhost:27017 | admin | mongodb |
| Redis | localhost:6379 | - | redis123 |

---

## 📞 Preguntas Frecuentes

### ¿Por dónde empiezo?
→ [QUICKSTART.md](./QUICKSTART.md)

### ¿Cuál es el plan del proyecto?
→ [ROADMAP.md](./ROADMAP.md)

### ¿Cómo ejecuto el proyecto?
→ [HOW_TO_RUN.md](./HOW_TO_RUN.md)

### ¿Cómo funciona Claude Streaming?
→ [CLAUDE_STREAMING_GUIDE.md](./CLAUDE_STREAMING_GUIDE.md)

### ¿Cómo configuro OCR?
→ [PADDLE_OCR_SETUP.md](./PADDLE_OCR_SETUP.md)

### ¿Qué incluye Docker Compose?
→ [docker-compose.yml](./docker-compose.yml)

### ¿Qué son estas variables de entorno?
→ [.env.example](./.env.example)

---

## 🚀 Próximos Pasos

1. **Hoy:**
   - Leer QUICKSTART.md
   - Ejecutar `docker-compose up -d`
   - Ejecutar frontend
   - Explorar la UI

2. **Mañana:**
   - Leer ROADMAP.md completo
   - Leer HOW_TO_RUN.md
   - Entender la arquitectura

3. **Esta semana:**
   - Instalar PaddleOCR ([PADDLE_OCR_SETUP.md](./PADDLE_OCR_SETUP.md))
   - Preparar APIs (Claude, etc)
   - Inicializar backend NestJS

4. **Esta fase (4 semanas):**
   - Completar Fase 1: Auth + Upload
   - Ver detalles en [ROADMAP.md](./ROADMAP.md)

---

## 📊 Estadísticas del Proyecto

- **Frontend:** React 19 + TypeScript + Tailwind
- **Backend:** NestJS + PostgreSQL + MongoDB + Redis
- **OCR:** Paddle OCR (Python)
- **IA:** Claude API (Streaming)
- **Storage:** MinIO (S3-compatible)
- **Timeline:** 12-16 semanas
- **Story Points:** ~250
- **Endpoints API:** 25+
- **Documentos:** 8+ guías completas ✨

---

## 📝 Actualización de Documentos

Todos los documentos están **vivos y actualizados** al 29 de Enero de 2026.

Se actualizarán conforme avance el proyecto.

---

## 🆘 Soporte

Si necesitas ayuda:

1. **Para conceptos:** Lee el documento correspondiente
2. **Para errores:** Ve a la sección Troubleshooting del doc relevante
3. **Para requisitos:** Ejecuta `check-requirements.ps1`

---

## 🎯 Resumen Ejecutivo

**LearnMind AI** es una plataforma SaaS de procesamiento de documentos con IA que:

- ✅ Extrae texto de PDFs/imágenes (Paddle OCR)
- ✅ Genera resúmenes inteligentes (Claude API con streaming)
- ✅ Crea mapas mentales y conceptuales
- ✅ Traduce contenido
- ✅ Convierte texto a audio
- ✅ Gestiona grupos de usuarios
- ✅ Maneja suscripciones y pagos
- ✅ Todo deployable y escalable

**Tech Stack:** React + NestJS + PostgreSQL + MongoDB + Redis + MinIO + Docker

**Timeline:** 4 fases = 16 semanas

**Estado:** Fase 1 (no iniciada) - Listo para comenzar

---

**¡Bienvenido a LearnMind AI!** 🚀

Comienza aquí: [QUICKSTART.md](./QUICKSTART.md)

---

*Documentación índice actualizada: Enero 29, 2026*
