import api from './api';
import type { Board, Column, Task, Tag, Comment, TaskHistory } from '../types/kanban';

// Типы для создания/обновления задачи
export type CreateTaskData = {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assigneeId?: string;
  tags?: string[];
};

export type UpdateTaskData = Partial<CreateTaskData>;

export const kanbanService = {
  // Boards
  getBoards: (projectId: string) =>
    api.get<Board[]>(`/projects/${projectId}/boards`).then(res => res.data),
  createBoard: (projectId: string, name: string) =>
    api.post<Board>(`/projects/${projectId}/boards`, { name }).then(res => res.data),
  updateBoard: (boardId: string, data: Partial<Board>) =>
    api.patch<Board>(`/boards/${boardId}`, data).then(res => res.data),
  deleteBoard: (boardId: string) => api.delete(`/boards/${boardId}`),

  // Columns
  createColumn: (boardId: string, data: { name: string; color?: string; wipLimit?: number }) =>
    api.post<Column>(`/boards/${boardId}/columns`, data).then(res => res.data),
  updateColumn: (columnId: string, data: Partial<Column>) =>
    api.patch<Column>(`/columns/${columnId}`, data).then(res => res.data),
  deleteColumn: (columnId: string) => api.delete(`/columns/${columnId}`),
  reorderColumns: (boardId: string, columnIds: string[]) =>
    api.patch(`/columns/reorder?boardId=${boardId}`, { columnIds }),

  // Tasks – исправленные типы
  createTask: (boardId: string, columnId: string, data: CreateTaskData) =>
    api.post<Task>(`/boards/${boardId}/columns/${columnId}/tasks`, data).then(res => res.data),
  getTask: (taskId: string) =>
    api.get<Task>(`/tasks/${taskId}`).then(res => res.data),
  updateTask: (taskId: string, data: UpdateTaskData) =>
    api.patch<Task>(`/tasks/${taskId}`, data).then(res => res.data),
  deleteTask: (taskId: string) => api.delete(`/tasks/${taskId}`),
  moveTask: (taskId: string, targetColumnId: string, afterTaskId: string | null) =>
    api.patch(`/tasks/${taskId}/move`, { targetColumnId, afterTaskId }),

  // Subtasks
  createSubtask: (taskId: string, title: string) =>
    api.post<Task>(`/tasks/${taskId}/subtasks`, { title }).then(res => res.data),
  toggleSubtask: (taskId: string, subtaskId: string, completed: boolean) =>
    api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, { completed }),

  // Comments
  createComment: (taskId: string, content: string) =>
    api.post<Comment>(`/tasks/${taskId}/comments`, { content }).then(res => res.data),
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),

  // History
  getTaskHistory: (taskId: string) =>
    api.get<TaskHistory[]>(`/tasks/${taskId}/history`).then(res => res.data),

  // Tags
  getProjectTags: (projectId: string) =>
    api.get<Tag[]>(`/projects/${projectId}/tags`).then(res => res.data),
  createTag: (projectId: string, data: { name: string; color?: string }) =>
    api.post<Tag>(`/projects/${projectId}/tags`, data).then(res => res.data),
  addTagToTask: (taskId: string, tagId: string) =>
    api.post(`/tasks/${taskId}/tags`, { tagId }),
  removeTagFromTask: (taskId: string, tagId: string) =>
    api.delete(`/tasks/${taskId}/tags/${tagId}`),
};