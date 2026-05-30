import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      role: string;
      jti?: string;
      iat?: number;
      exp?: number;
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function (app: FastifyInstance) {
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        // Возвращаем reply, чтобы остановить выполнение хуков и хендлера
        return reply.status(401).send({ message: "Unauthorized" });
      }
    }
  );

  app.decorate("authorize", function (roles: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;
      if (!user || !roles.includes(user.role)) {
        return reply.status(403).send({ message: "Forbidden" });
      }
    };
  });
});