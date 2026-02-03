import React, { useState, useEffect } from 'react';
import translationsService, { type Translation } from '../services/translationsService';
import { Copy, Trash2, Loader, Eye, Globe, FileText } from 'lucide-react';

interface TranslationsListProps {
  refreshTrigger?: number;
}

export const TranslationsList: React.FC<TranslationsListProps> = ({ refreshTrigger }) => {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewingTranslation, setViewingTranslation] = useState<Translation | null>(null);

  const fetchTranslations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await translationsService.getUserTranslations();
      setTranslations(data);
    } catch (err: any) {
      console.error('Error fetching translations:', err);
      setError(err.message || 'Error al cargar traducciones');
      setTranslations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranslations();
  }, [refreshTrigger]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDelete = async (translationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta traducción?')) return;

    setDeleting(translationId);
    try {
      await translationsService.deleteTranslation(translationId);
      setTranslations(translations.filter(t => t.id !== translationId));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar traducción');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLanguageLabel = (code: string) => {
    const labels: Record<string, string> = {
      es: 'Español',
      en: 'English',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
    };
    return labels[code] || code.toUpperCase();
  };

  if (loading && translations.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      {loading && !translations?.length ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={40} className="animate-spin text-purple-600" />
        </div>
      ) : !translations || translations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No tienes traducciones guardadas</p>
          <p className="text-gray-400 text-sm">
            Comienza traduciendo un documento desde IA Lab
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {translations.map((translation) => (
            <div
              key={translation.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {translation.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span>
                        {getLanguageLabel(translation.sourceLanguage)} → {getLanguageLabel(translation.targetLanguage)}
                      </span>
                    </div>
                    
                    {translation.sourceFileName && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="truncate max-w-xs">
                          {translation.sourceFileName}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{formatDate(translation.createdAt)}</span>
                    {translation.originalCharCount && (
                      <span>• {translation.originalCharCount} caracteres</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setViewingTranslation(translation)}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors group"
                    title="Ver traducción"
                  >
                    <Eye className="h-5 w-5 text-gray-600 group-hover:text-purple-600" />
                  </button>
                  <button
                    onClick={() => handleCopy(translation.translatedText)}
                    className="p-2 hover:bg-green-50 rounded-lg transition-colors group"
                    title="Copiar traducción"
                  >
                    <Copy className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(translation.id)}
                    disabled={deleting === translation.id}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deleting === translation.id ? (
                      <Loader className="h-5 w-5 text-red-600 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5 text-gray-600 group-hover:text-red-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Translation Modal */}
      {viewingTranslation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{viewingTranslation.title}</h2>
                <p className="text-purple-100 text-sm mt-1">
                  {getLanguageLabel(viewingTranslation.sourceLanguage)} → {getLanguageLabel(viewingTranslation.targetLanguage)}
                </p>
              </div>
              <button
                onClick={() => setViewingTranslation(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500">
                    ORIGINAL ({viewingTranslation.sourceLanguage.toUpperCase()})
                  </p>
                  <button
                    onClick={() => handleCopy(viewingTranslation.originalText)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copiar original"
                  >
                    <Copy className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {viewingTranslation.originalText}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-purple-600">
                    TRADUCCIÓN ({viewingTranslation.targetLanguage.toUpperCase()})
                  </p>
                  <button
                    onClick={() => handleCopy(viewingTranslation.translatedText)}
                    className="p-1 hover:bg-purple-200 rounded transition-colors"
                    title="Copiar traducción"
                  >
                    <Copy className="h-4 w-4 text-purple-600" />
                  </button>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {viewingTranslation.translatedText}
                </p>
              </div>

              {viewingTranslation.sourceFileName && (
                <div className="text-xs text-gray-500">
                  <p>Archivo fuente: {viewingTranslation.sourceFileName}</p>
                  <p>Fecha: {formatDate(viewingTranslation.createdAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
