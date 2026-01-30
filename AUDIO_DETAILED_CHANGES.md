# Audio AI Summary Enhancement - Cambios Detallados

## 1. Backend Audio Processor
**Archivo:** `backend/src/modules/audio/audio.processor.ts`

### Cambios:
1. **Imports agregados (líneas 11-12):**
   ```typescript
   import { AiService } from '../ai/ai.service';
   import { StorageService } from '../storage/storage.service';
   ```

2. **Constructor - inyecciones (líneas 27-28):**
   ```typescript
   private readonly aiService: AiService,
   private readonly storageService: StorageService,
   ```

3. **Método processAudio - parámetro userId (línea 37):**
   ```typescript
   const { uploadId, audioResultId, language, userId } = job.data;
   ```

4. **Generación de resumen (líneas 85-106):**
   ```typescript
   // Generar resumen usando Claude con streaming
   this.logger.log(`Generating AI summary for audio ${uploadId}`);
   let fullSummary = '';

   try {
     const summaryGenerator = this.aiService.streamSummarize({
       text: transcriptionResult.text,
       language: audioResult.language || 'auto',
       style: 'bullet-points',
       maxTokens: 1024,
     });

     // Consumir el stream y acumular el resumen
     for await (const chunk of summaryGenerator) {
       fullSummary += chunk;
     }

     audioResult.summary = fullSummary;
     this.logger.log(`AI summary generated for audio ${uploadId}`);
   } catch (aiError: any) {
     this.logger.error(`Failed to generate AI summary: ${aiError?.message}`, aiError?.stack);
     // Continuar sin resumen si falla la IA
     audioResult.summary = '';
   }
   ```

5. **Almacenamiento en MinIO (líneas 108-141):**
   ```typescript
   // Guardar los archivos en MinIO
   try {
     // Guardar transcripción en MinIO
     const transcriptionPath = await this.storageService.uploadSummary(
       userId,
       uploadId,
       `**Transcripción de audio:**\n\n${transcriptionResult.text}`,
       'transcription'
     );
     audioResult.transcriptionMinioPath = transcriptionPath;
     this.logger.log(`Transcription saved to MinIO at ${transcriptionPath}`);

     // Guardar resumen en MinIO si se generó
     if (fullSummary) {
       const summaryPath = await this.storageService.uploadSummary(
         userId,
         uploadId,
         fullSummary,
         'summary'
       );
       audioResult.summaryMinioPath = summaryPath;
       this.logger.log(`Summary saved to MinIO at ${summaryPath}`);
     }

     // Guardar archivo de audio original en MinIO
     if (fileBuffer) {
       const audioFileName = upload.originalFileName || `audio_${uploadId}.wav`;
       const audioPath = await this.storageService.uploadAudioFile(
         userId,
         uploadId,
         fileBuffer,
         audioFileName
       );
       audioResult.audioMinioPath = audioPath;
       this.logger.log(`Audio file saved to MinIO at ${audioPath}`);
     }
   } catch (storageError: any) {
     this.logger.error(`Failed to save files to MinIO: ${storageError?.message}`, storageError?.stack);
     // Continuar sin almacenamiento si falla
   }
   ```

6. **Actualización de upload (línea 157-161):**
   ```typescript
   await this.uploadsService.update(uploadId, {
     extractedText: fullSummary || transcriptionResult.text,
     summary: fullSummary,  // ← NUEVO
     status: 'completed',
     processedAt: new Date(),
   });
   ```

## 2. Audio Result Entity
**Archivo:** `backend/src/modules/audio/entities/audio-result.entity.ts`

### Cambios (después de `transcription` field):
```typescript
@Column('text', { nullable: true })
transcription: string;

// ← AGREGADOS:
@Column('text', { nullable: true })
summary: string;

@Column('varchar', { nullable: true })
transcriptionMinioPath: string;

@Column('varchar', { nullable: true })
summaryMinioPath: string;

@Column('varchar', { nullable: true })
audioMinioPath: string;

@Column('jsonb', { nullable: true, default: {} })
metadata: Record<string, any>;
```

## 3. Upload Entity
**Archivo:** `backend/src/modules/uploads/entities/upload.entity.ts`

### Cambios (después de `extractedText`):
```typescript
@Column({ type: 'text', nullable: true })
extractedText?: string;

// ← AGREGADO:
@Column({ type: 'text', nullable: true })
summary?: string;

@Column({ type: 'text', nullable: true })
extractedJson?: string;
```

## 4. Audio Controller
**Archivo:** `backend/src/modules/audio/audio.controller.ts`

### Cambios en endpoint GET /api/audio/status/:uploadId (líneas 24-43):
```typescript
@Get('status/:uploadId')
async getAudioStatus(
  @Param('uploadId') uploadId: string,
  @Request() req: any,
): Promise<{ status: string; transcription?: string; summary?: string; extractedText?: string; error?: string }> {
  try {
    const result = await this.audioService.getAudioResult(req.user.id, uploadId);
    if (!result) {
      return { status: 'pending' };
    }
    return {
      status: result.status,
      transcription: result.transcription || undefined,
      summary: result.summary || undefined,  // ← NUEVO
      extractedText: result.summary || result.transcription || undefined,  // ← NUEVO
      error: result.errorMessage || undefined,
    };
  } catch (error: any) {
    this.logger.error(`Error getting audio status: ${error?.message}`);
    return { status: 'error', error: error?.message };
  }
}
```

## 5. Storage Service
**Archivo:** `backend/src/modules/storage/storage.service.ts`

### Cambios en uploadSummary (líneas 91-117):
```typescript
async uploadSummary(userId: string, uploadId: string, summaryText: string, type: string = 'summary'): Promise<string> {
  try {
    let objectName: string;
    let fileName: string;

    if (type === 'transcription') {
      fileName = `${uploadId}-transcription.txt`;
      objectName = `audio/transcriptions/${userId}/${fileName}`;
    } else if (type === 'summary') {
      fileName = `${uploadId}-summary.txt`;
      objectName = `summaries/${userId}/${fileName}`;
    } else {
      fileName = `${uploadId}-${type}.txt`;
      objectName = `${type}/${userId}/${fileName}`;
    }

    const path = await this.minioClientService.uploadFile(
      this.resultsBucket,
      objectName,
      Buffer.from(summaryText, 'utf-8'),
      'text/plain',
    );

    this.logger.log(`${type === 'transcription' ? 'Transcription' : 'Summary'} uploaded: ${path} (${summaryText.length} bytes)`);
    return path;
  } catch (error: any) {
    this.logger.error(`Error uploading ${type}: ${error?.message}`, error?.stack);
    throw error;
  }
}
```

### Nuevo método uploadAudioFile (líneas 119-133):
```typescript
async uploadAudioFile(userId: string, uploadId: string, fileBuffer: Buffer, fileName: string): Promise<string> {
  try {
    const audioFileName = `${uploadId}-${fileName}`;
    const objectName = `audio/files/${userId}/${audioFileName}`;

    const path = await this.minioClientService.uploadFile(
      this.resultsBucket,
      objectName,
      fileBuffer,
      'audio/wav',
    );

    this.logger.log(`Audio file uploaded: ${path} (${fileBuffer.length} bytes)`);
    return path;
  } catch (error: any) {
    this.logger.error(`Error uploading audio file: ${error?.message}`, error?.stack);
    throw error;
  }
}
```

## 6. Frontend SummaryModal
**Archivo:** `frontend/src/components/SummaryModal.tsx`

### Cambios en estado (línea 75):
```typescript
const [audioSummary, setAudioSummary] = useState<string>('');  // ← NUEVO
```

### Cambios en polling (líneas 117-118):
```typescript
setAudioTranscription(data?.transcription || '');
setAudioSummary(data?.summary || data?.extractedText || '');  // ← NUEVO
```

### Cambios en limpieza de estado (línea 233):
```typescript
setAudioSummary('');  // ← NUEVO
```

### Reemplazo completo de UI de audio result (líneas 347-400):
```tsx
{/* Mostrar resultado cuando audio está completado */}
{audioProgress === 100 && (audioSummary || audioTranscription) && (
  <div className="py-8">
    <div className="flex justify-center mb-6">
      <CheckCircle2 size={64} className="text-green-500" />
    </div>

    <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Tu Resumen de Audio está Listo</h2>

    {/* Caja del resumen */}
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 border border-blue-200 max-h-96 overflow-y-auto">
      <div className="space-y-3">
        {audioSummary ? (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">📝 Resumen de IA</h3>
            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
              {audioSummary}
            </p>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">📝 Transcripción</h3>
            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
              {audioTranscription}
            </p>
          </div>
        )}
      </div>
    </div>

    {/* Info sobre lo que se guardó */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
      <p className="font-semibold mb-2">✓ Archivos guardados en MinIO:</p>
      <ul className="list-disc list-inside space-y-1 text-gray-600">
        <li>Archivo de audio original</li>
        <li>Transcripción completa</li>
        <li>Resumen de IA</li>
      </ul>
    </div>

    {/* Botones de acción */}
    <div className="flex flex-col gap-3">
      <button 
        onClick={() => {
          const content = audioSummary || audioTranscription;
          const element = document.createElement('a');
          const file = new Blob([content], { type: 'text/plain' });
          element.href = URL.createObjectURL(file);
          element.download = audioSummary ? 'resumen_audio.txt' : 'transcripcion.txt';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        }}
        className="w-full py-3 font-bold text-white transition-colors bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2"
      >
        <Download className="w-4 h-4" />
        Descargar {audioSummary ? 'Resumen' : 'Transcripción'}
      </button>
      <button 
        onClick={() => {
          setAudioProcessing(false);
          setAudioProgress(0);
          setAudioTranscription('');
          setAudioSummary('');  // ← NUEVO
          setUploadedFile(null);
          setShowTextInput(false);
          setManualText('');
        }}
        className="w-full py-3 font-bold text-white transition-colors bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2"
      >
        <RotateCw className="w-4 h-4" />
        Procesar Otro Audio
      </button>
    </div>
  </div>
)}
```

## 7. Migración Database
**Archivo:** `backend/src/migrations/1740000001000-AddAudioSummaryAndStoragePaths.ts`

**Nuevo archivo completamente** con:
- Agregación de campos a `audio_results`
- Agregación de campo `summary` a `uploads`

## Archivos No Modificados (Pero Importantes)

- `audio.service.ts` - ✅ Ya pasa `userId` en job data
- `AiService` - ✅ Ya tiene método `streamSummarize()`
- Resto de módulos - ✅ Sin cambios necesarios

## Verificación

```bash
# Compilación backend
cd backend
npm run build
# ✅ Debe completarse sin errores

# Compilación frontend
cd frontend
npm run build
# ✅ Debe completarse sin errores (ignorar advertencia de Node)

# Ejecutar migración (cuando estés listo)
cd backend
npm run migration:run
```

