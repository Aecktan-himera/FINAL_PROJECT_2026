import { useState } from 'react';
import { useProject, useDeleteProject, useUpdateProject } from '../../hooks/useProjects';
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from '../../hooks/useProjectMembers';
import { useTabsStore } from '../../store/tabsStore';
import { useAuthStore } from '../../store/authStore';
import { ProjectFormModal } from '../modal/ProjectFormModal';
import { PlusIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';

export const ProjectDetail = ({ projectId }: { projectId: string }) => {
  const { data: project, isLoading } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const addTab = useTabsStore((s) => s.addTab);
  const { user: currentUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'team_lead' | 'developer' | 'viewer'>('developer');

  // Определяем, может ли текущий пользователь управлять участниками (owner или team_lead)
  const currentMember = members?.find(m => m.userId === currentUser?.id);
  const canManageMembers = currentMember?.projectRole === 'owner' || currentMember?.projectRole === 'team_lead';

  const handleDelete = async () => {
    if (window.confirm('Удалить проект?')) {
      await deleteProject.mutateAsync(projectId);
      const closeTab = useTabsStore.getState().closeTab;
      const activeId = useTabsStore.getState().activeTabId;
      if (activeId) closeTab(activeId);
    }
  };

  const handleOpenParent = () => {
    if (project?.parentProjectId) {
      addTab({
        title: `Проект: ${project.parentProject?.name || 'Родитель'}`,
        type: 'project-detail',
        data: { projectId: project.parentProjectId },
      });
    }
  };

  const handleAddMember = async () => {
    if (!newMemberId) return;
    try {
      await addMember.mutateAsync({ userId: newMemberId, projectRole: newMemberRole });
      setNewMemberId('');
      setShowAddMember(false);
    } catch (err) {
      alert('Ошибка при добавлении участника');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (window.confirm(`Удалить участника ${userName} из проекта?`)) {
      await removeMember.mutateAsync(userId);
    }
  };

  if (isLoading) return <div className="p-4 text-white">Загрузка...</div>;
  if (!project) return <div className="p-4 text-white">Проект не найден</div>;

  return (
    <div className="p-4 text-white min-h-[65vh]">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold">{project.name}</h3>
          <p className="text-white/70">Ключ: {project.key}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsEditing(true)} className="bg-white/20 px-3 py-1 rounded hover:bg-white/30">
            Редактировать
          </button>
          <button onClick={handleDelete} className="bg-red-500/50 px-3 py-1 rounded hover:bg-red-600/70">
            Удалить
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <p><strong>Описание:</strong> {project.description || '—'}</p>
        <p><strong>Владелец:</strong> {project.owner?.username || project.ownerId}</p>
        <p><strong>Ответственный:</strong> {project.responsible?.username || 'Не назначен'}</p>
        <p>
          <strong>Родительский проект:</strong>{' '}
          {project.parentProject ? (
            <button onClick={handleOpenParent} className="text-blue-300 hover:underline">
              {project.parentProject.name}
            </button>
          ) : '—'}
        </p>
        <p><strong>Дата создания:</strong> {new Date(project.createdAt).toLocaleDateString()}</p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xl font-semibold">Участники</h4>
          {canManageMembers && (
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded text-white hover:bg-white/30"
            >
              <UserPlusIcon className="h-4 w-4" /> Добавить
            </button>
          )}
        </div>

        {membersLoading ? (
          <p>Загрузка участников...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left p-2">Пользователь</th>
                  <th className="text-left p-2">Роль в проекте</th>
                  <th className="text-left p-2">Дата加入</th>
                  {canManageMembers && <th className="text-left p-2">Действие</th>}
                </tr>
              </thead>
              <tbody>
                {members?.map((member) => (
                  <tr key={member.userId} className="border-b border-white/10">
                    <td className="p-2">{member.user.username}</td>
                    <td className="p-2">{member.projectRole}</td>
                    <td className="p-2">{new Date(member.joinedAt).toLocaleDateString()}</td>
                    {canManageMembers && member.projectRole !== 'owner' && (
                      <td className="p-2">
                        <button
                          onClick={() => handleRemoveMember(member.userId, member.user.username)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модалка редактирования проекта */}
      <ProjectFormModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        initialData={project}
        isEditing
      />

      {/* Модалка добавления участника */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-96">
            <h3 className="text-xl font-bold mb-4">Добавить участника</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="ID пользователя (UUID)"
                value={newMemberId}
                onChange={(e) => setNewMemberId(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                className="w-full p-2 rounded bg-gray-800 text-white"
              >
                <option value="developer">Разработчик</option>
                <option value="viewer">Наблюдатель</option>
                <option value="team_lead">Тимлид</option>
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddMember(false)} className="px-4 py-2 bg-gray-600 rounded">Отмена</button>
                <button onClick={handleAddMember} className="px-4 py-2 bg-blue-600 rounded">Добавить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};