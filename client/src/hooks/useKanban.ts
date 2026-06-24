import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kanbanService, type CreateTaskData, type UpdateTaskData } from '../services/kanban.service';
import type { Board, Column } from '../types/kanban';

export const kanbanKeys = {
  boards: (projectId: string) => ['boards', projectId] as const,
  board: (boardId: string) => ['board', boardId] as const,
  task: (taskId: string) => ['task', taskId] as const,
  projectTags: (projectId: string) => ['tags', projectId] as const,
};

export function useBoards(projectId: string) {
  return useQuery({
    queryKey: kanbanKeys.boards(projectId),
    queryFn: () => kanbanService.getBoards(projectId),
    enabled: !!projectId,
  });
}

export function useCreateBoard(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => kanbanService.createBoard(projectId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards(projectId) });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, data }: { boardId: string; data: Partial<Board> }) =>
      kanbanService.updateBoard(boardId, data),
    onSuccess: (__, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useDeleteBoard(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => kanbanService.deleteBoard(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.boards(projectId) });
    },
  });
}

export function useCreateColumn(boardId: string, projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string; wipLimit?: number }) =>
      kanbanService.createColumn(boardId, data),
    onSuccess: () => {
      // инвалидируем конкретную доску
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      // инвалидируем список досок проекта
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: string; data: Partial<Column> }) =>
      kanbanService.updateColumn(columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) => kanbanService.deleteColumn(columnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useReorderColumns(projectId: string, boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (columnIds: string[]) => kanbanService.reorderColumns(boardId, columnIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
    },
  });
}

export function useCreateTask(boardId: string, columnId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskData) => kanbanService.createTask(boardId, columnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: kanbanKeys.task(taskId),
    queryFn: () => kanbanService.getTask(taskId),
    enabled: !!taskId,
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskData }) =>
      kanbanService.updateTask(taskId, data),
    onSuccess: (__, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) });
    },
  });
}

export function useDeleteTask(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => kanbanService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useMoveTask(projectId: string, boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, targetColumnId, afterTaskId }: { taskId: string; targetColumnId: string; afterTaskId: string | null }) =>
      kanbanService.moveTask(taskId, targetColumnId, afterTaskId),
    onSuccess: () => {
      // Инвалидируем конкретную доску
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
      // Инвалидируем список досок проекта – это перезапросит useBoards
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
    },
  });
}

export function useCreateSubtask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => kanbanService.createSubtask(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) });
    },
  });
}

export function useToggleSubtask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ subtaskId, completed }: { subtaskId: string; completed: boolean }) =>
      kanbanService.toggleSubtask(taskId, subtaskId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) });
    },
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => kanbanService.createComment(taskId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => kanbanService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) });
    },
  });
}

export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: [...kanbanKeys.task(taskId), 'history'],
    queryFn: () => kanbanService.getTaskHistory(taskId),
    enabled: !!taskId,
  });
}

export function useProjectTags(projectId: string) {
  return useQuery({
    queryKey: kanbanKeys.projectTags(projectId),
    queryFn: () => kanbanService.getProjectTags(projectId),
    enabled: !!projectId,
  });
}

export function useCreateTag(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => kanbanService.createTag(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.projectTags(projectId) });
    },
  });
}

export function useAddTagToTask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => kanbanService.addTagToTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) });
    },
  });
}

export function useRemoveTagFromTask(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => kanbanService.removeTagFromTask(taskId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.task(taskId) });
    },
  });
}