# 🚀 Testing Local - Sin Docker (Más Rápido)

## Estado Actual

- **Backend**: Compilando OK, pero falla conectar a MinIO y PostgreSQL en Docker
- **Solución**: Testear con archivo mock, sin depender de servicios reales

## 🎯 Plan Simplificado para Testing

### Opción A: Testear SOLO Frontend (Sin Backend)

Si solo quieres ver que el frontend funciona visualmente:

```bash
cd frontend
npm run dev
# Abre http://localhost:5173
```

**Limitaciones**: 
- No puedes hacer login (no hay backend)
- No puedes subir archivos
- Solo UI estática

### Opción B: Testear Backend + Frontend (Recomendado)

**Paso 1: Crear base de datos PostgreSQL**

```bash
# Usar PostgreSQL local o Docker sin compose
docker run -d \
  --name learpmind_pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=learpmind \
  -p 5432:5432 \
  postgres:16-alpine
```

**Paso 2: Esperar a que esté listo y luego iniciar backend**

```bash
cd backend
npm run start:dev
# Backend debería correr en http://localhost:3001
# Ignorará el error de MinIO (no es crítico para tests)
```

**Paso 3: En otra terminal, iniciar frontend**

```bash
cd frontend
npm run dev
# Frontend en http://localhost:5173
```

### Opción C: Testear SOLO Backend API (SIN UI)

```bash
# Iniciar solo backend
cd backend
npm run start:dev

# En otra terminal, probar endpoints con curl:
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

## ⚠️ Problemas Actuales

### MinIO
- Error: "Signature does not match"
- **Solución**: Deshabilitarlo en modulo.ts o usar mock

### PostgreSQL
- Necesita estar creada antes de que arranque NestJS
- **Solución**: Crear contenedor Docker simple antes

## 📋 Mi Recomendación

**Haz esto ahora**:

```bash
# Terminal 1: Crear PostgreSQL
docker run -d --name learpmind_pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=learpmind -p 5432:5432 postgres:16-alpine

# Terminal 2: Backend
cd backend && npm run start:dev

# Terminal 3: Frontend  
cd frontend && npm run dev

# Luego probar en http://localhost:5173
```

**Si eso falla**, entonces revisamos los errores específicos.
