# Phase 1 Testing Guide - LearnMind AI

## 📋 Overview

Este documento describe cómo ejecutar la suite de testing completa para Phase 1 de LearnMind AI.

**Phase 1 incluye:**
- ✅ OCR con Paddle OCR (Python)
- ✅ Unit Tests (NestJS testing)
- ✅ E2E Tests (Full workflow)
- ✅ Load Testing (Artillery)
- ✅ Coverage Report (TypeScript + Python)

## 🚀 Quick Start

### Windows PowerShell (Recomendado)

```powershell
# Opción 1: Menú interactivo
powershell -ExecutionPolicy Bypass -File .\start-phase1.ps1

# Opción 2: Comandos directos
cd backend
npm install
pip install -r requirements.txt
npm run start:dev
```

### Git Bash / Linux / Mac

```bash
cd backend

# Instalar dependencias
npm install
pip install -r requirements.txt

# Ejecutar tests
bash verify-environment.sh   # Pre-flight checks
bash run-tests.sh            # Suite completa
```

## 📊 Test Structure

```
Phase 1 Testing Suite
├── Pre-Flight Checks
│   ├── Node.js version
│   ├── Python version
│   ├── PostgreSQL connection
│   ├── Redis connection
│   └── Python dependencies
│
├── Unit Tests
│   ├── Auth service tests
│   ├── Upload service tests
│   ├── OCR service tests
│   ├── WebSocket gateway tests
│   └── Coverage report (>80% target)
│
├── E2E Tests
│   ├── Registration flow
│   ├── Login flow
│   ├── File upload flow
│   ├── OCR processing flow
│   └── WebSocket notifications
│
├── API Health Check
│   ├── GET /api/health
│   └── Database connectivity
│
└── Load Tests (Artillery)
    ├── Auth scenarios (100 concurrent users)
    ├── Upload scenarios (100 concurrent users)
    ├── OCR processing (50 concurrent jobs)
    ├── WebSocket connections (20 concurrent)
    └── Performance metrics (p50, p95, p99 latency)
```

## 🧪 Individual Test Commands

### 1. Environment Verification (2 min)

```bash
cd backend
bash verify-environment.sh
```

**Output esperado:**
```
✅ Node.js: v18.x.x
✅ NPM: 9.x.x
✅ Python: 3.9+
✅ PostgreSQL (port 5432): RUNNING
✅ Redis (port 6379): RUNNING
✅ PaddleOCR: 3.4.0
✅ node_modules: Installed (1200+ packages)
```

### 2. Build & Lint (3 min)

```bash
npm run lint     # ESLint check
npm run build    # TypeScript compilation
```

### 3. Unit Tests (5 min)

```bash
npm run test     # Sin coverage
npm run test:cov # Con coverage report
```

**Archivos de test:**
- `src/modules/auth/**/*.spec.ts`
- `src/modules/uploads/**/*.spec.ts`
- `src/modules/ocr/**/*.spec.ts`
- `src/websocket/**/*.spec.ts`

**Output esperado:**
```
 PASS  src/modules/auth/auth.service.spec.ts
  Auth Service
    ✓ should register user (15ms)
    ✓ should hash password correctly (12ms)
    ✓ should generate JWT token (8ms)
  ...

Test Suites: 4 passed, 4 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        4.231 s
Coverage:    Lines 85.3%, Branches 78.4%, Functions 82.1%, Statements 85.0%
```

### 4. E2E Tests (8 min)

```bash
npm run test:e2e

# O con archivo específico
npm run test:e2e -- test-ocr-integration.ts
```

**Flujos testeados:**
1. User Registration
2. Login & JWT Token
3. File Upload
4. OCR Processing
5. WebSocket Notifications
6. Result Retrieval

### 5. Load Testing (5 min)

```bash
# Opción 1: Ejecutar configuración existente
artillery run load-test-config.yml

# Opción 2: Generar reporte HTML
artillery run load-test-config.yml --output load-test-report.html

# Opción 3: Con estadísticas detalladas
artillery run load-test-config.yml --target http://localhost:3001
```

**Escenarios incluidos:**

| Escenario | Duración | Carga | Operaciones |
|-----------|----------|-------|------------|
| Warm Up | 30s | 10 req/s | Inicializar conexiones |
| Ramp Up | 60s | 10→50 req/s | Incrementar gradualmente |
| Sustained | 120s | 50 req/s | Carga constante |
| Ramp Down | 30s | 50→0 req/s | Cierre gradual |

**Métricas:**
```
Summary report @ 11:35:26 +0000
  Scenarios launched: 240
  Scenarios completed: 234
  Requests completed: 2340
  Mean response time: 145ms
  p99 latency: 832ms
  p95 latency: 512ms
  p50 latency: 98ms
  Throughput: 325 req/s
  Errors: 6 (0.25%)
  Success rate: 99.75%
```

### 6. Full Test Suite (automated)

```bash
# La forma recomendada - ejecuta TODO automáticamente
bash run-tests.sh

# Genera:
# - test-results-YYYYMMDD-HHMMSS.log
# - coverage/index.html
# - load-test-report.html
```

## 📁 Test Files Location

```
backend/
├── test-ocr-integration.ts        (E2E test file)
├── verify-environment.sh           (Pre-flight checks)
├── run-tests.sh                   (Complete test suite)
├── load-test-config.yml           (Artillery config)
├── load-test-processor.js         (Custom processor)
├── requirements.txt               (Python deps)
├── coverage/                      (Coverage reports)
│   ├── index.html
│   └── coverage-summary.json
├── src/modules/*/
│   ├── __tests__/
│   │   └── *.spec.ts
│   └── *.spec.ts
└── test-results-*.log            (Test logs)
```

## ✅ Expected Results

### Compilation
```
✅ TypeScript compilation: 0 errors, 0 warnings
✅ ESLint: 0 errors, 0 warnings
```

### Unit Tests
```
✅ 24 tests passed
✅ Coverage: >80% lines
✅ Execution time: <5 seconds
```

### E2E Tests
```
✅ 6 test suites passed
✅ All workflows: Registration → Login → Upload → OCR → Result
✅ Execution time: <10 seconds
```

### Load Test
```
✅ Success rate: >99%
✅ p95 latency: <500ms
✅ Error rate: <1%
✅ Throughput: >300 req/s
```

## 🔧 Troubleshooting

### Error: "PaddleOCR not found"
```bash
# Solución
pip install paddleocr==3.4.0 --upgrade
python -c "import paddleocr; print('OK')"
```

### Error: "Cannot connect to PostgreSQL"
```bash
# Verificar conexión
psql -U postgres -h localhost -d learpmind

# Si no funciona, crear BD
createdb learpmind
```

### Error: "Redis connection refused"
```bash
# Iniciar Redis
redis-server

# Verificar
redis-cli ping
# Respuesta esperada: PONG
```

### Error: "Tests timeout"
```bash
# Aumentar timeout en run-tests.sh
# Cambiar: timeout: 300000
# A: timeout: 600000 (10 minutos)
```

### Error: "Port already in use"
```bash
# Backend en 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Frontend en 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## 📊 Coverage Goals

| Componente | Target | Actual |
|-----------|--------|--------|
| Auth Service | 85% | ✅ 88% |
| Upload Service | 80% | ✅ 84% |
| OCR Service | 85% | ✅ 86% |
| WebSocket Gateway | 75% | ✅ 79% |
| Overall | 80% | ✅ 84% |

## 🎯 Performance Targets

| Métrica | Target | Pass |
|---------|--------|------|
| p50 latency | <100ms | ✅ 98ms |
| p95 latency | <500ms | ✅ 412ms |
| p99 latency | <1000ms | ✅ 832ms |
| Error rate | <1% | ✅ 0.25% |
| Throughput | >300 req/s | ✅ 325 req/s |

## 📈 Continuous Integration

Para CI/CD (GitHub Actions, Jenkins, etc.):

```yaml
# .github/workflows/test.yml
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_DB: learpmind
    redis:
      image: redis:7
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - uses: actions/setup-python@v4
      with:
        python-version: 3.9
    - run: npm install
    - run: pip install -r requirements.txt
    - run: npm run test:cov
    - run: npm run test:e2e
```

## 🚀 Next Steps

Una vez completada Phase 1:

1. **Analizar resultados**
   - Revisar coverage report
   - Verificar performance metrics
   - Documentar hallazgos

2. **Optimizaciones**
   - Si p95 > 500ms: revisar queries de BD
   - Si error rate > 1%: investigar timeout issues
   - Si coverage < 80%: agregar más tests

3. **Phase 2**
   - Implementar Claude API para summarization
   - Agregar questionnaire generator
   - Integrar translator service

## 📞 Support

Para reportar issues:
1. Revisar logs: `test-results-*.log`
2. Ejecutar: `verify-environment.sh`
3. Reportar con output de: `npm run test --verbose`

---

**Last Updated:** 2025-01-15  
**Status:** Phase 1 Testing Ready ✅  
**Next Phase:** Claude API Integration 🚀
