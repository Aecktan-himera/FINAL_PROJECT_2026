import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { registerSchema } from '../../schemas/auth.schema';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';

const registerRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/register', {
    schema: {
      body: registerSchema,
    },
  }, async (req, reply) => {
    const { email, password, username, firstName, surname } = req.body;

    // проверка уникальности
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return reply.status(409).send({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        firstName,
        surname,
        role: 'new_user', // активация администратором
      },
    });

    // генерируем токены сразу? По README после регистрации только сообщение об ожидании активации.
    // Лучше не выдавать токены, пока не активирован. Но для входа разрешим позже.
    return reply.status(201).send({ message: 'Registration successful. Await activation.' });
  });
};

export default registerRoute;