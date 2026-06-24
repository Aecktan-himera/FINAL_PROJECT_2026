import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import { createTokens } from '../../services/auth.service'


const refreshRoute: FastifyPluginAsyncZod = async (app) => {
    app.post('/refresh', async (req, reply) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return reply.status(401).send();
  
  let payload: any;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
  } catch { return reply.status(401).send(); }

  const storedToken = await prisma.token.findFirst({
    where: { token: refreshToken, blacklisted: false, jti: payload.jti },
  });
  if (!storedToken || storedToken.expiresAt < new Date()) return reply.status(401).send();

   // Проверка, активен ли пользователь (добавлено)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return reply.status(401).send({ message: 'Account disabled' });
    }

    // отзываем старый токен
    await prisma.token.update({
      where: { id: storedToken.id },
      data: { blacklisted: true },
    });

    // выдаём новые токены
    const tokens = await createTokens(user.id, user.role);
    reply.setCookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",//'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return { accessToken: tokens.accessToken };
  });
};

export default refreshRoute;