import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { type Category, type CreateCategoryDto, type UpdateCategoryDto, categoryService } from '../services/categoryService';
import { groupService, type Group } from '../services/groupService';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: (shouldReload: boolean) => void;
  category?: Category | null;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
];

const PRESET_ICONS = ['📁', '📂', '📚', '📖', '📝', '📄', '📊', '📈', '🎓', '💼', '🔬', '🎨', '🎵', '🎬', '📷', '🌟'];

export default function CategoryModal({ isOpen, onClose, category }: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [sharingLoading, setSharingLoading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await groupService.getMyGroups();
        setGroups(data);
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    };

    if (isOpen && category) {
      loadGroups();
      setSelectedGroupId(category.sharedWithGroupId || '');
    }
  }, [isOpen, category]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#6366f1',
        icon: '',
      });
    }
    setError('');
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (category) {
        const updateDto: UpdateCategoryDto = {
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          icon: formData.icon || undefined,
        };
        await categoryService.update(category.id, updateDto);
      } else {
        const createDto: CreateCategoryDto = {
          name: formData.name,
          description: formData.description || undefined,
          color: formData.color,
          icon: formData.icon || undefined,
        };
        await categoryService.create(createDto);
      }
      onClose(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => onClose(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={() => onClose(false)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                      {category ? 'Editar Categoría' : 'Nueva Categoría'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="rounded-md bg-red-50 p-4">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}

                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          id="name"
                          required
                          maxLength={100}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <textarea
                          id="description"
                          rows={3}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setFormData({ ...formData, color })}
                              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="h-8 w-16 rounded border border-gray-300"
                          />
                          <span className="text-sm text-gray-500">{formData.color}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Icono (opcional)
                        </label>
                        <div className="grid grid-cols-8 gap-2 mb-2">
                          {PRESET_ICONS.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => setFormData({ ...formData, icon })}
                              className={`w-8 h-8 rounded border-2 flex items-center justify-center text-lg transition-transform hover:scale-110 ${
                                formData.icon === icon ? 'border-indigo-600 scale-110 bg-indigo-50' : 'border-gray-300'
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="O escribe un emoji personalizado"
                          maxLength={2}
                          value={formData.icon}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      {/* Compartir con grupo (solo al editar) */}
                      {category && groups.length > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Compartir con grupo
                          </label>
                          <select
                            value={selectedGroupId}
                            onChange={async (e) => {
                              const groupId = e.target.value;
                              setSelectedGroupId(groupId);
                              if (!category) return;
                              
                              try {
                                setSharingLoading(true);
                                if (groupId) {
                                  await categoryService.shareWithGroup(category.id, groupId);
                                } else {
                                  await categoryService.unshareFromGroup(category.id);
                                }
                              } catch (err: any) {
                                setError(err.response?.data?.message || 'Error al compartir categoría');
                              } finally {
                                setSharingLoading(false);
                              }
                            }}
                            disabled={sharingLoading}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                          >
                            <option value="">No compartir</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                          {category.sharedWithGroup && (
                            <p className="mt-1 text-xs text-gray-500">
                              Compartida con: {category.sharedWithGroup.name}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                        >
                          {loading ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onClose(false)}
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
