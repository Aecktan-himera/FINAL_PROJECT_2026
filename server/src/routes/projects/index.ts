import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { createProjectSchema, updateProjectSchema } from '../../schemas/project.schema';
import prisma from '../../lib/prisma';

const projectsRoutes: FastifyPluginAsyncZod = async (app) => {
  // Применяем глобальную аутентификацию для всех маршрутов проектов
  app.addHook('preValidation', app.authenticate);

  // POST /projects – создание проекта
  app.post('/', { schema: { body: createProjectSchema } }, async (req, reply) => {
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    // Права: только team_lead или admin могут создавать проекты
    //if (userRole !== 'team_lead' && userRole !== 'admin') {
    //  return reply.status(403).send({ message: 'Only team leads and admins can create projects' });
   // }

    const { name, key, description, parentProjectId, isPublic, responsibleId } = req.body;

    // Проверим, что родительский проект существует и пользователь имеет к нему доступ (опционально)
    if (parentProjectId) {
      const parent = await prisma.project.findUnique({ where: { id: parentProjectId } });
      if (!parent) {
        return reply.status(404).send({ message: 'Parent project not found' });
      }
      // Можно дополнительно проверить, что текущий пользователь является участником родительского проекта
    }

    const project = await prisma.project.create({
      data: {
        name,
        key,
        description,
        parentProjectId: parentProjectId || null,
        isPublic: isPublic ?? false,
        ownerId: userId,
        responsibleId: responsibleId || null,
      },
    });

    // Добавляем создателя в project_members с ролью owner
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        projectRole: 'owner',
      },
    });

    reply.status(201).send(project);
  });

  // GET /projects – список проектов, в которых участвует пользователь
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

    const projects = memberships.map(m => m.project);
    reply.send(projects);
  });

  // GET /projects/:id – детали одного проекта
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user!.sub;

    // Проверка, что пользователь является участником
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

    // Получаем проект с владельцем
    const project = await prisma.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });
    if (!project) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    // Права: владелец или admin
    //if (project.ownerId !== userId && userRole !== 'admin') {
      //return reply.status(403).send({ message: 'Only owner or admin can update the project' });
   // }

    const updateData = req.body;
    // Нельзя менять ownerId через этот эндпоинт (это отдельный функционал)
    delete (updateData as any).ownerId;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    reply.send(updated);
  });

  // DELETE /projects/:id – удаление проекта (каскадное)
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
};

export default projectsRoutes;