import React, { useState } from 'react';
import GroupsList from '../components/GroupsList';
import GroupModal from '../components/GroupModal';
import GroupMembersModal from '../components/GroupMembersModal';
import { GroupQuestionnaires } from '../components/GroupQuestionnaires';
import { GroupMindMaps } from '../components/GroupMindMaps';
import { GroupSummaries } from '../components/GroupSummaries';
import { type Group } from '../services/groupsService';

const Groups: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'questionnaires' | 'mindMaps' | 'summaries'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setActiveTab('questionnaires');
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };

  const handleManageMembers = (group: Group) => {
    setSelectedGroup(group);
    setIsMembersModalOpen(true);
  };

  const handleModalSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleMembersModalClose = () => {
    setIsMembersModalOpen(false);
    setSelectedGroup(null);
  };

  const handleMembersUpdate = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Grupos de Colaboración
              </h1>
              <p className="mt-2 text-gray-600">
                Crea grupos para colaborar con otros usuarios, compartir cuestionarios,
                mapas mentales y resúmenes
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
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
              Crear Grupo
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('list');
                setSelectedGroup(null);
              }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'list'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Mis Grupos
            </button>
            <button
              onClick={() => setActiveTab('questionnaires')}
              disabled={!selectedGroup}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'questionnaires' && selectedGroup
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${!selectedGroup ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedGroup ? `Cuestionarios - ${selectedGroup.name}` : 'Cuestionarios'}
            </button>
            <button
              onClick={() => setActiveTab('mindMaps')}
              disabled={!selectedGroup}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'mindMaps' && selectedGroup
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${!selectedGroup ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedGroup ? `Mapas - ${selectedGroup.name}` : 'Mapas Mentales'}
            </button>
            <button
              onClick={() => setActiveTab('summaries')}
              disabled={!selectedGroup}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'summaries' && selectedGroup
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${!selectedGroup ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {selectedGroup ? `Resúmenes - ${selectedGroup.name}` : 'Resúmenes'}
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'list' ? (
          <GroupsList
            onGroupSelect={handleGroupSelect}
            onEditGroup={handleEditGroup}
            onManageMembers={handleManageMembers}
            refreshTrigger={refreshTrigger}
          />
        ) : activeTab === 'questionnaires' && selectedGroup ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setActiveTab('list');
                  setSelectedGroup(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Volver a Mis Grupos
              </button>
            </div>
            <GroupQuestionnaires groupId={selectedGroup.id} />
          </div>
        ) : activeTab === 'mindMaps' && selectedGroup ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setActiveTab('list');
                  setSelectedGroup(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Volver a Mis Grupos
              </button>
            </div>
            <GroupMindMaps groupId={selectedGroup.id} />
          </div>
        ) : activeTab === 'summaries' && selectedGroup ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setActiveTab('list');
                  setSelectedGroup(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Volver a Mis Grupos
              </button>
            </div>
            <GroupSummaries groupId={selectedGroup.id} />
          </div>
        ) : null}

        {/* Create Group Modal */}
        <GroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleModalSuccess}
        />

        {/* Edit Group Modal */}
        <GroupModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGroup(null);
          }}
          onSuccess={handleModalSuccess}
          group={selectedGroup}
        />

        {/* Manage Members Modal */}
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          onClose={handleMembersModalClose}
          group={selectedGroup}
          onUpdate={handleMembersUpdate}
        />
      </div>
    </div>
  );
};

export { Groups };
