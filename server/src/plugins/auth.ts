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

export default fp(async function (app: FastifyInstance) {
  app.decorate("authorize", function (roles: string[]) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user;
      if (!user || !roles.includes(user.role)) {
        reply.status(403).send({ message: "Forbidden" });
      }
    };
  });
});
