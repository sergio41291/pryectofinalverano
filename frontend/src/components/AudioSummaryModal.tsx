import { useState } from 'react';
import { X, Copy, Download, Loader } from 'lucide-react';

interface AudioSummaryModalProps {
  isOpen: boolean;
  audioResultId: string;
  onClose: () => void;
  onComplete?: (summary: string) => void;
}

export function AudioSummaryModal({
  isOpen,
  audioResultId,
  onClose,
  onComplete,
}: AudioSummaryModalProps) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary('');

    console.log('Generating summary for audioResultId:', audioResultId);

    try {
      // Usar el endpoint de audio específico
      const response = await fetch(
        `http://localhost:3001/api/processing/audio/${audioResultId}/summary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            language: 'es',
            maxTokens: 1024,
          }),
        }
      );

      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        throw new Error('Error generating summary');
      }

      if (!response.body) throw new Error('No response body');

      // Procesar stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullSummary = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullSummary += data.content;
                setSummary(fullSummary);
              }
              if (data.complete) {
                onComplete?.(fullSummary);
              }
            } catch (e) {
              // Ignorar errores de parseo
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([summary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `resumen_audio_${new Date().getTime()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white border-b">
          <h2 className="text-xl font-bold">Generar Resumen con IA</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Generate Button */}
          {!summary && (
            <button
              onClick={handleGenerateSummary}
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader className="animate-spin" size={20} />}
              {loading ? 'Generando resumen...' : 'Generar Resumen'}
            </button>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Summary Content */}
          {summary && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                  {summary}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Copy size={16} />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Descargar
                </button>
                <button
                  onClick={() => {
                    setSummary('');
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Generar Otro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
