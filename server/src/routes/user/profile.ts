import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import bcrypt from "bcrypt";

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  surname: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  settings: z.any().optional(), // в дальнейшем определить более точно, напр theme: z.enum(['light', 'dark']).optional(),
  specialization: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

// Схема для смены пароля
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});


const profileRoutes: FastifyPluginAsyncZod = async (app) => {
  // Получение профиля GET /user/profile 
  app.get('/profile', { preValidation: app.authenticate }, async (req, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: {
        id: true, username: true, email: true, role: true, isActive: true,
        avatarUrl: true, firstName: true, surname: true, location: true,
        bio: true, settings: true, createdAt: true,
        specialization: true, skills: true,   // новые поля
      },
    });
    if (!user) return reply.status(404).send({ message: 'User not found' });
    return user;
  });

  // PATCH /user/profile – обновление с новыми полями
  app.patch('/profile', {
    preValidation: app.authenticate,
    schema: { body: updateProfileSchema },
  }, async (req, reply) => {
    const userId = req.user!.sub;
    const data = req.body;

    // Если переданы skills (массив) – преобразуем в JSON-совместимый вид
    if (data.skills !== undefined) {
      data.skills = data.skills; // Prisma принимает массив как Json
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: data,
      select: {
        id: true, username: true, email: true, role: true, isActive: true,
        avatarUrl: true, firstName: true, surname: true, location: true,
        bio: true, settings: true, createdAt: true,
        specialization: true, skills: true,
      },
    });
    return updated;
  });

  // POST /user/change-password – смена пароля
  app.post('/change-password', {
    preValidation: app.authenticate,
    schema: { body: changePasswordSchema },
  }, async (req, reply) => {
    const userId = req.user!.sub;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) return reply.status(404).send({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({ message: 'Invalid old password' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true, message: 'Password updated successfully' };
  });
};

export default profileRoutes;