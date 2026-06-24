import { useState, useRef } from "react";
//import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  useProject,
  useDeleteProject,
  projectKeys,
} from "../../hooks/useProjects";
import {
  useProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
} from "../../hooks/useProjectMembers";
import { useTabsStore } from "../../store/tabsStore";
import { useAuthStore } from "../../store/authStore";
import { ProjectFormModal } from "../modal/ProjectFormModal";
import { XMarkIcon, UserPlusIcon } from "@heroicons/react/24/outline";
import api from "../../services/api";

// Тип для ответа сервера при конфликте с вложенными проектами
type ConflictErrorResponse = {
  message?: string;
  children?: Array<{ id: string; name: string }>;
};

// Безопасное получение сообщения об ошибке
const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Произошла неизвестная ошибка";
};

// Закрыть все вкладки, связанные с проектом
const closeProjectTabs = (projectId: string) => {
  const { tabs, closeTab } = useTabsStore.getState();
  tabs.forEach((tab) => {
    if (
      tab.type === "project-detail" &&
      (tab.data as { projectId: string })?.projectId === projectId
    ) {
      closeTab(tab.id);
    }
  });
};

// Инвалидация всех списков проектов
const invalidateProjectLists = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: projectKeys.publicList() }),
  ]);
};

export const ProjectDetail = ({ projectId }: { projectId: string }) => {
//const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: project, isLoading } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const { data: members, isLoading: membersLoading } =
    useProjectMembers(projectId);
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const addTab = useTabsStore((s) => s.addTab);
  const { user: currentUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  //const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<
    "team_lead" | "developer" | "viewer"
  >("developer");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      username: string;
      email: string;
      firstName: string;
      surname: string;
    }>
  >([]);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    username: string;
    email: string;
    firstName: string;
    surname: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMember = members?.find((m) => m.userId === currentUser?.id);
  const canManageProject =
    currentMember?.projectRole === "owner" ||
    currentMember?.projectRole === "team_lead";

  // Функция поиска пользователей
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get("/users/search", {
        params: { q: query },
      });
      // Предполагаем, что бэкенд возвращает массив пользователей
      setSearchResults(response.data);
    } catch (error) {
      console.error("Ошибка поиска пользователей:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Обработчик изменения поискового запроса с debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setSelectedUser(null); // сбрасываем выбранного пользователя при новом поиске

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  // Выбор пользователя из результатов
  const handleSelectUser = (user: (typeof searchResults)[0]) => {
    setSelectedUser(user);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Сброс выбора и очистка поиска
  const handleClearSelection = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleDelete = async () => {
    if (!project) return;

    // Функция, выполняемая после успешного удаления (любым способом)
    const afterDelete = async () => {
      closeProjectTabs(projectId);
      await invalidateProjectLists(queryClient);
    };

    try {
      // Пытаемся удалить стандартным способом (без mode)
      await deleteProject.mutateAsync(projectId);
      await afterDelete();
    } catch (error: unknown) {
      // Проверяем, является ли ошибка конфликтом 409 с информацией о children
      if (
        isAxiosError<ConflictErrorResponse>(error) &&
        error.response?.status === 409 &&
        Array.isArray(error.response.data?.children)
      ) {
        const children = error.response.data.children;
        const userChoice = window.confirm(
          `Проект "${project.name}" содержит ${children.length} вложенных проектов.\n\n` +
            `Нажмите «ОК» – удалить всё (каскадно).\n` +
            `Нажмите «Отмена» – удалить только "${project.name}", вложенные проекты станут корневыми.`,
        );
        const mode = userChoice ? "cascade" : "reparent";

        try {
          // Выполняем удаление с выбранным режимом напрямую через API
          await api.delete(`/projects/${projectId}?mode=${mode}`);
          await afterDelete();
        } catch (secondError) {
          alert(`Ошибка при удалении проекта: ${getErrorMessage(secondError)}`);
        }
      } else {
        alert(`Не удалось удалить проект: ${getErrorMessage(error)}`);
      }
    }
  };

  const handleOpenParent = () => {
    if (project?.parentProjectId) {
      addTab({
        title: `Проект: ${project.parentProject?.name || "Родитель"}`,
        type: "project-detail",
        data: { projectId: project.parentProjectId },
      });
    }
  };

  // Модифицируем handleAddMember для использования выбранного пользователя
  const handleAddMember = async () => {
    if (!selectedUser) {
      alert("Пожалуйста, выберите пользователя из списка");
      return;
    }

    try {
      await addMember.mutateAsync({
        userId: selectedUser.id,
        projectRole: newMemberRole,
      });
      // Очищаем форму
      setSelectedUser(null);
      setSearchQuery("");
      setNewMemberRole("developer");
      setShowAddMember(false);
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (window.confirm(`Удалить участника ${userName} из проекта?`)) {
      try {
        await removeMember.mutateAsync(userId);
      } catch (error) {
        alert(getErrorMessage(error));
      }
    }
  };

const handleOpenBoardTab = () => {
  if (!project) return;
  addTab({
    title: `Канбан: ${project.name}`,
    type: 'kanban-board',
    data: { projectId: project.id },
  });
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
          {canManageProject && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white/20 px-3 py-1 rounded hover:bg-white/30"
              >
                Редактировать
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500/50 px-3 py-1 rounded hover:bg-red-600/70"
              >
                Удалить
              </button>
              <button
                onClick={() => {}}
                className="bg-white/20 px-3 py-1 rounded hover:bg-white/30"
              >
                Назначить ответственного
              </button>
              <button
                onClick={() => {}}
                className="bg-white/20 px-3 py-1 rounded hover:bg-white/30"
              >
                Передать проект
              </button>
            </>
          )}
          <button onClick={handleOpenBoardTab}
            className="bg-white/20 px-3 py-1 rounded hover:bg-white/30"
          >
            Доски проекта
          </button>
          <button
            onClick={() => {}}
            className="bg-white/20 px-3 py-1 rounded hover:bg-white/30"
          >
            Список задач
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <p>
          <strong>Описание:</strong> {project.description || "—"}
        </p>
        <p>
          <strong>Владелец:</strong>{" "}
          {project.owner?.username || project.ownerId}
        </p>
        <p>
          <strong>Ответственный:</strong>{" "}
          {project.responsible?.username || "Не назначен"}
        </p>
        <p>
          <strong>Родительский проект:</strong>{" "}
          {project.parentProject ? (
            <button
              onClick={handleOpenParent}
              className="text-blue-300 hover:underline"
            >
              {project.parentProject.name}
            </button>
          ) : (
            "—"
          )}
        </p>
        <p>
          <strong>Дата создания:</strong>{" "}
          {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xl font-semibold">Участники</h4>
          {canManageProject && (
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
                  <th className="text-left p-2">Дата присоединения</th>
                  {canManageProject && (
                    <th className="text-left p-2">Действие</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members?.map((member) => (
                  <tr key={member.userId} className="border-b border-white/10">
                    <td className="p-2">
                      {member.user.firstName} {member.user.surname} (
                      {member.user.username})
                    </td>
                    <td className="p-2">{member.projectRole}</td>
                    <td className="p-2">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    {canManageProject && member.projectRole !== "owner" && (
                      <td className="p-2">
                        <button
                          onClick={() =>
                            handleRemoveMember(
                              member.userId,
                              member.user.username,
                            )
                          }
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

      <ProjectFormModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        initialData={project}
        isEditing
      />

      {showAddMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-96">
            <h3 className="text-xl font-bold mb-4">Добавить участника</h3>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по имени, фамилии, email или username..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full p-2 rounded bg-gray-800 text-white"
                />
                {searchQuery.trim() !== "" && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-auto max-h-48">
                    {isSearching ? (
                      <div className="p-2 text-white/50 text-center">
                        Поиск...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <ul>
                        {searchResults.map((user) => (
                          <li
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="p-2 hover:bg-gray-700 cursor-pointer text-white border-b border-gray-700 last:border-0"
                          >
                            <div className="font-medium">
                              {user.firstName} {user.surname} ({user.username})
                            </div>
                            <div className="text-sm text-white/60">
                              {user.email}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-2 text-white/70 text-center">
                        Ничего не найдено
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Выбранный пользователь */}
              {selectedUser && (
                <div className="flex justify-between items-center bg-gray-800 p-2 rounded">
                  <span className="text-white">
                    {selectedUser.firstName} {selectedUser.surname} (
                    {selectedUser.username})
                  </span>
                  <button
                    onClick={handleClearSelection}
                    className="text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Выбор роли */}
              <select
                value={newMemberRole}
                onChange={(e) =>
                  setNewMemberRole(
                    e.target.value as "team_lead" | "developer" | "viewer",
                  )
                }
                className="w-full p-2 rounded bg-gray-800 text-white"
              >
                <option value="developer">Разработчик</option>
                <option value="viewer">Наблюдатель</option>
                <option value="team_lead">Тимлид</option>
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddMember(false);
                    handleClearSelection();
                  }}
                  className="px-4 py-2 bg-gray-600 rounded"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUser}
                  className={`px-4 py-2 rounded ${
                    selectedUser
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-400 cursor-not-allowed"
                  }`}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
