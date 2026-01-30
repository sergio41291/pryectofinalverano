# 🧠 IA Summarization Pipeline

**Versión**: 1.0  
**Estado**: Planificado  
**Fecha**: 29 de Enero de 2026

## 📋 Descripción

Después de que el audio se transcribe o el PDF se procesa con OCR, el texto resultante se enviará a Claude IA para:
- **Resumen** del contenido
- **Puntos clave** extraídos
- **Categorización** automática
- **Análisis de sentimiento** (opcional)

## 🔄 Flujo Completo: Audio a Resumen IA

```
┌─────────────────────────────────────────────────────────────┐
│  1. Usuario sube archivo de audio (MP3, WAV, etc)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. UploadsController detecta tipo AUDIO                    │
│     → Enruta a AudioService                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. AudioProcessor (Bull Queue)                             │
│     → Envía a AssemblyAI                                   │
│     → Obtiene: transcription (texto completo)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. IASummarizerService (NUEVO)                             │
│     → Envía transcripción a Claude IA                      │
│     → Procesa con prompts especializados                   │
└─────────────────────────────────────────────────────────────┘
                              │
                   ┌──────────┼──────────┬──────────┐
                   │          │          │          │
                   ▼          ▼          ▼          ▼
            ┌────────┐  ┌──────────┐ ┌────────┐ ┌──────────┐
            │Resumen │  │Puntos    │ │Categ.  │ │Sentimiento
            │(200)   │  │Clave (5) │ │        │ │          │
            └────────┘  └──────────┘ └────────┘ └──────────┘
                   │          │          │          │
                   └──────────┼──────────┼──────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. AudioResult actualizado con:                            │
│     - transcription (texto completo)                       │
│     - summary (resumen IA)                                 │
│     - keyPoints (puntos clave)                             │
│     - category (categorización)                            │
│     - sentiment (sentimiento)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Frontend muestra:                                       │
│     - Transcripción completa                               │
│     - Resumen ejecutivo                                    │
│     - Puntos destacados                                    │
│     - Categoría asignada                                   │
│     - Tono/Sentimiento                                     │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Mismo flujo para OCR

```
PDF/Imagen → OCR (PaddleOCR) → Texto extraído → IASummarizerService → Claude IA → Resultados
```

## 🛠️ Implementación Técnica

### 1. Actualizar AudioResult Entity

```typescript
// backend/src/modules/audio/entities/audio-result.entity.ts

@Entity('audio_results')
export class AudioResult {
  // Existentes
  @Column()
  transcription: string;
  
  @Column()
  jobId: string;
  
  // NUEVOS - para IA
  @Column({ nullable: true })
  summary?: string;  // Resumen IA (200-300 palabras)
  
  @Column('simple-array', { nullable: true })
  keyPoints?: string[];  // Array de puntos clave (máx 5)
  
  @Column({ nullable: true })
  category?: string;  // Categorización automática
  
  @Column({ nullable: true })
  sentiment?: string;  // 'positive' | 'neutral' | 'negative'
  
  @Column({ nullable: true })
  keywords?: string;  // Palabras clave, JSON string
  
  @Column({ nullable: true })
  aiProcessedAt?: Date;  // Cuándo se procesó con IA
}
```

### 2. Crear IASummarizerService

```typescript
// backend/src/modules/ia/ia-summarizer.service.ts

@Injectable()
export class IASummarizerService {
  constructor(
    private readonly anthropicService: AnthropicService,
  ) {}

  async summarizeTranscription(
    text: string,
    language: string = 'es',
  ): Promise<{
    summary: string;
    keyPoints: string[];
    category: string;
    sentiment: string;
    keywords: object;
  }> {
    const prompt = `
      Analiza la siguiente transcripción de audio en ${language}:
      
      "${text}"
      
      Proporciona en formato JSON:
      {
        "summary": "Resumen en ${language} de máximo 300 palabras",
        "keyPoints": ["punto1", "punto2", "punto3", "punto4", "punto5"],
        "category": "Categoría: entrevista|reunión|presentación|conversación|otro",
        "sentiment": "positive|neutral|negative",
        "keywords": {
          "main": ["palabra1", "palabra2"],
          "topics": ["tema1", "tema2"]
        }
      }
    `;
    
    const response = await this.anthropicService.message(prompt);
    return JSON.parse(response.content);
  }
}
```

### 3. Modificar AudioProcessor

```typescript
// backend/src/modules/audio/audio.processor.ts

@Processor('audio')
export class AudioProcessor {
  constructor(
    private readonly audioService: AudioService,
    private readonly iaSummarizerService: IASummarizerService, // NUEVO
  ) {}

  @Process('transcribe')
  async processTranscription(job: Job<CreateAudioResultDto>) {
    try {
      // 1. Obtener transcripción de AssemblyAI
      const transcriptionResult = await this.audioService.getTranscription(job.data);
      
      // 2. NUEVO: Procesar con IA
      const aiResults = await this.iaSummarizerService.summarizeTranscription(
        transcriptionResult.transcription,
        job.data.language,
      );
      
      // 3. Actualizar AudioResult con todos los datos
      await this.audioService.updateAudioResultWithSummary(
        job.data.uploadId,
        {
          transcription: transcriptionResult.transcription,
          summary: aiResults.summary,
          keyPoints: aiResults.keyPoints,
          category: aiResults.category,
          sentiment: aiResults.sentiment,
          keywords: aiResults.keywords,
          aiProcessedAt: new Date(),
          status: 'completed',
        },
      );
      
      return { success: true, transcription: transcriptionResult.transcription };
    } catch (error) {
      // Manejar errores
    }
  }
}
```

## 📱 Frontend - AudioResults Component (Actualizado)

```typescript
// frontend/src/components/AudioResults.tsx

export const AudioResults: React.FC<{ uploadId: string }> = ({ uploadId }) => {
  const [result, setResult] = useState<AudioResult | null>(null);
  
  return (
    <div className="space-y-4">
      {/* Transcripción completa */}
      <div>
        <h3 className="font-bold mb-2">Transcripción</h3>
        <p className="text-gray-700">{result?.transcription}</p>
      </div>
      
      {/* Resumen IA */}
      {result?.summary && (
        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-bold mb-2">📋 Resumen</h3>
          <p className="text-sm">{result.summary}</p>
        </div>
      )}
      
      {/* Puntos clave */}
      {result?.keyPoints && result.keyPoints.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="font-bold mb-2">⭐ Puntos Clave</h3>
          <ul className="list-disc list-inside space-y-1">
            {result.keyPoints.map((point, i) => (
              <li key={i} className="text-sm">{point}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Categorización */}
      {result?.category && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Tipo:</span>
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm">
            {result.category}
          </span>
        </div>
      )}
      
      {/* Sentimiento */}
      {result?.sentiment && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Sentimiento:</span>
          <span className={`px-3 py-1 rounded text-sm ${
            result.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
            result.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {result.sentiment === 'positive' && '😊 Positivo'}
            {result.sentiment === 'negative' && '😞 Negativo'}
            {result.sentiment === 'neutral' && '😐 Neutral'}
          </span>
        </div>
      )}
    </div>
  );
};
```

## 🔄 Flujo Actualizado del Upload

```
Usuario sube audio/PDF
    ↓
UploadsController (detecta tipo)
    ├─→ Audio → AudioService + AudioProcessor
    │    ├─→ AssemblyAI (transcribir)
    │    └─→ IASummarizerService (resumir con Claude)
    │
    └─→ Documento → OcrService + OcrProcessor
         ├─→ PaddleOCR (extraer texto)
         └─→ IASummarizerService (resumir con Claude)
    ↓
AudioResult/OcrResult con summary, keyPoints, category, sentiment
    ↓
Frontend muestra: Texto completo + Resumen + Puntos clave + Categoría
```

## 📊 Comparación Antes/Después

### Antes (actual)
- ✅ Audio transcrito a texto
- ❌ Sin resumen automático
- ❌ Sin análisis de contenido
- ❌ Sin categorización

### Después (con IA)
- ✅ Audio transcrito a texto
- ✅ Resumen automático (Claude IA)
- ✅ Puntos clave extraídos (Claude IA)
- ✅ Categorización automática (Claude IA)
- ✅ Análisis de sentimiento (Claude IA)
- ✅ Palabras clave identificadas (Claude IA)

## 🚀 Ventajas

1. **Ahorro de tiempo**: Resumen automático vs leer todo
2. **Análisis inteligente**: Puntos clave extraídos automáticamente
3. **Categorización**: Organización automática de contenido
4. **Inteligencia**: Usa Claude IA de Anthropic
5. **Escalable**: Mismo pipeline para audio y documentos

## 📋 Checklist de Implementación

- [ ] Actualizar AudioResult entity con nuevos campos
- [ ] Crear IASummarizerService
- [ ] Modificar AudioProcessor para llamar IA
- [ ] Integrar AnthropicService (si no existe)
- [ ] Actualizar AudioResults React component
- [ ] Crear migration de base de datos
- [ ] Testear con audio de ejemplo
- [ ] Documentar prompts de IA
- [ ] Agregar caché de resultados IA

## 📚 Prompts Especializados (por tipo)

### Para Entrevistas
```
Eres un analizador de entrevistas de trabajo. 
Resume los puntos principales: experiencia del candidato, fortalezas, 
debilidades identificadas, y recomendación final.
```

### Para Reuniones
```
Eres un asistente de reuniones. 
Resume: decisiones tomadas, acciones pendientes, responsables, 
fechas límite, y temas no resueltos.
```

### Para Presentaciones
```
Eres un analizador de presentaciones. 
Resume: tema principal, argumentos clave, datos presentados, 
conclusiones, y recomendaciones.
```

## 🔐 Consideraciones de Privacidad

- El texto se envía a Anthropic Claude API
- Configurar según nivel de datos sensibles
- Agregar opción para no procesar con IA
- Log de qué se envió dónde y cuándo

---

**Documento**: Planificación IA Summarization  
**Estado**: Ready for Implementation  
**Próximo paso**: Implementar cambios en AudioResult entity
