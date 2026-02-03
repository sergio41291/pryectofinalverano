import React, { useState, useEffect } from 'react';
import groupsService, {
  type Group,
  type GroupMember,
  type AddMemberDto,
} from '../services/groupsService';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  onUpdate: () => void;
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  onClose,
  group,
  onUpdate,
}) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMemberData, setAddMemberData] = useState<AddMemberDto>({
    email: '',
    role: 'member',
  });
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (isOpen && group) {
      loadGroupDetails();
    }
  }, [isOpen, group]);

  const loadGroupDetails = async () => {
    if (!group) return;

    try {
      setLoading(true);
      setError(null);
      const groupData = await groupsService.getGroup(group.id);
      setMembers(groupData.members || []);
    } catch (err: any) {
      console.error('Error cargando miembros:', err);
      setError(err.response?.data?.message || 'Error al cargar miembros');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    try {
      setLoading(true);
      setError(null);
      await groupsService.addMember(group.id, addMemberData);
      setAddMemberData({ email: '', role: 'member' });
      setShowAddForm(false);
      await loadGroupDetails();
      onUpdate();
    } catch (err: any) {
      console.error('Error agregando miembro:', err);
      setError(err.response?.data?.message || 'Error al agregar miembro');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: 'admin' | 'member'
  ) => {
    if (!group) return;

    try {
      setError(null);
      await groupsService.updateMemberRole(group.id, userId, { role: newRole });
      await loadGroupDetails();
      onUpdate();
    } catch (err: any) {
      console.error('Error actualizando rol:', err);
      setError(err.response?.data?.message || 'Error al actualizar rol');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!group) return;

    if (
      !confirm(`¿Estás seguro de remover a ${userName} del grupo?`)
    ) {
      return;
    }

    try {
      setError(null);
      await groupsService.removeMember(group.id, userId);
      await loadGroupDetails();
      onUpdate();
    } catch (err: any) {
      console.error('Error removiendo miembro:', err);
      setError(err.response?.data?.message || 'Error al remover miembro');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
            Propietario
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Administrador
          </span>
        );
      case 'member':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Miembro
          </span>
        );
      default:
        return null;
    }
  };

  const isOwner = group?.ownerId === currentUserId;
  const currentUserRole = members.find((m) => m.userId === currentUserId)?.role;
  const canManage = isOwner || currentUserRole === 'admin';

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Miembros del Grupo
              </h2>
              <p className="text-sm text-gray-600 mt-1">{group.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Add Member Button */}
            {canManage && !showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full mb-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Agregar Miembro
              </button>
            )}

            {/* Add Member Form */}
            {showAddForm && (
              <form
                onSubmit={handleAddMember}
                className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Agregar Nuevo Miembro
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email del usuario
                    </label>
                    <input
                      type="email"
                      value={addMemberData.email}
                      onChange={(e) =>
                        setAddMemberData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="usuario@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol
                    </label>
                    <select
                      value={addMemberData.role}
                      onChange={(e) =>
                        setAddMemberData((prev) => ({
                          ...prev,
                          role: e.target.value as 'admin' | 'member',
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="member">Miembro</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setAddMemberData({ email: '', role: 'member' });
                        setError(null);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !addMemberData.email}
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? 'Agregando...' : 'Agregar'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Members List */}
            {loading && members.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const isCurrentUser = member.userId === currentUserId;
                  const isMemberOwner = member.role === 'owner';
                  const canModify = canManage && !isMemberOwner && !isCurrentUser;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {member.user?.firstName?.charAt(0) ||
                                member.user?.email?.charAt(0) ||
                                '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.user?.firstName} {member.user?.lastName}
                              {isCurrentUser && (
                                <span className="text-gray-500 text-sm ml-2">
                                  (Tú)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              {member.user?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {canModify ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleUpdateRole(
                                member.userId,
                                e.target.value as 'admin' | 'member'
                              )
                            }
                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="member">Miembro</option>
                            <option value="admin">Administrador</option>
                          </select>
                        ) : (
                          getRoleBadge(member.role)
                        )}

                        {canModify && (
                          <button
                            onClick={() =>
                              handleRemoveMember(
                                member.userId,
                                `${member.user?.firstName} ${member.user?.lastName}`
                              )
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Remover miembro"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Plan Info */}
            {group.owner && (
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Límite de miembros:</strong> Plan PRO permite hasta 5
                  miembros. Plan ENTERPRISE permite miembros ilimitados.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;
