import { Router } from 'itty-router'
import jwt from 'jsonwebtoken'

interface Env {
  JWT_SECRET: string
}

const router = Router()

// Authentication middleware
const authMiddleware = async (request: Request, env: Env) => {
  const authHeader = request.headers.get('Authorization') || ''
  const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/)
  if (!tokenMatch) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const token = tokenMatch[1]
    const payload = jwt.verify(token, env.JWT_SECRET)
    // attach payload for downstream handlers
    ;(request as any).auth = payload
  } catch (err) {
    return new Response('Unauthorized', { status: 401 })
  }
}

// Route handlers
const getEvents = async (request: Request) => {
  return new Response(JSON.stringify({ events: [] }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

const getEventById = async (request: Request) => {
  const { id } = (request as any).params
  return new Response(JSON.stringify({ id }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

const subscribe = async (request: Request) => {
  const data = await request.json().catch(() => null)
  if (!data) {
    return new Response('Invalid JSON', { status: 400 })
  }
  return new Response(JSON.stringify({ subscription: data }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  })
}

const storeEvent = async (request: Request) => {
  const event = await request.json().catch(() => null)
  if (!event) {
    return new Response('Invalid JSON', { status: 400 })
  }
  return new Response('Stored', { status: 201 })
}

router.all('*', authMiddleware)
router.get('/api/events', getEvents)
router.get('/api/events/:id', getEventById)
router.post('/api/subscribe', subscribe)
router.post('/internal/store-event', storeEvent)

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    router.handle(request, env, ctx),
}
