import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { projectService } from '../services/project.service';
import { type Project, type CreateProjectData, type UpdateProjectData } from '../types/project';

export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  publicList: () => ['public-projects'] as const,
};

// Общая функция инвалидации всех списков проектов
const invalidateProjectQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
  queryClient.invalidateQueries({ queryKey: projectKeys.publicList() });
};

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const projects = await projectService.getProjects();
      return projects as Project[];
    },
  });
}

export function usePublicProjects() {
  return useQuery({
    queryKey: projectKeys.publicList(),
    queryFn: () => projectService.getPublicProjects(),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectData) => projectService.createProject(data),
    onSuccess: () => {
      invalidateProjectQueries(queryClient);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectData }) =>
      projectService.updateProject(id, data),
    onSuccess: (updatedProject) => {
      invalidateProjectQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(updatedProject.id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      invalidateProjectQueries(queryClient);
    },
  });
}