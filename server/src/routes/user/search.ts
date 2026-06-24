import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import prisma from '../../lib/prisma';

const searchUsersSchema = {
  querystring: z.object({
    q: z.string().min(1, 'Search query must not be empty'),
  }),
};

const searchUsersRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/search',
    {
      schema: searchUsersSchema,
      preValidation: app.authenticate,
      preHandler: async (req, reply) => {
        // Запрещаем поиск для new_user
        if (req.user!.role === 'new_user') {
          return reply.status(403).send({
            message: 'Access denied. Your account is pending activation.',
          });
        }
      },
    },
    async (req, reply) => {
      const { q } = req.query;

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { surname: { contains: q, mode: 'insensitive' } },
          ],
          // Исключаем заблокированных пользователей (опционально)
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          surname: true,
          avatarUrl: true,
        },
        take: 20, // ограничиваем количество результатов
        orderBy: [{ firstName: 'asc' }, { surname: 'asc' }, { username: 'asc' }],
      });

      return users;
    }
  );
};

export default searchUsersRoute;