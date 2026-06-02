import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import prisma from '../../lib/prisma';

const adminUsersRoutes: FastifyPluginAsyncZod = async (app) => {
  // Все маршруты требуют аутентификации и роли admin
  app.addHook('preValidation', app.authenticate);
  app.addHook('preValidation', app.authorize(['admin']));

  // GET /admin/users – список всех пользователей
  app.get('/', async (req, reply) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        firstName: true,
        surname: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  });

  // PATCH /admin/users/:id/role – смена роли (только new_user -> verified_user)
  app.patch('/:id/role', {
    schema: {
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ role: z.enum(['new_user', 'verified_user', 'team_lead', 'admin']) }),
    },
  }, async (req, reply) => {
    const { id } = req.params;
    const { role } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.status(404).send({ message: 'User not found' });

    // Разрешаем апгрейд только с new_user на verified_user (админ может повысить и дальше)
    if (user.role === 'new_user' && role !== 'verified_user') {
      return reply.status(400).send({ message: 'New user can only be promoted to verified_user' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, role: true, username: true, email: true },
    });
    return updated;
  });
};

export default adminUsersRoutes;