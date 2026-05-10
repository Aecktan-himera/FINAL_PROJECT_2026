import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// plugins
app.register(cors, { origin: true, credentials: true });
app.register(cookie);
app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-me' });
app.register(websocket);
app.register(swagger, { /* swagger options */ });
app.register(swaggerUi, { routePrefix: '/docs' });

export default app;