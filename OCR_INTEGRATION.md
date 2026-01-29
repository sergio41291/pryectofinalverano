# OCR Integration Guide

## Overview

The OCR (Optical Character Recognition) module integrates PaddleOCR with the NestJS backend using Bull job queue for asynchronous processing and MongoDB for result storage.

## Architecture

### Components

1. **OcrModule** - Main module managing OCR operations
2. **OcrService** - Service for initiating and managing OCR processing
3. **OcrProcessor** - Bull job processor executing OCR on Python script
4. **OcrResult Entity** - TypeORM entity storing OCR results in PostgreSQL
5. **Bull Queue** - Job queue for asynchronous processing via Redis

### Data Flow

```
Upload File (MinIO)
    ↓
POST /ocr/:uploadId/process
    ↓
OcrService.initiateOcrProcessing()
    ↓
Bull Queue (Redis)
    ↓
OcrProcessor.processOcr()
    ↓
Python paddle_ocr_service.py
    ↓
OcrResult Entity (PostgreSQL)
    ↓
GET /ocr/:uploadId or /ocr/results/:id
```

## API Endpoints

### 1. Initiate OCR Processing
```
POST /ocr/:uploadId/process
Authorization: Bearer <jwt_token>
Content-Type: application/json

Request Body:
{
  "language": "es"  // Optional, defaults to "es" (Spanish)
}

Response:
{
  "id": "uuid",
  "uploadId": "uuid",
  "status": "processing",
  "jobId": "123",
  "createdAt": "2026-01-29T..."
}
```

### 2. Get OCR Result by Upload ID
```
GET /ocr/:uploadId
Authorization: Bearer <jwt_token>

Response:
{
  "id": "uuid",
  "uploadId": "uuid",
  "status": "completed|processing|failed|pending",
  "extractedText": {
    "text": "Extracted text content...",
    "confidence": 0.95,
    "language": "es"
  },
  "metadata": {
    "processedPages": 5,
    "totalPages": 5,
    "processingTime": 2500,
    "modelVersion": "paddleocr-3.4.0"
  },
  "pageResults": [
    {
      "pageNumber": 1,
      "text": "Page 1 text...",
      "confidence": 0.97
    }
  ],
  "errorMessage": null,
  "createdAt": "2026-01-29T...",
  "completedAt": "2026-01-29T..."
}
```

### 3. Get OCR Result by ID
```
GET /ocr/results/:id
Authorization: Bearer <jwt_token>

Response: Same as above
```

### 4. List User's OCR Results
```
GET /ocr?limit=20&offset=0
Authorization: Bearer <jwt_token>

Query Parameters:
- limit: number (max 100, default 20)
- offset: number (default 0)

Response:
{
  "results": [
    {
      "id": "uuid",
      "uploadId": "uuid",
      "status": "completed",
      "createdAt": "2026-01-29T...",
      "completedAt": "2026-01-29T..."
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

## Database Schema

### OcrResult Entity

```typescript
{
  id: UUID (Primary Key)
  uploadId: UUID (Foreign Key → uploads.id)
  userId: UUID (Foreign Key → users.id)
  extractedText: JSON {
    text: string
    confidence: number (0-1)
    language: string
  }
  metadata: JSON {
    processedPages: number
    totalPages: number
    processingTime: number (ms)
    modelVersion: string
  }
  pageResults: JSON[] {
    pageNumber: number
    text: string
    confidence: number
  }
  status: ENUM ['pending', 'processing', 'completed', 'failed']
  errorMessage: string (nullable)
  jobId: string (Bull job ID, nullable)
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
  completedAt: TIMESTAMP (nullable)
  
  Indexes:
  - (userId, uploadId)
  - (status, createdAt)
}
```

## Job Processing

### Bull Queue Configuration

- **Queue Name**: `ocr`
- **Redis Connection**: Uses `REDIS_HOST` and `REDIS_PORT` from environment
- **Max Attempts**: 3 retries
- **Backoff Strategy**: Exponential (2s initial delay)
- **Timeout**: 5 minutes per job

### Job Data Structure

```typescript
{
  uploadId: string
  userId: string
  ocrResultId: string
  language: string
}
```

### Job Status

- `pending` - Created, waiting in queue
- `processing` - Job is executing
- `completed` - Successfully processed
- `failed` - Error during processing

## Python Integration

The backend calls `scripts/paddle_ocr_service.py` with arguments:

```bash
python scripts/paddle_ocr_service.py \
  --input <file_path> \
  --language <language_code> \
  --output-format json
```

### Expected Python Output

```json
{
  "text": "Full extracted text...",
  "confidence": 0.95,
  "pages": 5,
  "processing_time": 2500,
  "model_version": "paddleocr-3.4.0",
  "page_results": [
    {
      "pageNumber": 1,
      "text": "Page 1 content...",
      "confidence": 0.97
    }
  ]
}
```

## Error Handling

### Common Errors

| Status | Error | Resolution |
|--------|-------|-----------|
| 400 | Upload not found | Verify uploadId exists and belongs to user |
| 400 | No file provided | File must be uploaded before OCR |
| 404 | OCR result not found | OCR has not been initiated for this upload |
| 500 | OCR processing failed | Check Python service logs |
| 500 | Failed to parse OCR output | Verify Python script JSON output format |

### Error Messages in Response

```json
{
  "status": "failed",
  "errorMessage": "Python OCR service exited with code 1: [stderr output]"
}
```

## Usage Example

### Step 1: Upload File
```bash
curl -X POST http://localhost:3001/uploads \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf"

# Response: { "id": "upload-123", ... }
```

### Step 2: Initiate OCR
```bash
curl -X POST http://localhost:3001/ocr/upload-123/process \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"language": "es"}'

# Response: { "id": "ocr-456", "status": "processing", ... }
```

### Step 3: Check OCR Status (polling)
```bash
curl http://localhost:3001/ocr/upload-123 \
  -H "Authorization: Bearer <token>"

# Response: { ..., "status": "completed", "extractedText": {...} }
```

Or check by OCR result ID:
```bash
curl http://localhost:3001/ocr/results/ocr-456 \
  -H "Authorization: Bearer <token>"
```

## Environment Configuration

```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=learpmind

# Redis (Bull Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO (File Storage)
MINIO_HOST=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=documents
```

## Performance Considerations

1. **OCR Timeout**: 5 minutes per document
2. **Job Retries**: Up to 3 attempts with exponential backoff
3. **Concurrent Workers**: Default Bull behavior (check Redis connection pool)
4. **Storage**: Results stored in PostgreSQL, supports pagination

## Monitoring

### Check Job Status
```typescript
const job = await ocrQueue.getJob(jobId);
console.log(job.getState()); // pending, progress, completed, failed
```

### View Job Logs
```typescript
const logs = await job.getLogs(0, -1);
console.log(logs);
```

## Future Enhancements

1. **Webhook Notifications** - Notify frontend when OCR completes
2. **Batch Processing** - Support processing multiple files
3. **Custom OCR Models** - Allow different OCR engines
4. **Result Caching** - Cache OCR results for identical files
5. **Scheduled Cleanup** - Auto-delete old OCR results
