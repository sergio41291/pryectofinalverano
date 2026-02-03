import { useState, useEffect } from 'react';
import { type Category, categoryService } from '../services/categoryService';
import CategoryModal from './CategoryModal.tsx';
import { FolderIcon, PlusIcon, PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface CategoryListProps {
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategoryId?: string | null;
}

export default function CategoryList({ onCategorySelect, selectedCategoryId }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de eliminar esta categoría? Los documentos no se eliminarán.')) {
      return;
    }
    try {
      await categoryService.delete(categoryId);
      await loadCategories();
      if (selectedCategoryId === categoryId) {
        onCategorySelect?.(null);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error al eliminar la categoría');
    }
  };

  const handleModalClose = async (shouldReload: boolean) => {
    setIsModalOpen(false);
    setEditingCategory(null);
    if (shouldReload) {
      await loadCategories();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Categorías</h2>
        <button
          onClick={handleCreateCategory}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Nueva
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {/* All Documents Option */}
        <button
          onClick={() => onCategorySelect?.(null)}
          className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
            selectedCategoryId === null ? 'bg-indigo-50' : ''
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FolderIcon className="h-5 w-5 text-gray-400" />
            </div>
            <span className={`text-sm font-medium ${selectedCategoryId === null ? 'text-indigo-600' : 'text-gray-900'}`}>
              Todos los documentos
            </span>
          </div>
        </button>

        {/* Category List */}
        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => onCategorySelect?.(category.id)}
            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer ${
              selectedCategoryId === category.id ? 'bg-indigo-50' : ''
            }`}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`text-sm font-medium truncate flex items-center gap-1 ${
                  selectedCategoryId === category.id ? 'text-indigo-600' : 'text-gray-900'
                }`}>
                  {category.icon && <span className="mr-1">{category.icon}</span>}
                  {category.name}
                  {category.sharedWithGroup && (
                    <UserGroupIcon 
                      className="h-3 w-3 text-blue-500" 
                      title={`Compartida con: ${category.sharedWithGroup.name}`}
                    />
                  )}
                </p>
                {category.description && (
                  <p className="text-xs text-gray-500 truncate">{category.description}</p>
                )}
                {category.sharedWithGroup && (
                  <p className="text-xs text-blue-500 truncate">
                    📁 {category.sharedWithGroup.name}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {category.documentCount || 0}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => handleEditCategory(category, e)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCategory(category.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Eliminar"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No hay categorías. Crea una nueva para organizar tus documentos.
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        category={editingCategory}
      />
    </div>
  );
}
