import { Copy, Download, FileText } from 'lucide-react';
import type { OcrResult } from '../services/api';
import { useState } from 'react';

interface OCRResultsProps {
  result: OcrResult;
  fileName: string;
}

export function OCRResults({ result, fileName }: OCRResultsProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = () => {
    const element = document.createElement('a');
    const file = new Blob([result.rawText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileName.split('.')[0]}_ocr.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg text-green-600">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{fileName}</h3>
            <p className="text-sm text-gray-500">
              Confianza: {(result.confidence * 100).toFixed(1)}% • Idioma: {result.language}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
        <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
          {result.rawText}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
        >
          <Copy size={18} />
          {copied ? 'Copiado!' : 'Copiar Texto'}
        </button>
        <button
          onClick={downloadAsText}
          className="flex items-center gap-2 flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
        >
          <Download size={18} />
          Descargar
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Procesado: {new Date(result.processedAt).toLocaleString('es-ES')}
      </div>
    </div>
  );
}
