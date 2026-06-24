export interface Board {
  id: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: string;
  columns: Column[];
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  position: number;
  color: string;
  wipLimit: number;
  createdAt: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  boardId: string;
  columnId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  authorId: string;
  assigneeId: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  position: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; username: string; avatarUrl: string | null };
  author?: { id: string; username: string; avatarUrl: string | null };
  subtasks?: Task[];
  comments?: Comment[];
  taskTags?: { tag: Tag }[];
  history?: TaskHistory[];
  _count?: { comments: number; subtasks: number };
}

export interface Tag {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; username: string; avatarUrl: string | null };
}

export interface TaskHistory {
  id: string;
  taskId: string;
  changedBy: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changer: { id: string; username: string };
}