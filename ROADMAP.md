# 📚 LearnMind AI - Roadmap Completo

**Fecha de inicio:** Enero 29, 2026  
**Objetivo:** Plataforma de procesamiento de documentos con IA para estudiantes  
**Duración estimada:** 12-16 semanas

---

## 🎯 Visión General del Proyecto

**LearnMind AI** es una plataforma SaaS que permite a estudiantes y profesionales:
- Subir PDFs e imágenes
- Extraer texto mediante OCR (Paddle OCR)
- Generar resúmenes inteligentes (Claude API)
- Crear mapas mentales y conceptuales
- Traducir contenido (Google Translate API)
- Convertir texto a audio (ElevenLabs)
- Gestionar documentos en categorías
- Colaborar en grupos con diferentes roles
- Acceder según suscripción (Free/Pro/Business)

---

## 📊 Stack Tecnológico Final

### Frontend
- **React 19** + Vite
- **TypeScript**
- **Tailwind CSS**
- **React Router** (enrutamiento)
- **React Query** (state management)
- **axios** (API client)

### Backend
- **NestJS** + TypeScript
- **PostgreSQL** (datos principales)
- **MongoDB** (documentos/contenido procesado - opcional)
- **Redis** (caché + colas)
- **Bull** (job queue)
- **MinIO** (almacenamiento de archivos)

### Servicios Externos
- **Paddle OCR** (extracción de texto)
- **Claude API** (resúmenes, análisis)
- **Google Translate API** (traducciones)
- **ElevenLabs API** (TTS)
- **Stripe** (pagos)
- **SendGrid** (emails)

### DevOps
- **Docker** + **Docker Compose**
- **Railway/Render** (producción)
- **GitHub Actions** (CI/CD)

---

## 📋 Estructura de Fases

### ⏰ Timeline Estimado

```
FASE 1 (Semanas 1-4):   MVP Backend + Autenticación
FASE 2 (Semanas 5-8):   Procesamiento IA + Suscripción
FASE 3 (Semanas 9-12):  Grupos + Pagos + Refinamiento
FASE 4 (Semanas 13-16): Tests + Deploy + Optimización
```

---

# FASE 1: MVP Backend & Autenticación (4 Semanas)

## Semana 1: Infraestructura & Setup

### Backend Setup
- [ ] Inicializar proyecto NestJS
- [ ] Configurar TypeScript
- [ ] Estructurar carpetas (modules, common, config)
- [ ] Configurar variables de entorno (.env)
- [ ] Integrar Docker & Docker Compose

### DevOps
- [ ] PostgreSQL dockerizado
- [ ] Redis dockerizado
- [ ] MinIO dockerizado
- [ ] MongoDB dockerizado (opcional)
- [ ] Script de inicialización de BD

### Tareas Subtotales
**Puntos:** 13  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 5-7 días

---

## Semana 2: Autenticación & Usuarios

### Autenticación
- [ ] Modelo User (PostgreSQL)
- [ ] JWT strategy (access + refresh tokens)
- [ ] Controlador de auth (register, login, refresh)
- [ ] Guard de autenticación
- [ ] Middleware de CORS

### Usuarios
- [ ] Servicio de usuarios
- [ ] Endpoint GET /users/profile
- [ ] Endpoint PUT /users/profile
- [ ] Validación con Zod/class-validator
- [ ] Encriptación de contraseñas (bcrypt)

### Testing
- [ ] Tests unitarios básicos
- [ ] Tests de integración (auth)

### Tareas Subtotales
**Puntos:** 14  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 5-7 días

---

## Semana 3: Modelo de Suscripción

### Base de Datos
- [ ] Modelo Subscription (tiers: FREE, PRO, BUSINESS)
- [ ] Modelo UserSubscription (relación)
- [ ] Seeds de datos iniciales
- [ ] Migrations

### Lógica de Negocio
- [ ] Servicio de suscripciones
- [ ] Validador de límites (docs por mes, tamaño, etc)
- [ ] Decorator @CheckSubscription para endpoints
- [ ] Endpoint GET /subscriptions/available
- [ ] Endpoint POST /subscriptions/select (solo upgrade)

### Seguridad
- [ ] Rate limiting (100 req/min)
- [ ] Validación de entrada
- [ ] Logs de auditoría

### Tareas Subtotales
**Puntos:** 11  
**Prioridad:** 🟠 ALTA  
**Tiempo:** 4-5 días

---

## Semana 4: Almacenamiento & Upload

### MinIO Integration
- [ ] Configuración de MinIO
- [ ] Creación de buckets
- [ ] Política de acceso (public/private)
- [ ] Presigned URLs

### Upload Service
- [ ] Servicio de almacenamiento
- [ ] Validación de archivos (tipo, tamaño)
- [ ] Endpoint POST /documents/upload
- [ ] Stream de subida
- [ ] Error handling

### Base de Datos
- [ ] Modelo Document
- [ ] Relación Document ↔ User
- [ ] Relación Document ↔ Subscription
- [ ] Migrations

### Testing
- [ ] Tests de upload
- [ ] Tests de validación
- [ ] Mock de MinIO

### Tareas Subtotales
**Puntos:** 13  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 5-7 días

---

## ✅ Entregables Fase 1

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── auth.guard.ts
│   │   │   └── auth.module.ts
│   │   ├── users/
│   │   │   ├── entities/user.entity.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.module.ts
│   │   ├── subscriptions/
│   │   │   ├── entities/subscription.entity.ts
│   │   │   ├── subscriptions.service.ts
│   │   │   ├── subscriptions.controller.ts
│   │   │   ├── check-subscription.decorator.ts
│   │   │   └── subscriptions.module.ts
│   │   ├── documents/
│   │   │   ├── entities/document.entity.ts
│   │   │   ├── documents.service.ts
│   │   │   ├── documents.controller.ts
│   │   │   └── documents.module.ts
│   │   └── storage/
│   │       ├── storage.service.ts
│   │       ├── storage.config.ts
│   │       └── storage.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── check-subscription.decorator.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── env.config.ts
│   │   └── storage.config.ts
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile

API ENDPOINTS IMPLEMENTADOS:
✅ POST   /auth/register
✅ POST   /auth/login
✅ POST   /auth/refresh
✅ GET    /auth/profile
✅ GET    /users/profile
✅ PUT    /users/profile
✅ GET    /subscriptions/available
✅ POST   /subscriptions/select
✅ POST   /documents/upload
✅ GET    /documents
✅ GET    /documents/:id
✅ DELETE /documents/:id

MÉTRICAS:
- Total tareas: 51
- Testing coverage: ~60%
- Documentación: API docs completos
```

---

# FASE 2: Procesamiento IA (Semanas 5-8)

## Semana 5: OCR con Paddle

### Paddle OCR Integration
- [ ] Instalación de paddle-ocr (Python)
- [ ] Servicio wrapper en Node.js (child_process)
- [ ] Endpoint POST /processing/ocr
- [ ] Validación de archivos soportados
- [ ] Manejo de errores
- [ ] Tests

### Tareas Subtotales
**Puntos:** 8  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 3-4 días

---

## Semana 6: Claude API Streaming para Resúmenes

### Claude Integration
- [ ] Setup de SDK Anthropic
- [ ] Implementación de streaming
- [ ] Endpoint POST /processing/summarize (stream)
- [ ] Validación de suscripción
- [ ] Caché de resúmenes (Redis)
- [ ] Manejo de tokens
- [ ] Error handling

### Queue Integration
- [ ] Job para procesamiento asincrónico
- [ ] Bull queue para resúmenes
- [ ] Notificaciones al cliente (WebSocket)
- [ ] Retry logic

### Tareas Subtotales
**Puntos:** 12  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 4-5 días

---

## Semana 7: Mapas Mentales & Conceptuales

### Mapas Mentales
- [ ] Servicio de generación (Claude API)
- [ ] Formato JSON para visualización
- [ ] Endpoint POST /processing/mindmap (stream)
- [ ] Validación de entrada

### Mapas Conceptuales
- [ ] Generación automática desde resumen
- [ ] Formato para cytoscape.js (frontend)
- [ ] Endpoint POST /processing/conceptmap

### Storage
- [ ] Almacenamiento de mapas en BD
- [ ] Versioning de mapas

### Tareas Subtotales
**Puntos:** 10  
**Prioridad:** 🟠 ALTA  
**Tiempo:** 4-5 días

---

## Semana 8: Traducción & Caché

### Google Translate API
- [ ] Setup de Google Cloud
- [ ] Servicio de traducción
- [ ] Endpoint POST /processing/translate
- [ ] Soporte de idiomas

### Optimización
- [ ] Caché en Redis (textos traducidos)
- [ ] Deduplicación de requests
- [ ] Rate limiting por API

### Tareas Subtotales
**Puntos:** 8  
**Prioridad:** 🟢 MEDIA  
**Tiempo:** 3-4 días

---

## ✅ Entregables Fase 2

```
API ENDPOINTS ADICIONALES:
✅ POST   /processing/ocr
✅ POST   /processing/summarize (STREAM)
✅ POST   /processing/mindmap
✅ POST   /processing/conceptmap
✅ POST   /processing/translate
✅ GET    /documents/:id/results

LIBRERÍAS AGREGADAS:
- @anthropic-ai/sdk (Claude)
- paddle-ocr (Python wrapper)
- google-cloud-translate
- ioredis (caché)
- bull (job queue)

MÉTRICAS:
- Total endpoints: 15
- Funcionalidades IA: 5
- Testing coverage: ~70%
- Documentación: Ejemplos de streaming
```

---

# FASE 3: Grupos, Pagos & Refinamiento (Semanas 9-12)

## Semana 9: Grupos de Usuarios

### Modelo de Datos
- [ ] Entidad Group
- [ ] Relación Group ↔ User (con roles)
- [ ] Relación Group ↔ Subscription
- [ ] Migrations

### Funcionalidades
- [ ] POST /groups (crear grupo)
- [ ] GET /groups (mis grupos)
- [ ] POST /groups/:id/invite (invitar usuarios)
- [ ] PUT /groups/:id/members/:userId (cambiar rol)
- [ ] DELETE /groups/:id/members/:userId
- [ ] Validación de roles (owner, admin, member)
- [ ] Límites según suscripción

### Tareas Subtotales
**Puntos:** 11  
**Prioridad:** 🟠 ALTA  
**Tiempo:** 4-5 días

---

## Semana 10: Sistema de Pagos

### Stripe Integration
- [ ] Setup de Stripe
- [ ] Webhook handlers
- [ ] Crear productos en Stripe
- [ ] Endpoint POST /payments/checkout
- [ ] Endpoint POST /payments/webhook
- [ ] Actualización automática de suscripción
- [ ] Manejo de cancelaciones

### Seguridad
- [ ] Validación de webhooks
- [ ] Idempotencia
- [ ] Logging de pagos

### Tareas Subtotales
**Puntos:** 10  
**Prioridad:** 🔴 CRÍTICA  
**Tiempo:** 4-5 días

---

## Semana 11: Categorías & Organización

### Categorías
- [ ] Modelo Category
- [ ] Relación Document ↔ Category
- [ ] POST /categories (crear)
- [ ] GET /categories (listar)
- [ ] PUT /categories/:id
- [ ] DELETE /categories/:id

### Búsqueda Avanzada
- [ ] Full-text search (PostgreSQL)
- [ ] Filtros por categoría, fecha, tipo
- [ ] Endpoint GET /documents/search
- [ ] Indexación

### Tareas Subtotales
**Puntos:** 9  
**Prioridad:** 🟢 MEDIA  
**Tiempo:** 3-4 días

---

## Semana 12: Testing & Refinamiento

### Testing Completo
- [ ] Unit tests (80% coverage)
- [ ] Integration tests
- [ ] E2E tests (endpoints críticos)
- [ ] Tests de carga

### Documentación
- [ ] API docs (Swagger)
- [ ] Setup guide
- [ ] Troubleshooting

### Performance
- [ ] Optimización de queries
- [ ] Índices de BD
- [ ] Caché estratégico

### Tareas Subtotales
**Puntos:** 12  
**Prioridad:** 🟠 ALTA  
**Tiempo:** 4-5 días

---

## ✅ Entregables Fase 3

```
API ENDPOINTS ADICIONALES:
✅ POST   /groups
✅ GET    /groups
✅ POST   /groups/:id/invite
✅ PUT    /groups/:id/members/:userId
✅ DELETE /groups/:id/members/:userId
✅ POST   /payments/checkout
✅ POST   /payments/webhook
✅ POST   /categories
✅ GET    /categories
✅ GET    /documents/search

TOTAL ENDPOINTS BACKEND: 25+

MÉTRICAS:
- Testing coverage: ~85%
- Documentación API: Completa (Swagger)
- Performance: <200ms en 95% requests
- Seguridad: OWASP Top 10 completo
```

---

# FASE 4: Frontend Completo & Deploy (Semanas 13-16)

## Semana 13: Integración Frontend-Backend

### Auth en Frontend
- [ ] Integración con endpoints de auth
- [ ] Manejo de JWT
- [ ] Refresh token automático
- [ ] Protected routes
- [ ] Persistencia de sesión

### Dashboard & Upload
- [ ] Conectar upload a API
- [ ] Progress bar
- [ ] Manejo de errores
- [ ] Feedback visual

### Tareas Subtotales
**Puntos:** 10  
**Prioridad:** 🔴 CRÍTICA

---

## Semana 14: Interfaces de Procesamiento

### Componentes IA
- [ ] Interfaz de OCR
- [ ] Visualización de resúmenes
- [ ] Renderer de mapas mentales
- [ ] Renderer de mapas conceptuales
- [ ] Panel de traducción
- [ ] Visualización de resultados

### Real-time Updates
- [ ] WebSocket para jobs
- [ ] Notificaciones
- [ ] Progress tracking

### Tareas Subtotales
**Puntos:** 12  
**Prioridad:** 🟠 ALTA

---

## Semana 15: Planes & Checkout

### Suscripción UI
- [ ] Página de planes
- [ ] Tabla comparativa
- [ ] Integración con Stripe checkout
- [ ] Account settings
- [ ] Historial de pagos

### Grupo UI
- [ ] Panel de grupos
- [ ] Invitaciones
- [ ] Gestión de miembros

### Tareas Subtotales
**Puntos:** 11  
**Prioridad:** 🟠 ALTA

---

## Semana 16: Testing, Optimización & Deploy

### Frontend Testing
- [ ] Tests unitarios (60%)
- [ ] Tests de integración
- [ ] Tests visuales

### Optimización
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Asset optimization
- [ ] Performance audit

### Deploy
- [ ] CI/CD (GitHub Actions)
- [ ] Staging environment
- [ ] Producción
- [ ] Monitoring

### Tareas Subtotales
**Puntos:** 14  
**Prioridad:** 🔴 CRÍTICA

---

## ✅ Entregables Fase 4

```
FRONTEND COMPLETADO:
✅ Sistema de autenticación funcional
✅ Dashboard con estadísticas
✅ Upload y gestión de documentos
✅ Interfaz de procesamiento IA
✅ Visualización de mapas
✅ Panel de suscripción
✅ Gestión de grupos
✅ Búsqueda avanzada
✅ Responsive design (mobile)
✅ Dark mode (opcional)

PROYECTO EN PRODUCCIÓN:
✅ Backend en Railway/Render
✅ Frontend en Vercel
✅ BD PostgreSQL en cloud
✅ MinIO en AWS S3 (migrado)
✅ Redis en AWS ElastiCache
✅ CI/CD con GitHub Actions
✅ Monitoreo y alertas
✅ Backups automatizados
```

---

# 📈 Resumen de Progreso

```
FASE 1: MVP Backend           ████████████████░░░░░░░░░░░░ 40%
FASE 2: IA Processing         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
FASE 3: Grupos & Pagos        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%
FASE 4: Frontend & Deploy     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%

TOTAL TAREAS: 147
TOTAL PUNTOS: ~250 story points
VELOCIDAD RECOMENDADA: 60 puntos/semana
```

---

# 🎮 Dependencias entre Fases

```
FASE 1 (Backend Base)
  ↓
FASE 2 (Servicios IA) - Requiere Fase 1 ✓
  ↓
FASE 3 (Negocio) - Requiere Fase 1 y 2
  ↓
FASE 4 (Frontend) - Requiere todas
```

---

# 📊 Métricas de Éxito

| Métrica | Meta | Check |
|---------|------|-------|
| **Coverage de tests** | >80% | ✓ |
| **Response time API** | <200ms (p95) | ✓ |
| **Uptime** | 99.5% | ✓ |
| **Documentación** | 100% APIs | ✓ |
| **Security** | OWASP Top 10 | ✓ |
| **Load capacity** | 1000 req/s | ✓ |
| **Mobile responsive** | 100% | ✓ |

---

# 🔄 Retroalimentación

Después de cada fase:
- [ ] Review de código
- [ ] Testing completo
- [ ] Feedback de usuario (si aplica)
- [ ] Ajuste de timeline si es necesario
- [ ] Documentación actualizada

**Próxima revisión:** Fin de Semana 4 (Fase 1)

---

*Última actualización: Enero 29, 2026*
*Documento vivo - Se actualiza según progreso*
