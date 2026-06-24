import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { loginSchema } from "../../schemas/login.schema";
import prisma from "../../lib/prisma";
import bcrypt from "bcrypt";
import { createTokens } from "../../services/auth.service";

const loginRoute: FastifyPluginAsyncZod = async (app) => {
  app.post("/login", { schema: { body: loginSchema } }, async (req, reply) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({ message: "Неверные логин или пароль" });
    }
    if (!user.isActive) {
      return reply.status(403).send({ message: "Аккант заблокирован" });
   }
    // Для new_user вход разрешён, но доступа к проектам нет (middleware).
    const tokens = await createTokens(user.id, user.role);
    // устанавливаем refresh-токен в httpOnly cookie
    reply.setCookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",//"none",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return {
      accessToken: tokens.accessToken,
      user: {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    firstName: user.firstName,
    surname: user.surname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  },
    };
  });
  
};

export default loginRoute;
