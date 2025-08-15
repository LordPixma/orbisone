// API Worker - Exposes RESTful endpoints for accessing event data, managing subscriptions, and retrieving statistics.

// TODO: Implement routing, JWT validation middleware, input validation, and endpoint handlers.

import { IRequest, Router, RouterType } from 'itty-router';
import { JwtPayload } from '../../lib/types'; // Assuming types are in lib/types.ts

interface Env {
  // Define your environment variables here, e.g.:
  // JWT_SECRET: string;
  // D1_DATABASE: D1Database;
}

const router = Router<IRequest, [Env]>();

// Middleware for JWT validation
const authMiddleware = async (request: IRequest, env: Env) => {
  // TODO: Implement JWT token extraction and verification
  // const authHeader = request.headers.get('Authorization');
  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return new Response('Unauthorized', { status: 401 });
  // }
  // const token = authHeader.substring(7);
  // try {
  //   const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  //   request.user = decoded.sub; // Attach user ID to the request
  // } catch (err) {
  //   return new Response('Forbidden', { status: 403 });
  // }
};

// Apply auth middleware to all /api routes
router.all('/api/*', authMiddleware);

// TODO: Implement endpoint handlers
router.get('/api/events', async (request, env) => {
  // TODO: Implement fetching and filtering events from D1
  // const events = await env.D1_DATABASE.prepare('SELECT * FROM events').all();
  return new Response('GET /api/events endpoint - Not implemented yet', { status: 200 });
});

router.get('/api/events/:id', async (request, env) => {
  // TODO: Implement fetching a specific event from D1
  // const eventId = request.params.id;
  // const event = await env.D1_DATABASE.prepare('SELECT * FROM events WHERE id = ?').bind(eventId).first();
  return new Response(`GET /api/events/${request.params.id} endpoint - Not implemented yet`, { status: 200 });
});

router.post('/api/subscribe', async (request, env) => {
  // TODO: Implement creating a new subscription in D1
  return new Response('POST /api/subscribe endpoint - Not implemented yet', { status: 200 });
});

router.get('/api/stats', async (request, env) => {
  // TODO: Implement fetching usage statistics
  return new Response('GET /api/stats endpoint - Not implemented yet', { status: 200 });
});


// 404 for other routes
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    router.handle(request, env, ctx),
};