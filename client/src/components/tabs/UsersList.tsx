// components/tabs/UsersList.tsx
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useProjectMembers, useAddProjectMember, useRemoveProjectMember } from '../../hooks/useProjectMembers';
import api from '../../services/api';
import { type User } from '../../types';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';

// Получение всех пользователей (требует эндпоинт GET /users)
const useAllUsers = () => {
  return useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users');
      return data;
    },
  });
};

interface Props {
  projectId: string;
}

export const UsersList = ({ projectId }: Props) => {
  const { user: currentUser } = useAuthStore();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);

  // Определяем, может ли текущий пользователь управлять участниками (owner или team_lead)
  const currentMember = members?.find(m => m.userId === currentUser?.id);
  const canManage = currentMember?.projectRole === 'owner' || currentMember?.projectRole === 'team_lead';

  // Список ID участников
  const memberIds = members?.map(m => m.userId) || [];

  // Пользователи, которые ещё не в проекте
  const availableUsers = allUsers?.filter(u => !memberIds.includes(u.id)) || [];

  const handleAdd = async (userId: string) => {
    try {
      await addMember.mutateAsync({ userId, projectRole: 'developer' }); // роль по умолчанию
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Удалить участника из проекта?')) return;
    try {
      await removeMember.mutateAsync(userId);
    } catch (err) {
      console.error(err);
    }
  };

  if (!canManage) {
    return (
      <div className="p-4 text-white">
        <p className="text-white/70">У вас нет прав на управление участниками проекта.</p>
      </div>
    );
  }

  if (usersLoading || membersLoading) {
    return <div className="p-4 text-white">Загрузка...</div>;
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Левая колонка: Участники проекта */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Участники проекта</h4>
        {members?.length === 0 ? (
          <p className="text-white/70">Нет участников</p>
        ) : (
          <ul className="space-y-2">
            {members?.map((member) => (
              <li key={member.userId} className="flex justify-between items-center p-2 bg-white/10 rounded">
                <div>
                  <span className="text-white">{member.user.username}</span>
                  <span className="text-xs text-white/60 ml-2">({member.projectRole})</span>
                </div>
                {member.projectRole !== 'owner' && ( // владельца нельзя удалить
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <UserMinusIcon className="h-5 w-5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Правая колонка: Доступные пользователи */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-3">Добавить участников</h4>
        {availableUsers.length === 0 ? (
          <p className="text-white/70">Все пользователи уже в проекте</p>
        ) : (
          <ul className="space-y-2">
            {availableUsers.map((user) => (
              <li key={user.id} className="flex justify-between items-center p-2 bg-white/10 rounded">
                <div>
                  <span className="text-white">{user.username}</span>
                  <span className="text-xs text-white/60 ml-2">({user.role})</span>
                </div>
                <button
                  onClick={() => handleAdd(user.id)}
                  disabled={addMember.isPending}
                  className="text-green-400 hover:text-green-600 disabled:opacity-50"
                >
                  <UserPlusIcon className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};