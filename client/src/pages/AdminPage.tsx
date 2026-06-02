import { useAdminUsers, useUpdateUserRole } from '../hooks/useAdminUsers';
import { useAuthStore } from '../store/authStore';
import { LiquidGlass } from '../components/ui/LiquidGlass';

export default function AdminPage() {
  const { user: currentUser } = useAuthStore();
  const { data: users, isLoading, error } = useAdminUsers();
  const updateRole = useUpdateUserRole();

  const handlePromote = async (userId: string) => {
    try {
      await updateRole.mutateAsync({ userId, role: 'verified_user' });
    } catch (err) {
      // Ошибка уже обработана в мутации, можно добавить уведомление
      console.error(err);
    }
  };

  // Проверка прав доступа
  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LiquidGlass className="p-6 text-white">
          <h1 className="text-2xl font-bold">Доступ запрещён</h1>
          <p>Только администраторы могут просматривать эту страницу.</p>
        </LiquidGlass>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 -z-10 animate-gradient"
        style={{
          background:
            'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24)',
          backgroundSize: '400% 400%',
        }}
      />
      <div className="container mx-auto px-4 py-8">
        <LiquidGlass className="p-6">
          <h1 className="text-2xl font-bold text-white mb-4">
            Управление пользователями
          </h1>

          {isLoading && <p className="text-white">Загрузка...</p>}
          {error && (
            <p className="text-red-400 mb-4">
              {error instanceof Error ? error.message : 'Ошибка загрузки'}
            </p>
          )}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-2">Имя</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Роль</th>
                    <th className="text-left p-2">Дата регистрации</th>
                    <th className="text-left p-2">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id} className="border-b border-white/10">
                      <td className="p-2">{u.username}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.role}</td>
                      <td className="p-2">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="p-2">
                        {u.role === 'new_user' && (
                          <button
                            onClick={() => handlePromote(u.id)}
                            disabled={updateRole.isPending}
                            className="bg-green-600 px-3 py-1 rounded text-white hover:bg-green-700 transition disabled:opacity-50"
                          >
                            {updateRole.isPending ? '...' : 'Активировать'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LiquidGlass>
      </div>
    </div>
  );
}