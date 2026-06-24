import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { usePublicProjects, useDeleteProject, projectKeys } from '../../hooks/useProjects';
import { useTabsStore } from '../../store/tabsStore';
import { useAuthStore } from '../../store/authStore';
import { ProjectFormModal } from '../modal/ProjectFormModal';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { type Project } from '../../types/project';
import api from '../../services/api';

// Тип для ответа сервера при конфликте с вложенными проектами
type ConflictErrorResponse = {
  message?: string;
  children?: Array<{ id: string; name: string }>;
};



const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Произошла неизвестная ошибка';
};

// Закрыть все вкладки, связанные с проектом
const closeProjectTabs = (projectId: string) => {
  const { tabs, closeTab } = useTabsStore.getState();
  tabs.forEach((tab) => {
    if (tab.type === 'project-detail' && (tab.data as { projectId: string })?.projectId === projectId) {
      closeTab(tab.id);
    }
  });
};

export const ProjectsList = () => {
  const { data: projects, isLoading } = usePublicProjects();
  const deleteProject = useDeleteProject();
  const addTab = useTabsStore((s) => s.addTab);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const handleDelete = async (id: string, name: string) => {
    const performDelete = async () => {
      closeProjectTabs(id);
      await queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    };

    try {
      await deleteProject.mutateAsync(id);
      await performDelete();
    } catch (error: unknown) {
      if (
        isAxiosError<ConflictErrorResponse>(error) &&
        error.response?.status === 409 &&
        Array.isArray(error.response.data?.children)
      ) {
        const children = error.response.data.children;
        const userChoice = window.confirm(
          `Проект "${name}" содержит ${children.length} вложенных проектов.\n\n` +
          `Нажмите «ОК» – удалить всё (каскадно).\n` +
          `Нажмите «Отмена» – удалить только "${name}", вложенные проекты станут корневыми.`
        );
        const mode = userChoice ? 'cascade' : 'reparent';

        try {
          await api.delete(`/projects/${id}?mode=${mode}`);
          await performDelete();
        } catch (modeError) {
          alert(`Ошибка при удалении проекта: ${getErrorMessage(modeError)}`);
        }
      } else {
        alert(`Не удалось удалить проект: ${getErrorMessage(error)}`);
      }
    }
  };

  const canDelete = (project: Project) => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || project.ownerId === currentUser.id;
  };

  if (isLoading) return <div className="p-4 text-white min-h-[60vh]">Загрузка проектов...</div>;

  return (
    <div className="p-4 min-h-[65vh]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Список проектов</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded text-white hover:bg-white/30"
        >
          <PlusIcon className="h-4 w-4" /> Создать
        </button>
      </div>
      {projects?.length === 0 ? (
        <p className="text-white/70">Нет проектов</p>
      ) : (
        <ul className="space-y-2">
          {projects?.map((project) => (
            <li
              key={project.id}
              className="p-3 bg-white/20 rounded-lg backdrop-blur-sm text-white flex justify-between items-center"
            >
              <button
                onClick={() => addTab({
                  title: `Проект: ${project.name}`,
                  type: 'project-detail',
                  data: { projectId: project.id },
                })}
                className="text-left flex-1"
              >
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-white/70">{project.key}</div>
              </button>
              {canDelete(project) && (
                <button
                  onClick={() => handleDelete(project.id, project.name)}
                  className="text-red-300 hover:text-red-500 ml-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ProjectFormModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
};