import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import prisma from '../../lib/prisma';

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  surname: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  settings: z.any().optional(), // в дальнейшем определить более точно, напр theme: z.enum(['light', 'dark']).optional(),
});

const profileRoutes: FastifyPluginAsyncZod = async (app) => {
  // Получение профиля
  app.get('/profile', { preValidation: app.authenticate }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true, username: true, email: true, role: true, isActive: true,
        avatarUrl: true, firstName: true, surname: true, location: true,
        bio: true, settings: true, createdAt: true,
      },
    });
    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }
    return user;
  });

  // Обновление профиля
  app.patch('/profile', {
    preValidation: app.authenticate,
    schema: { body: updateProfileSchema },
  }, async (req, reply) => {
    const userId = req.user!.sub;

    // Проверяем, существует ли пользователь
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return reply.status(404).send({ message: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: req.body,
      select: {
        id: true, username: true, email: true, role: true, isActive: true,
        avatarUrl: true, firstName: true, surname: true, location: true,
        bio: true, settings: true, createdAt: true,
      },
    });
    return updated;
  });

  
  app.get('/me', { preValidation: app.authenticate }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true, username: true, email: true, role: true, isActive: true,
        avatarUrl: true, firstName: true, surname: true, location: true,
        bio: true, settings: true, createdAt: true,
      },
    });
    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }
    return user;
  });
};

export default profileRoutes;