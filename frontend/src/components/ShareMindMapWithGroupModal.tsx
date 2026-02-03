import { useState, useEffect } from 'react';
import { X, Users, Loader } from 'lucide-react';
import groupsService, { type Group } from '../services/groupsService';
import mindMapsService from '../services/mindMapsService';

interface ShareMindMapWithGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mindMapId: string;
  mindMapTitle: string;
  currentGroupId?: string | null;
  onSuccess: () => void;
}

export function ShareMindMapWithGroupModal({
  isOpen,
  onClose,
  mindMapId,
  mindMapTitle,
  currentGroupId,
  onSuccess,
}: ShareMindMapWithGroupModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      setSelectedGroupId(currentGroupId || '');
    }
  }, [isOpen, currentGroupId]);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await groupsService.getMyGroups(1, 100);
      setGroups(response.groups);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleShare = async () => {
    if (!selectedGroupId) {
      setError('Please select a group');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await mindMapsService.shareWithGroup(mindMapId, selectedGroupId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error sharing mind map');
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async () => {
    if (!window.confirm('Are you sure you want to stop sharing this mind map with the group?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await mindMapsService.unshareFromGroup(mindMapId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error unsharing mind map');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Share Mind Map with Group</h2>
              <p className="text-sm text-gray-500">{mindMapTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loadingGroups ? (
            <div className="flex items-center justify-center py-8">
              <Loader size={32} className="animate-spin text-purple-600" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-sm">
                You don't have any groups.
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Create a group first to share mind maps.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select a group
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedGroupId === group.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="group"
                        value={group.id}
                        checked={selectedGroupId === group.id}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">{group.name}</div>
                        {group.description && (
                          <div className="text-sm text-gray-500 mt-1">{group.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {group.members?.length || 0} {(group.members?.length || 0) === 1 ? 'member' : 'members'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {currentGroupId && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    This mind map is currently shared with a group.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          {currentGroupId && (
            <button
              onClick={handleUnshare}
              disabled={loading || loadingGroups}
              className="flex-1 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Unsharing...' : 'Stop Sharing'}
            </button>
          )}
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={loading || loadingGroups || groups.length === 0 || !selectedGroupId}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}
