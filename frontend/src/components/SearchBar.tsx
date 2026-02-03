import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { type SearchFilters } from '../services/searchService';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  categories?: Array<{ id: string; name: string; color: string }>;
}

export default function SearchBar({ onSearch, categories = [] }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categoryId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    status: undefined,
    mimeType: undefined,
  });

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch({ ...filters, query });
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [query, filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setQuery('');
    setFilters({
      query: '',
      categoryId: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      status: undefined,
      mimeType: undefined,
    });
    onSearch({});
  };

  const activeFiltersCount = [
    filters.categoryId,
    filters.dateFrom,
    filters.dateTo,
    filters.status,
    filters.mimeType,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Search Input */}
      <div className="p-4">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full rounded-md border-0 py-2 pl-10 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Buscar en documentos..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
            {(query || activeFiltersCount > 0) && (
              <button
                onClick={clearFilters}
                className="text-gray-400 hover:text-gray-600"
                title="Limpiar búsqueda"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-1 rounded ${showFilters ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Filtros"
            >
              <FunnelIcon className="h-5 w-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={filters.categoryId || ''}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="processing">Procesando</option>
                <option value="completed">Completado</option>
                <option value="failed">Fallido</option>
              </select>
            </div>

            {/* MIME Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de archivo
              </label>
              <select
                value={filters.mimeType || ''}
                onChange={(e) => handleFilterChange('mimeType', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Todos los tipos</option>
                <option value="application/pdf">PDF</option>
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="audio/mpeg">MP3</option>
                <option value="audio/wav">WAV</option>
                <option value="video/mp4">MP4</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
