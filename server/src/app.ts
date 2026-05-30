import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import authRoutes from './routes/auth/index';
import authPlugin from './plugins/auth';
import userTabsRoutes from './routes/user/tabs';
import projectsRoutes from './routes/projects';

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);


app.register(cors, { origin: 'http://localhost:5173', credentials: true });
app.register(cookie);
app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-me' });
app.register(websocket);
app.register(swagger, { openapi: { info: { title: 'Task Tracker API', version: '1.0.0' }}});
app.register(swaggerUi, { routePrefix: '/docs' });
app.register(authRoutes, { prefix: '/auth' });
app.register(authPlugin);
app.register(userTabsRoutes, { prefix: '/user' });
app.register(projectsRoutes, { prefix: '/projects' });

export default app;