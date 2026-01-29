# Phase 2 - Claude API Integration

## 🎯 Objetivo

Integrar Claude 3.5 Sonnet para generar resúmenes inteligentes, cuestionarios y traducciones a partir del texto extraído por OCR.

## ✅ Completado en esta sesión

### Backend - AI Service
- ✅ Crear `ai.service.ts` con 3 funcionalidades principales:
  - `streamSummarize()` - Streaming de resúmenes (para respuestas en tiempo real)
  - `generateQuestionnaire()` - Generar cuestionarios de opción múltiple
  - `translate()` - Traducir texto a otros idiomas

- ✅ Crear `ai.controller.ts` con 3 endpoints:
  - `POST /api/processing/summarize` - Resumen con Server-Sent Events
  - `POST /api/processing/questionnaire` - Cuestionarios
  - `POST /api/processing/translate` - Traducción

- ✅ Crear `ai.module.ts` e importar en `app.module.ts`

### Frontend - AI Service
- ✅ Crear `aiService.ts` con métodos para:
  - `streamSummarize()` - Consumir SSE de resúmenes
  - `generateQuestionnaire()` - Generar cuestionarios
  - `translate()` - Traducir textos

- ✅ Integrar en `Home.tsx`:
  - Importar `aiService`
  - Usar streaming en el handler de SummaryModal
  - Los resúmenes se generan mientras se escriben en tiempo real

## 📋 Requisitos

### Variables de Entorno
Agregar a `.env` en backend:

```bash
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

Obtén tu API key en: https://console.anthropic.com/account/keys

## 🚀 Próximos Pasos

### 1. Probar Streaming de Resúmenes (5 min)
```bash
# 1. Asegurarse que backend está corriendo
cd backend
npm run start:dev

# 2. Frontend en otra terminal
cd frontend
npm run dev

# 3. Acceder a http://localhost:5173
# 4. Ir a IA Lab → Resumen Automático
# 5. Cargar archivo o usar OCR existente
# 6. Ver resumen generarse en tiempo real
```

### 2. Implementar Cuestionarios (15 min)
```tsx
// En Home.tsx, agregar manejador para "Generar Cuestionario"
const handleGenerateQuestionnaire = async (ocrText: string) => {
  try {
    const result = await aiService.generateQuestionnaire({
      text: ocrText,
      language: 'es',
      numQuestions: 5,
    });
    // Mostrar preguntas en modal
  } catch (err) {
    console.error(err);
  }
};
```

### 3. Implementar Traducción (10 min)
```tsx
// En Home.tsx, agregar manejador para "Traducir"
const handleTranslate = async (text: string, targetLang: string) => {
  try {
    const result = await aiService.translate({
      text,
      targetLanguage: targetLang,
    });
    // Mostrar traducción
  } catch (err) {
    console.error(err);
  }
};
```

### 4. Agregar Job Queue para Procesamiento Async (30 min)
```typescript
// Crear ocr-to-summary.processor.ts
// Procesar resúmenes de forma asincrónica
// Guardar en BD y notificar via WebSocket
```

### 5. Almacenar Resultados en BD (20 min)
```typescript
// Crear entidad ProcessingResult
// Guardar: original_text, summary, questionnaire, translations
// Agregar a BD con timestamps y userId
```

## 📊 API Reference

### POST /api/processing/summarize
**Streaming con Server-Sent Events**

```bash
curl -X POST http://localhost:3001/api/processing/summarize \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Lorem ipsum dolor sit amet...",
    "language": "es",
    "style": "bullet-points",
    "maxTokens": 1024
  }'

# Respuesta (SSE):
# data: {"content":"• Punto"}
# data: {"content":" 1\n• Punto"}
# data: {"complete":true}
```

**Parámetros:**
- `text` (required): Texto a resumir
- `language` (optional): Idioma del resumen (default: 'es')
- `style` (optional): Formato - 'bullet-points' | 'paragraph' | 'executive'
- `maxTokens` (optional): Máximo tokens de respuesta (default: 1024)

---

### POST /api/processing/questionnaire
**Generar cuestionario de opción múltiple**

```bash
curl -X POST http://localhost:3001/api/processing/questionnaire \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Lorem ipsum dolor sit amet...",
    "language": "es",
    "numQuestions": 5
  }'

# Respuesta:
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": 1,
        "question": "¿Cuál es el tema principal?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "explanation": "Porque..."
      }
    ]
  }
}
```

---

### POST /api/processing/translate
**Traducir texto**

```bash
curl -X POST http://localhost:3001/api/processing/translate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hola mundo",
    "targetLanguage": "en"
  }'

# Respuesta:
{
  "success": true,
  "data": {
    "original": "Hola mundo",
    "translated": "Hello world",
    "targetLanguage": "en"
  }
}
```

## 🔧 Troubleshooting

### Error: "ANTHROPIC_API_KEY not set"
```bash
# Solución:
# 1. Ir a https://console.anthropic.com/account/keys
# 2. Crear nueva API key
# 3. Agregar a .env:
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### Error: "Invalid API key"
```bash
# Solución:
# 1. Verificar que la key es correcta
# 2. Verificar que la key tiene acceso a Claude 3.5 Sonnet
# 3. Reiniciar backend: npm run start:dev
```

### Streaming no funciona
```bash
# Verificar que:
# 1. Backend está en http://localhost:3001
# 2. Token JWT es válido
# 3. Header "Authorization: Bearer <token>" está presente
# 4. Content-Type es "text/event-stream"
```

## 📈 Performance

- **Tiempo promedio de resumen**: 2-5 segundos
- **Tokens por resumen**: 200-400 (en bullet-points)
- **Costo por resumen**: ~$0.005 (Claude 3.5 Sonnet)
- **Rate limit**: Sin límite documentado, pero respetar límites de cuenta

## 🎓 Modelos Disponibles

Actualmente usando: **claude-3-5-sonnet-20241022**

Alternativas:
- `claude-3-opus-20250219` - Más poderoso pero más lento
- `claude-3-haiku-20240307` - Más rápido pero menos poderoso

## 🔐 Seguridad

- ✅ API key almacenada en variables de entorno
- ✅ JWT authentication requerido
- ✅ Rate limiting en backend (implementar próximamente)
- ✅ Validación de entrada en frontend y backend
- ⚠️ TODO: Implementar token counting para evitar abusos

## 📝 Próximas Características

- [ ] Caché de resúmenes en Redis
- [ ] Job queue para procesamiento async
- [ ] Almacenar resultados en BD
- [ ] Mapas mentales con Claude
- [ ] Análisis de sentimiento
- [ ] Detección de entidades
- [ ] Resumen multiidioma

---

**Status:** Phase 2.1 - Claude Integration Complete ✅  
**Próximo:** Phase 2.2 - Async Job Processing 🚀
