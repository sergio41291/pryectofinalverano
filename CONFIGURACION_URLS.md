# 🔧 Configuración de URLs - API y WebSocket

## 📋 Resumen

Las URLs del backend y WebSocket ahora se configuran dinámicamente desde variables de entorno:

- **En desarrollo**: Lee desde archivos `.env`
- **En producción**: Usa automáticamente el mismo host que el cliente

---

## 🌍 Variables de Entorno

### Backend (raíz del proyecto)

**Archivo: `.env`**

```env
# URL base del backend (usado en el frontend)
BACKEND_URL=http://localhost:3000

# URL de WebSocket (puede ser diferente si está detrás de un proxy)
WEBSOCKET_URL=http://localhost:3000
```

### Frontend

**Archivo: `frontend/.env`**

```env
# URL base del backend (para API calls)
VITE_BACKEND_URL=http://localhost:3000

# URL para WebSocket (comunicación en tiempo real)
VITE_WEBSOCKET_URL=http://localhost:3000

# Full API URL (combinación de BACKEND_URL + prefix)
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 🏗️ Arquitectura de Configuración

### Frontend Config (`frontend/src/config/api.ts`)

```typescript
import { API_CONFIG } from '../config/api';

// USA:
console.log(API_CONFIG.apiUrl);        // http://localhost:3000
console.log(API_CONFIG.websocketUrl);  // http://localhost:3000
console.log(API_CONFIG.apiPrefix);     // /api/v1
```

**Comportamiento automático:**

```typescript
// 🔨 DESARROLLO (npm run dev)
const wsUrl = 'http://localhost:3000'  // Lee de VITE_WEBSOCKET_URL

// 📦 PRODUCCIÓN (npm run build)
const wsUrl = window.location.origin  // Same host as client
// Ejemplo: Si accedes desde https://ejemplo.com:3000
// → conectará a: wss://ejemplo.com:3000
```

---

## 🧪 Ejemplos de Configuración

### 🏠 Desarrollo Local

```env
# .env (backend)
BACKEND_URL=http://localhost:3000
WEBSOCKET_URL=http://localhost:3000

# frontend/.env
VITE_BACKEND_URL=http://localhost:3000
VITE_WEBSOCKET_URL=http://localhost:3000
```

**Resultado:**
- Frontend en: `http://localhost:5173`
- Backend en: `http://localhost:3000`
- WebSocket: `ws://localhost:3000`

### 🚀 Producción (DigitalOcean, AWS, etc.)

```env
# .env (backend)
BACKEND_URL=https://api.ejemplo.com
WEBSOCKET_URL=https://api.ejemplo.com

# frontend/.env
VITE_BACKEND_URL=https://api.ejemplo.com
VITE_WEBSOCKET_URL=https://api.ejemplo.com
```

**Build estático (recomendado):**

```bash
npm run build
# Cuando hace deploy, el frontend detectará automáticamente:
# - API en: https://api.ejemplo.com
# - WebSocket en: wss://api.ejemplo.com
```

### 🌐 Mismo Dominio

```env
# .env (backend)
BACKEND_URL=http://localhost:3000
WEBSOCKET_URL=http://localhost:3000

# frontend/.env
# Dejar vacío o usar /
VITE_BACKEND_URL=/
VITE_WEBSOCKET_URL=/
```

---

## 🔌 Cómo el Frontend Conecta

### Configuración en `useOcrProgress.ts`

```typescript
import { API_CONFIG } from '../config/api';

const newSocket = io(API_CONFIG.apiUrl, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

**Logs de depuración:**

```javascript
// En la consola del navegador:
console.log(`Conectando a Socket.io en: ${API_CONFIG.apiUrl}`);
// Output: "Conectando a Socket.io en: http://localhost:3000"
```

---

## 📱 Flujo de Conexión

```
User abre frontend en http://localhost:5173
              ↓
        Lee VITE_WEBSOCKET_URL = http://localhost:3000
              ↓
      Crea Socket.io connection
              ↓
      ws://localhost:3000/socket.io/
              ↓
      Backend recibe conexión
              ↓
      Escucha eventos: ocr:uploading, ocr:extracting, etc.
```

---

## ✅ Checklist de Configuración

- [ ] `.env` (root) tiene `BACKEND_URL` y `WEBSOCKET_URL`
- [ ] `frontend/.env` tiene `VITE_BACKEND_URL` y `VITE_WEBSOCKET_URL`
- [ ] Ambos apuntan al mismo servidor (o compatible)
- [ ] En desarrollo: usar `localhost:3000`
- [ ] En producción: usar dominio real (ej: `api.ejemplo.com`)
- [ ] Backend listening en puerto configurado
- [ ] Frontend compila sin errores: `npm run build`

---

## 🐛 Debugging de Conexión

### Verificar en Browser Console (F12)

```javascript
// Debería mostrar:
"Conectando a Socket.io en: http://localhost:3000"
"Socket.io conectado exitosamente"

// Si hay error:
"Socket.io error: Error connecting to server"
// → Verificar que backend esté running
// → Verificar URL en .env es correcta
// → Verificar CORS configuration en backend
```

### Verificar en Backend Logs

```bash
# Debería mostrar:
[Nest] ... LOG [OcrWebSocketGateway] Client connected: socket-id-123
[Nest] ... LOG [OcrWebSocketGateway] User userId authenticated with socket socket-id-123
```

---

## 🔄 Cambiar URLs en Runtime

**No es recomendado, pero si es necesario:**

```typescript
// Editar frontend/src/config/api.ts
export const API_CONFIG = {
  apiUrl: 'http://nuevo-servidor:3000',
  websocketUrl: 'http://nuevo-servidor:3000',
  apiPrefix: '/api/v1',
};
```

**Mejor alternativa:** Cambiar `.env` y rebuildar.

---

## 📚 Variables de Referencia Rápida

| Variable | Ubicación | Propósito | Ejemplo |
|----------|-----------|----------|---------|
| `BACKEND_URL` | `.env` (root) | Backend URL (información) | `http://localhost:3000` |
| `WEBSOCKET_URL` | `.env` (root) | WebSocket URL (información) | `http://localhost:3000` |
| `VITE_BACKEND_URL` | `frontend/.env` | API base URL usado por frontend | `http://localhost:3000` |
| `VITE_WEBSOCKET_URL` | `frontend/.env` | Socket.io URL usado por frontend | `http://localhost:3000` |
| `VITE_API_URL` | `frontend/.env` | URL completa con /api/v1 | `http://localhost:3000/api/v1` |

---

**✨ Las URLs ahora son dinámicas y fáciles de cambiar sin tocar código!**
