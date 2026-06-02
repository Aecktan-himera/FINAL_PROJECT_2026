import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  key: z.string().min(1).max(10),
  description: z.string().optional(),
  parentProjectId: z.uuid().optional().nullable(),
  isPublic: z.boolean().optional().default(false),
  responsibleId: z.uuid().optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  key: z.string(),
  description: z.string().nullable(),
  parentProjectId: z.uuid().nullable(),
  isPublic: z.boolean(),
  ownerId: z.uuid(),
  responsibleId: z.uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const addMemberSchema = z.object({
    userId: z.uuid(),
    projectRole: z.enum(['team_lead', 'developer', 'viewer']), // owner назначать нельзя через этот эндпоинт
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
export type AddMemberSchema = z.infer<typeof addMemberSchema>;