# 🌊 Claude API Streaming para LearnMind AI

## 📌 ¿Qué es Streaming?

**Streaming** es una técnica que permite recibir respuestas de IA en tiempo real, palabra por palabra, en lugar de esperar a que se complete toda la respuesta.

### Ejemplo Sin Streaming (Tradicional)
```javascript
// Usuario espera... 3 segundos
const response = await claude.complete(largeText);
// Recibe TODO de golpe: "El resumen es: ..."
```

### Ejemplo Con Streaming (Lo que haremos)
```javascript
// Usuario ve texto aparecer en tiempo real
const stream = await claude.stream(largeText);
// Recibe palabra por palabra:
// "El" → "resumen" → "es:" → ...
```

---

## ✅ SÍ, CLAUDE SOPORTA STREAMING

**Sí**, Anthropic Claude API soporta streaming completo y es perfecto para:
- ✅ Resúmenes largos (el usuario ve el progreso)
- ✅ Traducciones (aparecen mientras se procesan)
- ✅ Análisis detallados (feedback en tiempo real)
- ✅ Textos OCR grandes (procesamiento incremental)

---

## 🏗️ Arquitectura con Streaming

### Flujo para Resúmenes

```
┌─────────────┐
│ Usuario     │
│ Sube PDF    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Backend NestJS          │
│ 1. Extrae texto (OCR)   │
│ 2. Conecta a Claude     │
│ 3. Abre stream          │
└──────┬──────────────────┘
       │
       ▼ (Server-Sent Events o WebSocket)
┌──────────────────────────┐
│ Frontend (React)         │
│ Muestra resumen          │
│ palabra por palabra      │
└──────────────────────────┘
```

---

## 💾 Implementación en NestJS

### 1. Instalar SDK de Anthropic

```bash
npm install @anthropic-ai/sdk
```

### 2. Servicio de Summarize (con Streaming)

```typescript
// backend/src/modules/processing/services/summary.service.ts

import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class SummaryService {
  private anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  /**
   * Crear resumen con streaming
   * @param text - Texto a resumir
   * @param language - Idioma del resumen
   * @returns Stream de respuesta
   */
  async *summarizeStream(
    text: string,
    language: string = 'es',
  ): AsyncGenerator<string> {
    const maxTokens = Math.min(
      Math.floor(text.length / 4), // Aproximadamente 1 token = 4 caracteres
      4096 // Máximo Claude
    );

    const stream = this.anthropic.messages.stream({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: `Eres un asistente especializado en crear resúmenes académicos claros y precisos.

Tu tarea es crear un resumen estructurado del siguiente texto en ${language}.

El resumen debe incluir:
1. Una introducción de 1-2 párrafos sobre el tema principal
2. Puntos clave (separados por viñetas)
3. Conceptos principales explicados brevemente
4. Una conclusión resumida

Texto a resumir:
---
${text}
---

Crea el resumen ahora:`,
        },
      ],
    });

    // Iterar sobre el stream
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        // Yield cada fragmento de texto
        yield event.delta.text;
      }
    }
  }

  /**
   * Resumen sin streaming (para caché)
   */
  async summarize(
    text: string,
    language: string = 'es',
  ): Promise<string> {
    let fullText = '';

    for await (const chunk of this.summarizeStream(text, language)) {
      fullText += chunk;
    }

    return fullText;
  }
}
```

### 3. Controlador con Server-Sent Events (SSE)

```typescript
// backend/src/modules/processing/controllers/processing.controller.ts

import { Controller, Post, Body, Response, UseGuards } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SummaryService } from '../services/summary.service';

@Controller('processing')
@UseGuards(AuthGuard('jwt'))
export class ProcessingController {
  constructor(private summaryService: SummaryService) {}

  /**
   * POST /processing/summarize
   * Endpoint que retorna stream SSE del resumen
   */
  @Post('summarize')
  async summarizeStream(
    @Body('text') text: string,
    @Body('language') language: string = 'es',
    @CurrentUser() user: any,
    @Response() res: ExpressResponse,
  ) {
    // Validación
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 100000) {
      return res.status(400).json({ error: 'Text too long (max 100k chars)' });
    }

    // Configurar headers para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      // Enviar evento de inicio
      res.write('data: {"type":"start","message":"Starting summary..."}\n\n');

      let chunkCount = 0;
      let totalTokens = 0;

      // Iterar sobre el stream
      for await (const chunk of this.summaryService.summarizeStream(
        text,
        language,
      )) {
        // Escapar caracteres especiales para SSE
        const escapedChunk = chunk.replace(/\n/g, '\\n');

        // Enviar chunk
        res.write(
          `data: ${JSON.stringify({
            type: 'chunk',
            text: chunk,
            chunkNumber: chunkCount++,
          })}\n\n`,
        );

        // Estimación de tokens
        totalTokens += Math.ceil(chunk.length / 4);

        // Pequeño delay para no sobrecargar
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Evento de finalización
      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          message: 'Summary complete',
          totalChunks: chunkCount,
          estimatedTokens: totalTokens,
        })}\n\n`,
      );

      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: error.message,
        })}\n\n`,
      );
      res.end();
    }
  }
}
```

---

## 🎯 Frontend (React) para Consumir Stream

### Cliente SSE

```typescript
// frontend/src/services/processingApi.ts

export async function *summarizeWithStreaming(
  text: string,
  language: string = 'es',
): AsyncGenerator<string> {
  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/processing/summarize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ text, language }),
    },
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));

          if (data.type === 'chunk') {
            yield data.text;
          } else if (data.type === 'error') {
            throw new Error(data.error);
          }
        } catch (e) {
          // Línea inválida, ignorar
        }
      }
    }
  }
}
```

### Componente React

```typescript
// frontend/src/components/SummaryStream.tsx

import { useState } from 'react';
import { summarizeWithStreaming } from '../services/processingApi';

export function SummaryStream({ text }: { text: string }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    setLoading(true);
    setSummary('');
    setError('');

    try {
      for await (const chunk of summarizeWithStreaming(text)) {
        setSummary((prev) => prev + chunk);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Generando...' : 'Generar Resumen'}
      </button>

      {loading && <div className="text-blue-600">Procesando...</div>}

      {error && <div className="text-red-600">Error: {error}</div>}

      {summary && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Resumen:</h3>
          <p className="whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 Alternativa: WebSocket (Más Control)

Si prefieres más control (cancelar, pausar, etc.):

```typescript
// backend/src/modules/processing/gateways/summarize.gateway.ts

import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SummaryService } from '../services/summary.service';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN },
})
export class SummarizeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private summaryService: SummaryService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('summarize')
  async handleSummarize(
    client: Socket,
    payload: { text: string; language: string },
  ) {
    try {
      for await (const chunk of this.summaryService.summarizeStream(
        payload.text,
        payload.language,
      )) {
        client.emit('summary-chunk', {
          chunk,
          timestamp: Date.now(),
        });
      }

      client.emit('summary-complete', {
        message: 'Summary completed',
      });
    } catch (error) {
      client.emit('summary-error', {
        error: error.message,
      });
    }
  }
}
```

---

## 📊 Ventajas del Streaming

| Aspecto | Sin Streaming | Con Streaming |
|--------|--------------|---------------|
| **Tiempo aparente** | 10 segundos (espera) | Inmediato (retroalimentación) |
| **UX** | ❌ Frustrado | ✅ Satisfecho |
| **Tokens en paralelo** | ❌ Todos al final | ✅ Incrementales |
| **Cancelación** | ❌ Difícil | ✅ Simple |
| **Memoria** | ❌ Todo en buffer | ✅ Por chunks |

---

## 🚀 Implementación Recomendada

1. **Fase 2 (Semana 6):** Implementar streaming SSE
2. **Fase 3:** Agregar WebSocket para más control
3. **Fase 4:** Frontend con visualización en tiempo real

---

## 📝 Detalles Técnicos Importantes

### Límites de Token
- **Entrada máxima:** 200,000 tokens (~800KB texto)
- **Salida máxima:** 4,096 tokens
- **Timeout:** 120 segundos

### Costos (Estimado)
```
Resumen de 10KB:
- Entrada: ~2,500 tokens
- Salida: ~500 tokens
- Costo: ~$0.015
```

### Rate Limiting
```
Claude API: 50 requests/minute (tier básico)
Considerar Redis para queue de requests
```

---

## ✨ Conclusión

**SÍ, definitivamente usa streaming** para:
- ✅ Resúmenes largos
- ✅ Textos OCR extensos
- ✅ Análisis complejos

**Recomendación:** Implementa SSE primero (más simple), luego WebSocket si necesitas más control.

---

*Documento: Claude Streaming para LearnMind AI*  
*Actualizado: Enero 29, 2026*
