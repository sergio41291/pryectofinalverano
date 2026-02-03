import { useState, useEffect } from 'react';
import { X, Copy, Check, Edit2 } from 'lucide-react';
import api from '../services/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaireId: string;
  questionnaireName: string;
  onShareConfigured?: () => void;
}

interface ShareConfig {
  id: string;
  shareType: 'public' | 'password' | 'email' | 'private';
  sharePassword?: string;
  allowedEmails?: string[];
  validFrom?: string;
  validUntil?: string;
  shareToken: string;
}

type ShareType = 'public' | 'password' | 'email' | 'private';

export function ShareModal({ isOpen, onClose, questionnaireId, questionnaireName }: ShareModalProps) {
  const [shareType, setShareType] = useState<ShareType>('public');
  const [password, setPassword] = useState('');
  const [emails, setEmails] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Cargar configuración existente
  useEffect(() => {
    if (isOpen) {
      loadExistingConfig();
    }
  }, [isOpen, questionnaireId]);

  const loadExistingConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await api.get(`/questionnaires/${questionnaireId}/share-config`);
      const config: ShareConfig = response.data;
      
      if (config && config.shareToken) {
        setShareToken(config.shareToken);
        setShareType(config.shareType);
        setPassword(config.sharePassword || '');
        setEmails(config.allowedEmails?.join(', ') || '');
        
        // Fechas vienen como strings del backend (ej: "2026-02-01T02:15:00")
        // Extraer el formato datetime-local (sin los segundos)
        if (config.validFrom) {
          setValidFrom(config.validFrom.slice(0, 16)); // "2026-02-01T02:15"
        }
        if (config.validUntil) {
          setValidUntil(config.validUntil.slice(0, 16)); // "2026-02-01T20:00"
        }
        
        setIsEditing(false);
      } else {
        resetForm();
      }
    } catch (err: any) {
      // No hay configuración existente (404) o error - mostrar formulario vacío
      if (err.response?.status === 404 || err.response?.status === 409) {
        resetForm();
      } else {
        // Otro error
        setError(err.response?.data?.message || 'Error al cargar la configuración');
        resetForm();
      }
    } finally {
      setLoadingConfig(false);
    }
  };

  const resetForm = () => {
    setShareToken('');
    setShareType('public');
    setPassword('');
    setEmails('');
    setValidFrom('');
    setValidUntil('');
    setError('');
    setSuccess(false);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Convert datetime-local to date string without timezone conversion
      // datetime-local format is "YYYY-MM-DDTHH:mm" which is already in local time
      const shareConfig: any = {
        shareType,
        sharePassword: shareType === 'password' ? password : undefined,
        allowedEmails: shareType === 'email' ? emails.split(',').map((e) => e.trim()).filter((e) => e) : undefined,
        validFrom: validFrom ? `${validFrom}:00` : undefined, // Add seconds for ISO format
        validUntil: validUntil ? `${validUntil}:00` : undefined,
      };

      const response = await api.post(`/questionnaires/${questionnaireId}/share`, shareConfig);

      setShareToken(response.data.shareToken);
      setSuccess(true);
      setIsEditing(false); // Volver a mostrar la vista de enlace
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al configurar el compartir');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const shareUrl = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  if (loadingConfig) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Compartir: {questionnaireName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700 text-sm font-medium">
            Configuración compartida exitosamente
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {shareToken && !isEditing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-3">Enlace Público Generado:</p>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/share/${shareToken}`}
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-mono"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">Comparte este enlace para que otros accedan al cuestionario.</p>
            
            <div className="bg-white p-3 rounded border border-gray-200 mb-4 space-y-2 text-sm">
              <div><span className="font-semibold text-gray-700">Tipo:</span> <span className="text-gray-600 capitalize">{shareType === 'public' ? 'Público' : shareType === 'password' ? 'Protegido por Contraseña' : shareType === 'email' ? 'Correos Permitidos' : 'Privado'}</span></div>
              {validFrom && <div><span className="font-semibold text-gray-700">Desde:</span> <span className="text-gray-600">{validFrom.split('T')[0]}, {validFrom.split('T')[1]}</span></div>}
              {validUntil && <div><span className="font-semibold text-gray-700">Hasta:</span> <span className="text-gray-600">{validUntil.split('T')[0]}, {validUntil.split('T')[1]}</span></div>}
            </div>
          </div>
        )}

        {shareToken && !isEditing && (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Edit2 size={16} />
              Editar
            </button>
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Listo
            </button>
          </div>
        )}

        {(!shareToken || isEditing) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Compartir</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{ borderColor: shareType === 'public' ? '#3b82f6' : undefined, backgroundColor: shareType === 'public' ? '#eff6ff' : undefined }}>
                <input type="radio" value="public" checked={shareType === 'public'} onChange={(e) => setShareType(e.target.value as ShareType)} />
                <div>
                  <p className="font-medium text-gray-900">Público</p>
                  <p className="text-xs text-gray-500">Cualquiera puede acceder</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{ borderColor: shareType === 'password' ? '#3b82f6' : undefined, backgroundColor: shareType === 'password' ? '#eff6ff' : undefined }}>
                <input type="radio" value="password" checked={shareType === 'password'} onChange={(e) => setShareType(e.target.value as ShareType)} />
                <div>
                  <p className="font-medium text-gray-900">Protegido por Contraseña</p>
                  <p className="text-xs text-gray-500">Requiere contraseña para acceder</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{ borderColor: shareType === 'email' ? '#3b82f6' : undefined, backgroundColor: shareType === 'email' ? '#eff6ff' : undefined }}>
                <input type="radio" value="email" checked={shareType === 'email'} onChange={(e) => setShareType(e.target.value as ShareType)} />
                <div>
                  <p className="font-medium text-gray-900">Correos Permitidos</p>
                  <p className="text-xs text-gray-500">Solo usuarios con estos correos</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors" style={{ borderColor: shareType === 'private' ? '#3b82f6' : undefined, backgroundColor: shareType === 'private' ? '#eff6ff' : undefined }}>
                <input type="radio" value="private" checked={shareType === 'private'} onChange={(e) => setShareType(e.target.value as ShareType)} />
                <div>
                  <p className="font-medium text-gray-900">Privado</p>
                  <p className="text-xs text-gray-500">Solo tú tienes acceso</p>
                </div>
              </label>
            </div>
          </div>

          {shareType === 'password' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa una contraseña" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" required />
            </div>
          )}

          {shareType === 'email' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Correos Permitidos</label>
              <textarea value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="Separa los correos con comas: user1@example.com, user2@example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 h-20 resize-none" required />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Válido desde (opcional)</label>
            <input type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Válido hasta (opcional)</label>
            <input type="datetime-local" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => {
              if (shareToken) {
                setIsEditing(false);
              } else {
                onClose();
              }
            }} className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors">
              {loading ? 'Configurando...' : 'Configurar Compartir'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
