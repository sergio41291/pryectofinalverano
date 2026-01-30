# Audio Upload - Step-by-Step Diagnostic

## Current Status

✅ **Backend Changes Implemented:**
- File type detection (audio vs document)
- Conditional routing to AudioService or OcrService
- Detailed logging at each step

✅ **Frontend Logging Added:**
- Console logs for every step of the upload process
- Detailed error reporting during polling

## Diagnosis Process

Follow these steps to identify exactly where the issue occurs:

### Step 1: Start the Services

```powershell
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Open Browser DevTools

1. Open http://localhost:5173 in your browser
2. Press `F12` to open Developer Tools
3. Go to "Console" tab
4. **Keep this tab visible while uploading**

### Step 3: Upload Audio File

1. Navigate to the "Audio" tab
2. Select an MP3 file (at least 1MB for reliable AssemblyAI processing)
3. Click "Transcribir" button
4. **Watch the console for logs**

### Step 4: Monitor Console Logs

You should see logs in this order:

```
✓ [AudioUploadModal] Starting upload for file: myfile.mp3
```
**Indicates:** Frontend is sending file to backend
**If missing:** Button click didn't trigger upload

```
✓ [AudioUploadModal] Upload response: {id: "abc123", ...}
```
**Indicates:** Backend returned upload record successfully
**If missing:** POST /uploads failed
- Check browser DevTools Network tab
- Look for POST /uploads response status
- If 400-500 error: Backend rejected file

```
✓ [AudioUploadModal] Initiating audio processing for uploadId: abc123
```
**Indicates:** Got uploadId from backend
**If missing:** Upload response was malformed

```
✓ [AudioUploadModal] Audio processing initiated: {jobId: "..."}
```
**Indicates:** Backend accepted audio processing request
**If missing:** POST /audio/{uploadId}/process failed
- Check Network tab for POST /audio/*/process
- Look for response status code

```
✓ [AudioUploadModal] Starting polling for audio result...
✓ [AudioUploadModal] Polling attempt 1/120
```
**Indicates:** Starting to check for transcription result
**If missing:** Polling loop didn't start

```
✓ [AudioUploadModal] Poll result: {id: "xyz", status: "pending", ...}
```
**Indicates:** Got audio result from backend
**If missing with 404 error:** GET /audio/{uploadId} endpoint failed
- The backend AudioService may not have created the result yet
- Check backend logs for errors

```
✓ [AudioUploadModal] Status: processing, continuing to poll...
✓ [AudioUploadModal] Polling attempt 2/120
...
✓ [AudioUploadModal] Poll result: {id: "xyz", status: "completed", transcription: "..."}
```
**Indicates:** Audio processing completed
**If stuck on "processing":** Backend job is still running
- Wait longer (audio processing can take 1-5 minutes)
- Check backend logs for stuck jobs

```
✓ [AudioUploadModal] Audio processing completed successfully
```
**Indicates:** Result is complete and modal will show results
**If missing:** Frontend error after polling complete

## Checking Backend Logs

In the backend terminal, look for:

```
[UploadsController] File uploaded: filename.mp3, Type: AUDIO
```
- If "Type: AUDIO" ✓ file detected correctly
- If "Type: OCR" ✗ file incorrectly routed
- If "Type: UNKNOWN" ✗ file not recognized at all

```
[UploadsController] Routing to Audio Service: abc123
```
- Shows audio is being routed to the right service

```
[AudioService] Initiating audio processing: abc123
```
- Backend is starting the audio job

```
[AudioProcessor] Processing audio job 1 for upload abc123
[AssemblyAI] Transcribing audio...
```
- AssemblyAI is actually processing the file

```
[AudioProcessor] Audio processing completed for job 1
[AudioService] Transcription result saved for upload abc123
```
- Audio processing finished and result stored

## Network Inspection

Open DevTools → Network tab and check these requests:

### 1. POST /uploads
- **Status:** 200-201
- **Request:** multipart/form-data with file
- **Response:** `{id, fileName, fileType: "audio", processingType: "transcription", ...}`

### 2. POST /api/audio/{uploadId}/process
- **Status:** 200-201
- **Request:** JSON `{language: "es"}` (optional)
- **Response:** `{id, uploadId, status: "pending", ...}`

### 3. GET /api/audio/{uploadId} (polling)
- **Status:** 200 or 404
- **Response when 200:** `{id, uploadId, status: "pending|processing|completed|failed", ...}`
- **Response when 404:** Result not created yet (normal on first attempts)
- **Response when completed:** Same but with `transcription: "..."` and `status: "completed"`

## Common Issues and Their Signatures

### Issue: Modal shows uploading spinner forever
**Signature:** 
- Console shows: `[AudioUploadModal] Starting upload for file: myfile.mp3`
- But no follow-up logs
- Network tab: POST /uploads stuck or timing out

**Solution:**
- Check backend is running
- Verify file is not corrupted
- Check server logs for errors

### Issue: Modal resets to file selection after upload
**Signature:**
- Console shows: `[AudioUploadModal] Upload response: {...}`
- But modal displays upload dialog again instead of processing UI
- No polling logs appear

**Solution:**
- Check if there's a JavaScript error after upload
- Verify the `onSuccess` or `onClose` handlers
- Check `processAudio()` function execution

### Issue: "404 Audio result not found" errors in polling
**Signature:**
- Console shows multiple polling attempts
- Each shows: `Poll error: {status: 404, ...}`
- Never transitions to completed

**Solution:**
- Check backend AudioService is creating AudioResult records
- Verify database connection and migrations ran
- Check for errors in AudioProcessor job
- May need longer timeout (AssemblyAI processing time)

### Issue: Modal closes but no results displayed
**Signature:**
- Console shows: `[AudioUploadModal] Audio processing completed successfully`
- But no AudioResult modal appears
- No errors in console

**Solution:**
- Check `onSuccess` callback in Home.tsx
- Verify `setAudioResult()` and `setViewingAudio()` state updates
- Check AudioViewModal or AudioResults component rendering

## What to Check in Each Service

### Backend UploadsController
- **File:** `backend/src/modules/uploads/uploads.controller.ts`
- **Lines:** 44-90 (uploadFile method)
- **Key:** `isAudioFile()` and `isImageOrPdfFile()` detection

### Backend AudioService  
- **File:** `backend/src/modules/audio/audio.service.ts`
- **Key:** `initiateAudioProcessing()` creates AudioResult and queue job

### Backend AudioProcessor
- **File:** `backend/src/modules/audio/processors/audio.processor.ts`
- **Key:** Calls AssemblyAI API and updates status

### Frontend AudioUploadModal
- **File:** `frontend/src/components/AudioUploadModal.tsx`
- **Lines:** 65-130 (processAudio method)
- **Key:** Handles upload, initiation, and polling

### Frontend audioService
- **File:** `frontend/src/services/audioService.ts`
- **Key:** API calls to backend endpoints

## Quick Test Commands

### Test if audio service is working

```bash
# Get all audio results
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/audio

# Get specific audio result
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/audio/UPLOAD_ID
```

### Check database for audio results

```bash
# Connect to MongoDB (inside container)
docker exec -it mongodb mongosh

# Check uploads collection
db.uploads.findOne({originalFileName: "your_file.mp3"})

# Check audio results collection
db.audio_results.find()
```

### Check Redis jobs queue

```bash
# Connect to Redis
docker exec -it redis redis-cli

# Check queue length
LLEN bull:audio:jobs

# Check failed jobs
ZRANGE bull:audio:failed 0 -1 WITHSCORES
```

## Next Steps Based on Findings

**If issue is in backend → file detection:**
1. Verify MIME type in upload is correct
2. Check file detection logic in UploadsController
3. May need to add more MIME type variants

**If issue is in backend → audio processing:**
1. Check AssemblyAI API key
2. Verify queue job is created
3. Check AudioProcessor execution
4. May need longer timeout

**If issue is in frontend → API calls:**
1. Verify endpoints match backend routes
2. Check request/response formats
3. Verify authentication token is sent
4. Check error handling

**If issue is in frontend → state management:**
1. Verify onSuccess callback fires
2. Check component state updates
3. Verify modal/result display logic

## Documentation References

- **AUDIO_DEBUG_GUIDE.md** - General debugging guide
- **IA_SUMMARIZATION_PIPELINE.md** - Audio processing pipeline overview
- **AUDIO_FILE_DETECTION_LOGIC.md** - File detection implementation details
