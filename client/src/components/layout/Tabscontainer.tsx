import { useTabsStore } from "../../store/tabsStore";
import { LiquidGlass } from "../../components/ui/LiquidGlass";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useProject } from "../../hooks/useProjects";
import { ProjectFormModal } from "../modal/ProjectFormModal";
import { useState } from "react";
import { ProjectsList } from "../tabs/ProjectsList";
import { ProjectDetail } from "../tabs/ProjectDetail";
//import { UsersList } from "../tabs/UsersList";

// Компонент списка проектов
/*const ProjectsList = () => {
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const addTab = useTabsStore((s) => s.addTab);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleDelete = async (id: string) => {
    if (window.confirm("Удалить проект? Все данные будут потеряны.")) {
      await deleteProject.mutateAsync(id);
    }
  };

  const handleOpenProject = (projectId: string, name: string) => {
    addTab({
      title: `Проект: ${name}`,
      type: "project-detail",
      data: { projectId },
    });
  };

  if (isLoading)
    return <div className="p-4 text-white">Загрузка проектов...</div>;

  return (
    <div className="p-4">
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
};*/

// Компонент деталей проекта
/*const ProjectDetail = ({ projectId }: { projectId: string }) => {
  const { data: project, isLoading } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const [isEditing, setIsEditing] = useState(false);
  const addTab = useTabsStore((s) => s.addTab);
  // удаляем неиспользуемую переменную updateProject

  const handleEdit = () => setIsEditing(true);
  const handleDelete = async () => {
    if (window.confirm("Удалить проект?")) {
      await deleteProject.mutateAsync(projectId);
      const closeTab = useTabsStore.getState().closeTab;
      const activeId = useTabsStore.getState().activeTabId;
      if (activeId) closeTab(activeId);
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

   if (isLoading) return <div className="p-4 text-white">Загрузка...</div>;
  if (!project) return <div className="p-4 text-white">Проект не найден</div>;

  return (
    <div className="p-4 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold">{project.name}</h3>
          <p className="text-white/70">Ключ: {project.key}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleEdit} className="bg-white/20 px-3 py-1 rounded hover:bg-white/30">Редактировать</button>
          <button onClick={handleDelete} className="bg-red-500/50 px-3 py-1 rounded hover:bg-red-600/70">Удалить</button>
        </div>
      </div>
      <div className="space-y-2">
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

      <ProjectFormModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        initialData={project}
        isEditing
      />
    </div>
  );
};*/

// Заглушки для остальных типов
/*const UsersList = () => (
  <div className="p-4 text-white">
    <h3 className="text-xl font-semibold mb-4">Список пользователей</h3>
    <p className="text-white/70">Здесь будет список пользователей (API в разработке)</p>
  </div>
);*/

const TeamsList = () => (
  <div className="p-4 text-white min-h-[60vh]">
    <h3 className="text-xl font-semibold mb-4">Мои команды</h3>
    <p className="text-white/70">Здесь будут команды (API в разработке)</p>
  </div>
);

const CalendarPlaceholder = () => (
  <div className="p-4 text-white min-h-[60vh]">
    <h3 className="text-xl font-semibold mb-4">Календарь</h3>
    <p className="text-white/70">Интеграция календаря (в разработке)</p>
  </div>
);

const ZoomPlaceholder = () => (
  <div className="p-4 text-white min-h-[60vh]">
    <h3 className="text-xl font-semibold mb-4">Совещания в Zoom</h3>
    <p className="text-white/70">Запланированные совещания (в разработке)</p>
  </div>
);

// ... остальные компоненты (UsersList, TeamsList, CalendarPlaceholder, ContactsPlaceholder)

const ProjectFormTab = ({
  mode,
  projectId,
}: {
  mode: "create" | "edit";
  projectId?: string;
}) => {
  const { data: project } = useProject(projectId || "");
  const [showModal, setShowModal] = useState(true);
  const closeTab = useTabsStore((s) => s.closeTab);
  const activeId = useTabsStore((s) => s.activeTabId);

  if (!showModal) {
    if (activeId) closeTab(activeId);
    return null;
  }

  return (
    <ProjectFormModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      initialData={mode === "edit" && project ? project : undefined}
      isEditing={mode === "edit"}
    />
  );
};

export const TabsContainer = () => {
  const { tabs, activeTabId, closeTab, setActiveTab } = useTabsStore();

  const renderContent = () => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) {
      return (
        <div className="p-8 text-center text-white/70 text-lg min-h-[65vh]">
          🚀 Выберите пункт меню, чтобы открыть вкладку
        </div>
      );
    }

    switch (activeTab.type) {
      case "projects-list":
        return <ProjectsList />;
      case "project-detail":
        return (
          <ProjectDetail
            projectId={(activeTab.data as { projectId: string }).projectId}
          />
        );
      case "project-form":
        { const data = activeTab.data as {
          mode: "create" | "edit";
          projectId?: string;
        };
        return <ProjectFormTab mode={data.mode} projectId={data.projectId} />; }
      // Удаляем case "users-list"
      case "teams-list":
        return <TeamsList />;
      case "calendar":
        return <CalendarPlaceholder />;
      case "contacts":
        return <ZoomPlaceholder />;
      default:
        return <div className="text-white">Неизвестный тип вкладки</div>;
    }
  };

  return (
    <LiquidGlass className="flex flex-col p-0 overflow-hidden shadow-2xl">
      {tabs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-white/30 px-3 pt-3 bg-black/20 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium transition-all duration-200 ${
                activeTabId === tab.id
                  ? "bg-white/40 text-white shadow-lg shadow-black/20 backdrop-blur-md border-b-2 border-white/60"
                  : "bg-white/15 text-white/80 hover:bg-white/30 hover:text-white hover:shadow-md"
              }`}
            >
              <span className="text-sm">{tab.title}</span>
              <XMarkIcon
                className="h-4 w-4 opacity-80 hover:opacity-100 hover:scale-110 transition"
                onClick={(e: React.MouseEvent) => {
                  // добавляем тип события
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              />
            </button>
          ))}
        </div>
      )}
      <div className="p-5 bg-black/10 backdrop-blur-sm">{renderContent()}</div>
    </LiquidGlass>
  );
};
