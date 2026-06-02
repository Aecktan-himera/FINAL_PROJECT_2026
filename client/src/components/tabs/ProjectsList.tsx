import { useState } from 'react';
import { useProjects, useDeleteProject } from '../../hooks/useProjects';
import { useTabsStore } from '../../store/tabsStore';
import { ProjectFormModal } from '../modal/ProjectFormModal';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

export const ProjectsList = () => {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const addTab = useTabsStore((s) => s.addTab);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить проект? Все данные будут потеряны.')) {
      await deleteProject.mutateAsync(id);
    }
  };

  const handleOpenProject = (projectId: string, name: string) => {
    addTab({
      title: `Проект: ${name}`,
      type: 'project-detail',
      data: { projectId },
    });
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
                onClick={() => handleOpenProject(project.id, project.name)}
                className="text-left flex-1"
              >
                <div className="font-medium">{project.name}</div>
                <div className="text-sm text-white/70">{project.key}</div>
              </button>
              <button
                onClick={() => handleDelete(project.id)}
                className="text-red-300 hover:text-red-500 ml-2"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <ProjectFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};