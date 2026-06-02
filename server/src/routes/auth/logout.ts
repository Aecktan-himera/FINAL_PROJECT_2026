import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import prisma from '../../lib/prisma';

const logoutRoute: FastifyPluginAsyncZod = async (app) => {
  app.post('/logout', { preValidation: app.authenticate }, async (req, reply) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Отзываем refresh-токен (помечаем blacklisted)
      await prisma.token.updateMany({
        where: { token: refreshToken },
        data: { blacklisted: true },
      });
    }
    
    // Очищаем cookie на клиенте
    reply.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    
    return { success: true, message: 'Logged out successfully' };
  });
};

export default logoutRoute;