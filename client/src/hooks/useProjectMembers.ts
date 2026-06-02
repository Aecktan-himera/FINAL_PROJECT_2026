import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api'; // ваш axios инстанс с интерцепторами
import { type ProjectMember } from '../types/project';

export const useProjectMembers = (projectId: string) => {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const { data } = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
      return data;
    },
    enabled: !!projectId,
  });
};

export const useAddProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, projectRole }: { userId: string; projectRole: string }) => {
      const { data } = await api.post(`/projects/${projectId}/members`, { userId, projectRole });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });
};

export const useRemoveProjectMember = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/projects/${projectId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });
};