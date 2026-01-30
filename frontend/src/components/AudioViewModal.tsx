import { X, Copy, Download } from 'lucide-react';
import type { AudioResult } from '../services/audioService';
import { useState } from 'react';

interface AudioViewModalProps {
  result: AudioResult | null;
  onClose: () => void;
}

export function AudioViewModal({ result, onClose }: AudioViewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = () => {
    const element = document.createElement('a');
    const file = new Blob([result.transcription], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `transcription_${result.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Transcripción</h2>
            <p className="text-sm text-gray-500 mt-1">
              Idioma: {result.languageDetails?.language || result.language || 'Auto-detectado'}
              {result.languageDetails?.confidence && ` • Confianza: ${(result.languageDetails.confidence * 100).toFixed(1)}%`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-96 overflow-y-auto">
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {result.transcription}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
            >
              <Copy size={18} />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button
              onClick={downloadAsText}
              className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              <Download size={18} />
              Descargar
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500 space-y-1">
            <p>ID de resultado: {result.id}</p>
            <p>Procesado: {result.completedAt ? new Date(result.completedAt).toLocaleString('es-ES') : 'En proceso'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
