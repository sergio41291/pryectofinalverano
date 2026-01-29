# Phase 1 - Guía de Inicio Rápido

## Resumen

Phase 1 de LearnMind AI implementa:
- ✅ Backend NestJS con autenticación JWT
- ✅ Frontend React con dashboard de 4 secciones
- ✅ OCR con Paddle OCR vía Python
- ✅ WebSocket real-time notifications
- ✅ PostgreSQL + Redis + Bull queue
- 🚀 Testing suite (unit, E2E, load tests)

## Requisitos Previos

```bash
# Sistema
- Node.js >= 18.0
- Python >= 3.8
- PostgreSQL 16 running
- Redis running

# Verificar instalaciones
node --version      # v18.x or higher
npm --version       # 9.x or higher
python --version    # 3.8+
psql --version      # 16.x
redis-cli ping      # PONG

# Para load testing
npm install -g artillery
```

## Instalación

### 1. Backend Setup (15 minutos)

```bash
cd backend

# Instalar dependencias Node
npm install

# Instalar dependencias Python
pip install -r requirements.txt

# Verificar ambiente
bash verify-environment.sh
```

### 2. Frontend Setup (5 minutos)

```bash
cd ../frontend

# Instalar dependencias
npm install
```

### 3. Base de Datos (2 minutos)

```bash
# La sincronización ocurre automáticamente via TypeORM
# Verifica que PostgreSQL esté corriendo en localhost:5432

# Opcional: Ver tabla de usuarios
psql -U postgres -d learpmind -c "SELECT * FROM users;"
```

## Ejecución

### Opción A: En Windows PowerShell (Recomendado)

```powershell
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Tests
cd backend
bash run-tests.sh
```

### Opción B: En Git Bash

```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Tests
cd backend && bash run-tests.sh
```

## Flujo de Prueba Completo

### 1. Verificar Backend

```bash
# Health check
curl http://localhost:3001/api/health
# Respuesta esperada: { "status": "ok" }
```

### 2. Acceder al Frontend

```
http://localhost:5173
```

**Flujo de prueba:**
1. Registrarse con credenciales
   - Email: `test@learmmind.ai`
   - Contraseña: `Test123!Secure` (cumple todos los requisitos)
2. Se valida que la contraseña tenga:
   - ✅ Al menos 8 caracteres
   - ✅ Una letra mayúscula  
   - ✅ Un número
   - ✅ Un carácter especial
3. Acceder al dashboard
4. Navegar a "IA Lab" → "Resumen Automático"
5. Seleccionar un archivo (PDF, imagen o audio)
6. Esperar a que se procese el OCR
7. Ver el resultado extraído en el modal

### 3. Ejecutar Tests

```bash
cd backend

# Opción 1: Test suite completo (recomendado)
bash run-tests.sh

# Opción 2: Tests específicos
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Con coverage
```

## Resultados Esperados

### Health Check ✅
```
GET http://localhost:3001/api/health
→ HTTP 200 { "status": "ok" }
```

### Flujo de Autenticación ✅
```
1. POST /api/auth/register → HTTP 201
2. POST /api/auth/login → HTTP 200 (token + userId)
3. GET /api/users/profile → HTTP 200 (con Authorization header)
```

### Flujo de Upload + OCR ✅
```
1. POST /api/uploads (multipart/form-data)
   → HTTP 201 { id, uploadId }

2. POST /api/ocr/:uploadId/process
   → HTTP 201 { jobId, status: "pending" }

3. WebSocket recibe: ocr_completed
   → { uploadId, extractedText, confidence }

4. GET /api/ocr/:uploadId
   → HTTP 200 { status: "completed", extractedText }
```

### Load Testing ✅
```
Escenarios:
- Auth: 100 requests (register, login, profile)
- Upload: 100 requests (POST/GET uploads)
- OCR: 50 requests (process, get results)
- WebSocket: 20 conexiones simultáneas

Métricas esperadas:
- p50 latency: < 200ms
- p95 latency: < 500ms
- p99 latency: < 1000ms
- Error rate: < 1%
```

## Verificación Rápida

```bash
# 1. ¿Backend corriendo?
curl -s http://localhost:3001/api/health | jq .

# 2. ¿Base de datos conectada?
psql -U postgres -d learpmind -c "\dt"

# 3. ¿Redis disponible?
redis-cli ping

# 4. ¿Python OCR funcionando?
python backend/scripts/paddle_ocr_service.py --help

# 5. ¿Frontend compilando?
cd frontend && npm run build
```

## Troubleshooting

### Error: "PaddleOCR not found"
```bash
pip install -r requirements.txt --upgrade
```

### Error: "TypeORM - skip value is not a number"
```bash
# Actualizar uploads.controller.ts con ParseIntPipe
# Este error está RESUELTO en el código actual
```

### Error: "WebSocket connection failed"
```bash
# Verifica que:
1. Backend está corriendo en puerto 3001
2. Frontend está en puerto 5173
3. El userId se guardó en localStorage
```

### Error: "Connection refused (PostgreSQL)"
```bash
# Inicia PostgreSQL
# Windows: Services → PostgreSQL → Start
# Linux: sudo systemctl start postgresql
```

## Arquitectura

```
┌─────────────────────────────────────────────┐
│            React Frontend (5173)              │
│  ┌─────────────────────────────────────┐   │
│  │  SummaryModal (Smart File Selection) │   │
│  │  ├─ Nuevo Archivo (Upload)           │   │
│  │  └─ Archivos Existentes (OCR Cache)  │   │
│  └─────────────────────────────────────┘   │
└──────────────────┬──────────────────────────┘
                   │ HTTP + WebSocket
┌──────────────────┴──────────────────────────┐
│          NestJS Backend (3001)               │
│  ┌──────────────────────────────────────┐  │
│  │  Auth Module (JWT)                   │  │
│  │  Upload Service (File Validation)    │  │
│  │  OCR Service (Bull Queue)            │  │
│  │  OCR Processor (Python Paddle OCR)   │  │
│  │  OCR Cache Service (Redis)           │  │
│  │  WebSocket Gateway (Real-time)       │  │
│  └──────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
        ┌─────────┼─────────┐
        │         │         │
    ┌───▼──┐ ┌───▼──┐ ┌───▼──┐
    │  PG  │ │Redis │ │Python│
    │  16  │ │      │ │ OCR  │
    └──────┘ └──────┘ └──────┘
```

## Próximos Pasos (Phase 2)

Una vez completada Phase 1:

1. **Integración Claude API**
   - Implementar endpoint `/api/ai/summarize`
   - Usar extracted OCR text como input
   - Guardar resumen generado

2. **Questionnaire Generator**
   - Reutilizar mismo modal de SummaryModal
   - Generar preguntas desde OCR text
   - Almacenar cuestionarios

3. **Advanced Features**
   - Translator (multiidioma)
   - Quiz evaluator
   - Learning analytics

## Soporte

Para reportar issues o hacer preguntas:
1. Revisar logs: `backend/test-results-*.log`
2. Verificar ambiente: `bash backend/verify-environment.sh`
3. Consultar PHASE_1_OCR_GUIDE.md para detalles técnicos

---

**Estado Actual:** Phase 1 - MVP Complete ✅
**Próximo Sprint:** Phase 2 - Claude API Integration 🚀
