import { useState, useMemo } from "react";
import { LiquidGlass } from "../ui/LiquidGlass";
import {
  FolderIcon,
  UserGroupIcon,
  UsersIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useTabsStore } from "../../store/tabsStore";
import { useProjects } from "../../hooks/useProjects";
import { type Project } from "../../types/project";

// Тип для узла дерева с детьми (исключаем исходное поле children из Project)
type ProjectNode = Omit<Project, "children"> & { children: ProjectNode[] };

// Строит дерево проектов на основе parentProjectId
function buildProjectTree(projects: Project[]): ProjectNode[] {
  const projectMap = new Map<string, ProjectNode>();
  const roots: ProjectNode[] = [];

  projects.forEach((p) => {
    // При создании узла перезаписываем children, исходное поле из Project игнорируется
    projectMap.set(p.id, { ...p, children: [] });
  });

  projects.forEach((p) => {
    const node = projectMap.get(p.id)!;
    if (p.parentProjectId && projectMap.has(p.parentProjectId)) {
      projectMap.get(p.parentProjectId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

const TreeItem = ({
  project,
  expandedNodes,
  toggleExpand,
}: {
  project: ProjectNode;
  expandedNodes: Record<string, boolean>;
  toggleExpand: (id: string) => void;
}) => {
  const addTab = useTabsStore((state) => state.addTab);
  const hasChildren = project.children.length > 0;
  const isExpanded = expandedNodes[project.id] || false;

  const handleOpenProjectDetail = () => {
    addTab({
      title: `Проект: ${project.name}`,
      type: "project-detail",
      data: { projectId: project.id },
    });
  };

  return (
    <li className="flex flex-col">
      <div className="flex items-center gap-2 py-1">
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(project.id)}
            className="focus:outline-none cursor-pointer hover:opacity-80"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <button
          onClick={handleOpenProjectDetail}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <FolderIcon className="h-5 w-5" />
          <span>{project.name}</span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <ul className="ml-6 mt-1 space-y-1 border-l border-blue-900/10 pl-2">
          {project.children.map((child) => (
            <TreeItem
              key={child.id}
              project={child}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const Sidebar = () => {
  const addTab = useTabsStore((state) => state.addTab);
  const { data: projects, isLoading } = useProjects();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    projectsRoot: true,
  });

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const projectTree = useMemo(() => {
    if (!projects) return [];
    return buildProjectTree(projects as Project[]);
  }, [projects]);

  const isProjectsExpanded = expandedNodes["projectsRoot"] || false;

  const handleOpenProjectsList = () => {
    addTab({
      title: "Список проектов",
      type: "projects-list",
    });
  };

  const handleOpenTeamsList = () => {
    addTab({
      title: "Мои команды",
      type: "teams-list",
    });
  };

  const handleOpenUsersList = () => {
    addTab({
      title: "Пользователи",
      type: "users-list",
    });
  };

  const handleCreateProject = () => {
    addTab({
      title: "Создать проект",
      type: "project-form",
      data: { mode: "create" },
    });
  };

  return (
    <LiquidGlass
      as="aside"
      className="sticky top-[6rem] mx-4 p-4 min-w-[220px] w-auto max-h-[calc(100vh-8rem)] overflow-y-auto self-start"
    >
      <ul className="space-y-3">
        {/* Мои проекты */}
        <li className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleExpand("projectsRoot")}
                className="focus:outline-none cursor-pointer hover:opacity-80"
              >
                {isProjectsExpanded ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={handleOpenProjectsList}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <FolderIcon className="h-5 w-5" />
                <span className="font-medium">Мои проекты</span>
              </button>
            </div>
            <button
              onClick={handleCreateProject}
              className="p-1 rounded-full hover:opacity-80 transition"
              title="Создать проект"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          {isProjectsExpanded && (
            <ul className="ml-6 mt-2 space-y-2 border-l border-blue-900/10 pl-2">
              {isLoading && (
                <li className="text-sm">Загрузка...</li>
              )}
              {!isLoading && projectTree.length === 0 && (
                <li className="text-sm">Нет проектов</li>
              )}
              {projectTree.map((project) => (
                <TreeItem
                  key={project.id}
                  project={project}
                  expandedNodes={expandedNodes}
                  toggleExpand={toggleExpand}
                />
              ))}
            </ul>
          )}
        </li>

        {/* Мои команды */}
        <li>
          <button
            onClick={handleOpenTeamsList}
            className="flex items-center gap-2 w-full hover:opacity-80 transition"
          >
            <UserGroupIcon className="h-5 w-5" />
            <span>Мои команды</span>
          </button>
        </li>

        {/* Пользователи */}
        <li>
          <button
            onClick={handleOpenUsersList}
            className="flex items-center gap-2 w-full hover:opacity-80 transition"
          >
            <UsersIcon className="h-5 w-5" />
            <span>Пользователи</span>
          </button>
        </li>
      </ul>
    </LiquidGlass>
  );
};
