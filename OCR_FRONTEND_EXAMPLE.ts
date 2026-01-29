// Example OCR Integration with Frontend

/**
 * Frontend Example: How to use the OCR API
 */

// 1. Upload a file
async function uploadFile(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3001/uploads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.id; // uploadId
}

// 2. Initiate OCR Processing
async function initiateOcr(uploadId: string, language: string = 'es', token: string) {
  const response = await fetch(`http://localhost:3001/ocr/${uploadId}/process`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language }),
  });

  const data = await response.json();
  return data; // { id, uploadId, status, jobId, createdAt }
}

// 3. Poll for OCR Results
async function pollOcrResult(uploadId: string, token: string, maxAttempts = 60) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`http://localhost:3001/ocr/${uploadId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    // Status: pending, processing, completed, failed
    if (result.status === 'completed') {
      return result;
    }

    if (result.status === 'failed') {
      throw new Error(`OCR failed: ${result.errorMessage}`);
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('OCR processing timeout');
}

// 4. Get OCR Result by ID
async function getOcrResultById(ocrResultId: string, token: string) {
  const response = await fetch(`http://localhost:3001/ocr/results/${ocrResultId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return await response.json();
}

// 5. List User's OCR Results
async function listOcrResults(token: string, limit = 20, offset = 0) {
  const response = await fetch(
    `http://localhost:3001/ocr?limit=${limit}&offset=${offset}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    },
  );

  return await response.json();
}

// Complete Workflow Example
async function processDocumentWithOcr(
  file: File,
  language: string,
  token: string,
) {
  try {
    console.log('1. Uploading file...');
    const uploadId = await uploadFile(file, token);
    console.log(`File uploaded: ${uploadId}`);

    console.log('2. Initiating OCR processing...');
    const ocrJob = await initiateOcr(uploadId, language, token);
    console.log(`OCR job started: ${ocrJob.jobId}`);

    console.log('3. Waiting for OCR results...');
    const result = await pollOcrResult(uploadId, token);
    console.log('OCR completed!');

    return {
      uploadId,
      ocrResultId: result.id,
      extractedText: result.extractedText.text,
      confidence: result.extractedText.confidence,
      pageResults: result.pageResults,
      metadata: result.metadata,
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

/**
 * React Component Example
 */

import React, { useState } from 'react';

export function OcrUploadComponent({ token }: { token: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('es');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const processedResult = await processDocumentWithOcr(
        file,
        language,
        token,
      );
      setResult(processedResult);
    } catch (err: any) {
      setError(err.message || 'Failed to process document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ocr-container">
      <h2>OCR Document Processing</h2>

      <div className="form-group">
        <label>Select File:</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label>Language:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={loading}
        >
          <option value="es">Spanish</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
        </select>
      </div>

      <button onClick={handleProcess} disabled={loading || !file}>
        {loading ? 'Processing...' : 'Process Document'}
      </button>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <h3>OCR Results</h3>
          <p>
            <strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%
          </p>
          <p>
            <strong>Pages Processed:</strong>{' '}
            {result.metadata.processedPages}
          </p>
          <p>
            <strong>Processing Time:</strong>{' '}
            {result.metadata.processingTime}ms
          </p>

          <div className="extracted-text">
            <h4>Extracted Text:</h4>
            <pre>{result.extractedText}</pre>
          </div>

          {result.pageResults && result.pageResults.length > 0 && (
            <div className="page-results">
              <h4>Page-by-Page Results:</h4>
              {result.pageResults.map((page: any) => (
                <div key={page.pageNumber} className="page-result">
                  <h5>Page {page.pageNumber}</h5>
                  <p>Confidence: {(page.confidence * 100).toFixed(1)}%</p>
                  <p>{page.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Advanced: Webhook Example (for frontend notifications)
 * 
 * When OCR completes, server could emit event via WebSocket or Webhook
 */

// Client-side WebSocket listener
export function setupOcrWebSocket(token: string) {
  const ws = new WebSocket(`ws://localhost:3001/ocr-notifications`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'ocr_completed') {
      console.log('OCR completed for upload:', data.uploadId);
      console.log('Results:', data.result);

      // Update UI
      // dispatch({ type: 'OCR_COMPLETED', payload: data.result });
    }

    if (data.type === 'ocr_failed') {
      console.error('OCR failed:', data.errorMessage);
      // dispatch({ type: 'OCR_FAILED', payload: data });
    }
  };

  return ws;
}
