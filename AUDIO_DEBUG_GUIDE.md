# Audio Upload Debug Guide

## Overview
This guide helps diagnose issues with the audio upload workflow. The system now includes detailed logging at every step of the process.

## Logging Points Added

### Frontend Logs (console)

When you upload an audio file, you should see these console logs in sequence:

```
[AudioUploadModal] Starting upload for file: test.mp3
[AudioUploadModal] Upload response: {id: "...", fileName: "...", ...}
[AudioUploadModal] Initiating audio processing for uploadId: <uploadId>
[AudioUploadModal] Audio processing initiated: {jobId: "..."}
[AudioUploadModal] Starting polling for audio result...
[AudioUploadModal] Polling attempt 1/120
[AudioUploadModal] Poll result: {id: "...", status: "processing", ...}
[AudioUploadModal] Status: processing, continuing to poll...
[AudioUploadModal] Polling attempt 2/120
...
[AudioUploadModal] Poll result: {id: "...", status: "completed", transcription: "..."}
[AudioUploadModal] Audio processing completed successfully
```

### Backend Logs (terminal)

Check the backend terminal for these logs:

```
[UploadsController] File uploaded: test.mp3, Type: AUDIO
[UploadsController] Routing to Audio Service: <uploadId>
[AudioService] Initiating audio processing: <uploadId>
[AudioProcessor] Processing audio job 1 for upload <uploadId>
[AudioService] Audio transcription result: {...}
[AudioProcessor] Audio processing completed for job 1
```

## Troubleshooting Steps

### 1. Check if file is being detected as audio

**Expected:** Backend log shows "Type: AUDIO"

If you see "Type: UNKNOWN" or "Unsupported file type":
- Verify file extension is .mp3, .wav, .m4a, etc.
- Check file MIME type is correct (audio/mpeg, audio/wav, etc.)

### 2. Check if backend is processing the file

**Expected:** Backend log shows "Routing to Audio Service"

If routing to OCR instead:
- The file MIME type may be incorrect
- The file detection logic may not be recognizing your file format

### 3. Check if AssemblyAI is being called

**Expected:** Backend log shows "Processing audio job X"

If this step is missing:
- Check AssemblyAI API key in backend environment
- Verify AssemblyAI queue job is being created

### 4. Check if frontend is polling correctly

**Expected:** Browser console shows multiple poll attempts until status = "completed"

If polling fails with 404:
- The GET `/audio/{uploadId}` endpoint may not be returning a result
- The AudioResult entity may not have been created yet
- Check backend logs for errors in AudioService

If polling shows 401/403:
- JWT token may be expired or invalid
- Check localStorage for authToken

### 5. Check if result is being returned

**Expected:** Frontend log shows "Audio processing completed successfully"

If modal closes but no results shown:
- The `onSuccess` callback may not be firing
- The result structure may have changed
- Check browser console for errors after "Audio processing completed"

## File Type Detection Logic

### Audio Files (Routed to AudioService)
```
audio/mpeg      -> mp3
audio/wav       -> wav
audio/wave      -> wav (alternative)
audio/x-wav     -> wav (alternative)
audio/mp4       -> m4a
audio/x-m4a     -> m4a (alternative)
audio/ogg       -> ogg/opus
audio/opus      -> opus
audio/flac      -> flac
audio/aac       -> aac
audio/x-aac     -> aac (alternative)
audio/webm      -> webm audio
```

### Document Files (Routed to OCRService)
```
application/pdf -> PDF
image/jpeg      -> JPG
image/jpg       -> JPG (alternative)
image/png       -> PNG
image/tiff      -> TIFF
image/x-tiff    -> TIFF (alternative)
image/webp      -> WEBP
image/bmp       -> BMP
image/gif       -> GIF
```

## API Endpoints

### Upload File
```
POST /api/uploads
Content-Type: multipart/form-data

Response:
{
  "id": "<uploadId>",
  "fileName": "test_<timestamp>.mp3",
  "originalFileName": "test.mp3",
  "fileSize": 12345,
  "mimeType": "audio/mpeg",
  "status": "active",
  "fileType": "audio",
  "processingType": "transcription",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Process Audio
```
POST /api/audio/{uploadId}/process
Content-Type: application/json
Body: { "language": "es" } (optional)

Response:
{
  "id": "<resultId>",
  "uploadId": "<uploadId>",
  "userId": "<userId>",
  "status": "pending|processing|completed|failed",
  "transcription": "...",
  "language": "es",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Get Audio Result
```
GET /api/audio/{uploadId}

Response:
{
  "id": "<resultId>",
  "uploadId": "<uploadId>",
  "userId": "<userId>",
  "status": "pending|processing|completed|failed",
  "transcription": "..." (only if status = completed),
  "errorMessage": "..." (only if status = failed),
  "createdAt": "2024-01-01T00:00:00Z",
  "completedAt": "2024-01-01T00:01:00Z" (only if status = completed)
}
```

## Common Issues and Solutions

### Issue: Modal shows "Tiempo de espera agotado" (Timeout)
- Audio processing is taking longer than 10 minutes
- Check AssemblyAI job status in backend logs
- Verify AssemblyAI API key and rate limits

### Issue: "404 Audio result not found"
- The GET `/audio/{uploadId}` endpoint is returning 404
- Verify AudioResult was created in database
- Check if user ID matches between upload and result

### Issue: Modal resets without showing results
- Check browser console for silent errors
- Verify the exact error in the poll response
- Check if status is "failed" (will show error message instead of results)

### Issue: Backend shows successful processing but frontend doesn't get result
- The AudioService may have completed but result not persisted
- Check database for AudioResult entity
- Verify polling interval is long enough for job completion

## Testing Checklist

- [ ] Upload audio file (browser console shows logs)
- [ ] Backend detects file as audio (backend logs show "Type: AUDIO")
- [ ] Backend routes to audio service (backend logs show "Routing to Audio Service")
- [ ] AssemblyAI processes file (backend logs show "Processing audio job")
- [ ] Frontend starts polling (browser console shows "Polling attempt 1/120")
- [ ] Frontend receives updates (browser console shows status changes)
- [ ] Transcription completes (backend logs show "completed")
- [ ] Frontend shows results (browser console shows "Audio processing completed successfully")
- [ ] Modal displays transcription text

## Enabling Advanced Debugging

To enable even more detailed logging:

### Backend
Set environment variables:
```bash
LOG_LEVEL=debug
AUDIO_DEBUG=true
```

### Frontend
In browser DevTools:
```javascript
localStorage.setItem('audio-debug', 'true');
location.reload();
```

Then all audio operations will log additional details.
