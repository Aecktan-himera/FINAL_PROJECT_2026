export interface ProjectMember {
   projectId: string;
  userId: string;
  projectRole: 'owner' | 'team_lead' | 'developer' | 'viewer';
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    firstName: string | null;
    surname: string | null;
  };
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string | null;
  parentProjectId: string | null;
  isPublic: boolean;
  ownerId: string;
  responsibleId: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; username: string };
  responsible?: { id: string; username: string };
  parentProject?: { id: string; name: string; key: string };
  children?: Pick<Project, 'id' | 'name' | 'key'>[];
  members?: ProjectMember[];
}

export type CreateProjectData = {
  name: string;
  key: string;
  description?: string;
  parentProjectId?: string | null;
  isPublic?: boolean;
  responsibleId?: string | null;
};

export type UpdateProjectData = Partial<CreateProjectData>;