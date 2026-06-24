import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import authRoutes from './routes/auth/index';
import authPlugin from './plugins/auth';
import userTabsRoutes from './routes/user/tabs';
import projectsRoutes from './routes/projects';
import profileRoutes from './routes/user/profile';
import adminUsersRoutes from './routes/admin/users';
import searchUsersRoute from './routes/user/search';
import kanbanRoutes from './routes/kanban';
import avatarRoute from './routes/user/avatar';

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

app.register(cors, { origin: (origin, cb) => {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://192.168.208.1:5173',   // добавьте свой IP
      //process.env.CLIENT_URL,        // опционально из .env
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
});
app.register(cookie);
app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-me' });
app.register(websocket);
app.register(swagger, { openapi: { info: { title: 'Task Tracker API', version: '1.0.0' }}});
app.register(swaggerUi, { routePrefix: '/docs' });
app.register(authRoutes, { prefix: '/auth' });
app.register(authPlugin);
app.register(userTabsRoutes, { prefix: '/user' });
app.register(projectsRoutes, { prefix: '/projects' });
app.register(profileRoutes, { prefix: '/user' });
app.register(adminUsersRoutes, { prefix: '/admin/users' });
app.register(searchUsersRoute, { prefix: '/users' });
app.register(kanbanRoutes);
app.register(avatarRoute, { prefix: '/user' });
/*app.register(async (api) => {
 api.register(authRoutes, { prefix: '/auth' });
  api.register(userTabsRoutes, { prefix: '/user' });
  api.register(projectsRoutes, { prefix: '/projects' });
  api.register(profileRoutes, { prefix: '/user' });
  api.register(adminUsersRoutes, { prefix: '/admin' });
  api.register(searchUsersRoute, { prefix: '/users' });
  app.register(kanbanRoutes, { prefix: '/api' });
}, { prefix: '/api' });
*/
export default app;