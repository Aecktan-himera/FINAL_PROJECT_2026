import { FastifyInstance } from 'fastify';
import registerRoute from './register';
import loginRoute from './login';
import refreshRoute from './refresh'
import logoutRoute from './logout';


export default async function authRoutes(app: FastifyInstance) {
  app.register(registerRoute);
  app.register(loginRoute);
  app.register(refreshRoute);
  app.register(logoutRoute);
  
}