import { useState, useEffect, useRef } from 'react';
import CategoryList from '../components/CategoryList';
import SearchBar from '../components/SearchBar';
import ShareDocumentModal from '../components/ShareDocumentModal';
import { searchService, type SearchFilters, type SearchResult } from '../services/searchService';
import { categoryService, type Category } from '../services/categoryService';
import { uploadService } from '../services/uploadService';
import { FolderIcon, DocumentIcon, EllipsisVerticalIcon, TagIcon, HomeIcon, BookOpenIcon, ArrowUpTrayIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';

export function Documents() {
  const [uploads, setUploads] = useState<SearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedDocumentForShare, setSelectedDocumentForShare] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastDocumentRef = useRef<HTMLDivElement | null>(null);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadDocuments = async (filters: SearchFilters, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const result = await searchService.search({
        ...filters,
        categoryId: selectedCategoryId || undefined,
        page: filters.page || 1,
        limit: 20,
      });
      
      if (append) {
        setUploads(prev => [...prev, ...result.uploads]);
      } else {
        setUploads(result.uploads);
      }
      
      setPagination({
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      });
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadDocuments({ categoryId: selectedCategoryId || undefined });
  }, [selectedCategoryId]);

  // Lazy loading infinito con Intersection Observer
  useEffect(() => {
    if (loadingMore) return;

    if (observerRef.current) observerRef.current.disconnect();

    const callback: IntersectionObserverCallback = (entries) => {
      if (entries[0].isIntersecting && pagination.page < pagination.totalPages && !loading && !loadingMore) {
        loadDocuments({ page: pagination.page + 1 }, true);
      }
    };

    observerRef.current = new IntersectionObserver(callback);

    if (lastDocumentRef.current) {
      observerRef.current.observe(lastDocumentRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [uploads, pagination, loading, loadingMore]);

  const handleSearch = (filters: SearchFilters) => {
    loadDocuments(filters);
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleAssignCategory = async (uploadId: string, categoryId: string) => {
    try {
      await categoryService.assignDocument(categoryId, uploadId);
      await loadDocuments({ categoryId: selectedCategoryId || undefined });
      await loadCategories();
    } catch (error) {
      console.error('Error assigning category:', error);
      alert('Error al asignar categoría');
    }
  };

  const handleRemoveCategory = async (uploadId: string) => {
    try {
      await categoryService.removeDocumentFromCategory(uploadId);
      await loadDocuments({ categoryId: selectedCategoryId || undefined });
      await loadCategories();
    } catch (error) {
      console.error('Error removing category:', error);
      alert('Error al quitar categoría');
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadService.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      // Reload documents after upload
      await loadDocuments({ categoryId: selectedCategoryId || undefined });
      alert('Archivo subido exitosamente');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error?.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDocument = async (uploadId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await uploadService.deleteUpload(uploadId);
      await loadDocuments({ categoryId: selectedCategoryId || undefined });
      await loadCategories();
      alert('Archivo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el archivo');
    }
  };

  const handleShareDocument = (uploadId: string, fileName: string) => {
    setSelectedDocumentForShare({ id: uploadId, name: fileName });
    setShareModalOpen(true);
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedDocumentForShare(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendiente',
      processing: 'Procesando',
      completed: 'Completado',
      failed: 'Fallido',
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-lg">
                <BookOpenIcon className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">LearnMind AI</span>
            </a>
            <span className="text-gray-400">|</span>
            <h1 className="text-xl font-semibold text-gray-900">Documentos</h1>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <HomeIcon className="h-4 w-4" />
            Volver al Inicio
          </a>
        </div>
      </header>

      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Organiza tus Documentos</h2>
            <p className="text-gray-600">Busca y categoriza tus archivos con filtros avanzados</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar with Categories */}
            <div className="lg:col-span-1">
              <CategoryList
                onCategorySelect={handleCategorySelect}
                selectedCategoryId={selectedCategoryId}
              />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Upload Button and Search Bar */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleFileSelect}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  {uploading ? `Subiendo... ${uploadProgress}%` : 'Subir Archivo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,audio/*"
                />
                <div className="flex-1">
                  <SearchBar onSearch={handleSearch} categories={categories} />
                </div>
              </div>

              {/* Documents List */}
              {loading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : uploads.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Mostrando <span className="font-medium">{uploads.length}</span> de{' '}
                      <span className="font-medium">{pagination.total}</span> documentos
                    </p>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {uploads.map((upload, index) => (
                      <div 
                        key={upload.id} 
                        ref={index === uploads.length - 1 ? lastDocumentRef : null}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <DocumentIcon className="h-10 w-10 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {upload.originalFileName}
                              </h3>
                              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                                <span>{formatFileSize(upload.fileSize)}</span>
                                <span>•</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(upload.status)}`}>
                                  {getStatusText(upload.status)}
                                </span>
                                <span>•</span>
                                <span>{formatDate(upload.createdAt)}</span>
                              </div>
                              {upload.extractedText && (
                                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                  {upload.extractedText.substring(0, 200)}...
                                </p>
                              )}
                              {upload.category && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: upload.category.color }}
                                  />
                                  <span className="text-sm text-gray-600">
                                    {upload.category.icon && <span className="mr-1">{upload.category.icon}</span>}
                                    {upload.category.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions Menu */}
                          <Menu as="div" className="relative flex-shrink-0 ml-4">
                            <Menu.Button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                              <EllipsisVerticalIcon className="h-5 w-5" />
                            </Menu.Button>
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <div className="px-4 py-2 border-b border-gray-100">
                                  <p className="text-xs font-medium text-gray-500">Asignar categoría</p>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {categories.length > 0 ? (
                                    categories.map((cat) => (
                                      <Menu.Item key={cat.id}>
                                        {({ active }) => (
                                          <button
                                            onClick={() => handleAssignCategory(upload.id, cat.id)}
                                            className={`${
                                              active ? 'bg-gray-100' : ''
                                            } w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center space-x-2`}
                                          >
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="truncate">
                                              {cat.icon && <span className="mr-1">{cat.icon}</span>}
                                              {cat.name}
                                            </span>
                                          </button>
                                        )}
                                      </Menu.Item>
                                    ))
                                  ) : (
                                    <div className="px-4 py-2 text-xs text-gray-500">
                                      No hay categorías. Crea una primero.
                                    </div>
                                  )}
                                </div>
                                {upload.categoryId && (
                                  <>
                                    <div className="border-t border-gray-100"></div>
                                    <Menu.Item>
                                      {({ active }) => (
                                        <button
                                          onClick={() => handleRemoveCategory(upload.id)}
                                          className={`${
                                            active ? 'bg-gray-100' : ''
                                          } w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center space-x-2`}
                                        >
                                          <TagIcon className="h-4 w-4" />
                                          <span>Quitar categoría</span>
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </>
                                )}
                                <div className="border-t border-gray-100"></div>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleShareDocument(upload.id, upload.originalFileName)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } w-full text-left px-4 py-2 text-sm text-blue-600 flex items-center space-x-2`}
                                    >
                                      <ShareIcon className="h-4 w-4" />
                                      <span>Compartir</span>
                                    </button>
                                  )}
                                </Menu.Item>
                                <div className="border-t border-gray-100"></div>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDeleteDocument(upload.id)}
                                      className={`${
                                        active ? 'bg-gray-100' : ''
                                      } w-full text-left px-4 py-2 text-sm text-red-600 flex items-center space-x-2`}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                      <span>Eliminar archivo</span>
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Menu>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Loading indicator para lazy loading */}
                  {loadingMore && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Cargando más documentos...</span>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <button
                        onClick={() => handleSearch({ page: pagination.page - 1 })}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-700">
                        Página {pagination.page} de {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handleSearch({ page: pagination.page + 1 })}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No hay documentos</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedCategoryId 
                      ? 'No se encontraron documentos en esta categoría'
                      : 'Comienza subiendo tu primer documento'}
                  </p>
                  {!selectedCategoryId && (
                    <button
                      onClick={handleFileSelect}
                      disabled={uploading}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUpTrayIcon className="h-5 w-5" />
                      Subir tu primer archivo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Share Document Modal */}
      {selectedDocumentForShare && (
        <ShareDocumentModal
          isOpen={shareModalOpen}
          onClose={handleCloseShareModal}
          uploadId={selectedDocumentForShare.id}
          fileName={selectedDocumentForShare.name}
        />
      )}
    </div>
  );
}
