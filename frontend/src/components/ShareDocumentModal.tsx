import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserPlusIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';
import { uploadService, type DocumentShare, type ShareDocumentDto } from '../services/uploadService';

interface ShareDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadId: string;
  fileName: string;
}

export default function ShareDocumentModal({ isOpen, onClose, uploadId, fileName }: ShareDocumentModalProps) {
  const [shares, setShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen, uploadId]);

  const loadShares = async () => {
    try {
      setLoading(true);
      const data = await uploadService.getDocumentShares(uploadId);
      setShares(data);
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSharing(true);

    try {
      const dto: ShareDocumentDto = { userEmail: email, permission };
      await uploadService.shareDocument(uploadId, dto);
      setEmail('');
      setPermission('view');
      await loadShares();
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Error al compartir documento');
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (shareId: string) => {
    if (!confirm('¿Estás seguro de que deseas dejar de compartir con este usuario?')) {
      return;
    }

    try {
      await uploadService.unshareDocument(uploadId, shareId);
      await loadShares();
    } catch (error) {
      alert('Error al dejar de compartir');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <ShareIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                        Compartir Documento
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">{fileName}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Share Form */}
                <form onSubmit={handleShare} className="mb-6">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email del usuario"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={permission}
                      onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="view">Solo ver</option>
                      <option value="edit">Ver y editar</option>
                    </select>
                    <button
                      type="submit"
                      disabled={sharing}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                      <UserPlusIcon className="h-5 w-5" />
                      {sharing ? 'Compartiendo...' : 'Compartir'}
                    </button>
                  </div>
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </form>

                {/* Shared Users List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Compartido con ({shares.length})
                  </h4>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : shares.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {shares.map((share) => (
                        <div
                          key={share.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-semibold">
                              {share.sharedWith?.firstName?.[0] || share.sharedWith?.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {share.sharedWith?.firstName} {share.sharedWith?.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{share.sharedWith?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              share.permission === 'edit' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {share.permission === 'edit' ? 'Puede editar' : 'Solo ver'}
                            </span>
                            <button
                              onClick={() => handleUnshare(share.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShareIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Este documento no está compartido con nadie</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
