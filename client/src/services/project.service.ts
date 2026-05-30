import api from './api';
import { type Project, type CreateProjectData, type UpdateProjectData } from '../types/project';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data } = await api.get<Project[]>('/projects');
    return data as Project[];
  },

  async getProject(id: string): Promise<Project> {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    const { data: project } = await api.post<Project>('/projects', data);
    return project;
  },

  async updateProject(id: string, data: UpdateProjectData): Promise<Project> {
    const { data: project } = await api.patch<Project>(`/projects/${id}`, data);
    return project;
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};