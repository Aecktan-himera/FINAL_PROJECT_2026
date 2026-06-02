import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { createProjectSchema, updateProjectSchema, addMemberSchema } from '../../schemas/project.schema';
import prisma from '../../lib/prisma';

const projectsRoutes: FastifyPluginAsyncZod = async (app) => {
  // 1. Аутентификация
  app.addHook('preValidation', app.authenticate);

  // 2. Запрет для new_user 
  app.addHook('preValidation', async (request, reply) => {
    if (request.user!.role === 'new_user') {
      return reply.status(403).send({ 
        message: 'Access denied. Your account is pending activation.' 
      });
    }
  });

  // POST /projects – создание проекта (доступно только team_lead и admin)
  app.post('/', { schema: { body: createProjectSchema } }, async (req, reply) => {
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    // Доступ: только team_lead или admin
    if (userRole !== 'team_lead' && userRole !== 'admin') {
      return reply.status(403).send({ message: 'Only team leads and admins can create projects' });
    }

    const { name, key, description, parentProjectId, isPublic, responsibleId } = req.body;

    if (parentProjectId) {
      const parent = await prisma.project.findUnique({ where: { id: parentProjectId } });
      if (!parent) {
        return reply.status(404).send({ message: 'Parent project not found' });
      }
    }

    const project = await prisma.project.create({
      data: {
        name, key, description,
        parentProjectId: parentProjectId || null,
        isPublic: isPublic ?? false,
        ownerId: userId,
        responsibleId: responsibleId || null,
      },
    });

    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        projectRole: 'owner',
      },
    });

    reply.status(201).send(project);
  });

  // GET /projects – список проектов пользователя
  app.get('/', async (req, reply) => {
    const userId = req.user!.sub;
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, username: true } },
            responsible: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
    reply.send(memberships.map(m => m.project));
  });

  // GET /projects/:id – детали проекта
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user!.sub;

    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
    });
    if (!member) {
      return reply.status(403).send({ message: 'Access denied' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, username: true } },
        responsible: { select: { id: true, username: true } },
        parentProject: { select: { id: true, name: true, key: true } },
        children: { select: { id: true, name: true, key: true } },
        members: {
          include: { user: { select: { id: true, username: true, email: true, avatarUrl: true } } },
        },
      },
    });

    if (!project) {
      return reply.status(404).send({ message: 'Project not found' });
    }
    reply.send(project);
  });

  // PATCH /projects/:id – обновление проекта
  app.patch('/:id', { schema: { body: updateProjectSchema } }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!project) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    // Доступ: только владелец или admin
    if (project.ownerId !== userId && userRole !== 'admin') {
      return reply.status(403).send({ message: 'Only owner or admin can update the project' });
    }

    const updateData = req.body;
    delete (updateData as any).ownerId;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });
    reply.send(updated);
  });

  // DELETE /projects/:id – удаление проекта
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!project) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    if (project.ownerId !== userId && userRole !== 'admin') {
      return reply.status(403).send({ message: 'Only owner or admin can delete the project' });
    }

    await prisma.project.delete({ where: { id } });
    reply.status(204).send();
  });

  // Вспомогательная проверка: имеет ли пользователь роль owner или team_lead в проекте
  async function checkProjectMembershipRole(projectId: string, userId: string): Promise<{ allowed: boolean; currentRole?: string }> {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) return { allowed: false };
    const allowedRoles = ['owner', 'team_lead'];
    return { allowed: allowedRoles.includes(member.projectRole), currentRole: member.projectRole };
  }

  // GET /projects/:projectId/members – список участников проекта
  app.get('/:projectId/members', async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const userId = req.user!.sub;

    // Проверяем, что пользователь сам является участником проекта
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) {
      return reply.status(403).send({ message: 'You are not a member of this project' });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            firstName: true,
            surname: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
    reply.send(members);
  });

  // POST /projects/:projectId/members – добавить участника
  

  app.post('/:projectId/members', {
    schema: { body: addMemberSchema },
  }, async (req, reply) => {
    const { projectId } = req.params as { projectId: string };
    const currentUserId = req.user!.sub;
    const { userId, projectRole } = req.body;

    // 1. Проверка прав: текущий пользователь должен быть owner или team_lead в проекте
    const { allowed } = await checkProjectMembershipRole(projectId, currentUserId);
    if (!allowed) {
      return reply.status(403).send({ message: 'Only project owner or team lead can add members' });
    }

    // 2. Проверка существования проекта
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    // 3. Проверка существования пользователя
    const userToAdd = await prisma.user.findUnique({ where: { id: userId } });
    if (!userToAdd) {
      return reply.status(404).send({ message: 'User not found' });
    }

    // 4. Проверка, не является ли пользователь уже участником
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existing) {
      return reply.status(409).send({ message: 'User is already a member of this project' });
    }

    // 5. Добавление участника
    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        projectRole,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatarUrl: true },
        },
      },
    });
    reply.status(201).send(newMember);
  });

  // DELETE /projects/:projectId/members/:userId – удалить участника
  app.delete('/:projectId/members/:userId', async (req, reply) => {
    const { projectId, userId } = req.params as { projectId: string; userId: string };
    const currentUserId = req.user!.sub;

    // 1. Проверка прав текущего пользователя
    const { allowed, currentRole } = await checkProjectMembershipRole(projectId, currentUserId);
    if (!allowed) {
      return reply.status(403).send({ message: 'Only project owner or team lead can remove members' });
    }

    // 2. Нельзя удалять самого себя
    if (currentUserId === userId) {
      return reply.status(400).send({ message: 'You cannot remove yourself from the project' });
    }

    // 3. Получаем информацию об удаляемом участнике
    const memberToRemove = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!memberToRemove) {
      return reply.status(404).send({ message: 'User is not a member of this project' });
    }

    // 4. Дополнительные ограничения:
    //    - Если текущий пользователь team_lead, он не может удалить owner'а
    if (currentRole === 'team_lead' && memberToRemove.projectRole === 'owner') {
      return reply.status(403).send({ message: 'Team lead cannot remove the project owner' });
    }
    //    - Также нельзя удалить единственного owner'а (если owner всего один)
    if (memberToRemove.projectRole === 'owner') {
      const ownersCount = await prisma.projectMember.count({
        where: { projectId, projectRole: 'owner' },
      });
      if (ownersCount <= 1) {
        return reply.status(400).send({ message: 'Cannot remove the only project owner' });
      }
    }

    // 5. Удаление
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    reply.status(204).send();
  });
};

export default projectsRoutes;