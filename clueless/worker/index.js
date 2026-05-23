import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['content-type'],
  }),
)

app.get('/api/*', (c) => c.json({ name: 'Cloudflare' }))

app.get('/room/:code', async (c) => {
  const code = c.req.param('code')
  const room = await c.env.ROOMS.get(code)

  return c.json({
    exists: Boolean(room),
    room: room ? JSON.parse(room) : null,
  })
})

app.post('/room', async (c) => {
  let body

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400)
  }

  if (!body || typeof body.code !== 'string' || typeof body.hostPeerId !== 'string') {
    return c.json({ error: 'Invalid room payload' }, 400)
  }

  const record = {
    code: body.code,
    hostPeerId: body.hostPeerId,
    createdAt: new Date().toISOString(),
  }

  await c.env.ROOMS.put(body.code, JSON.stringify(record), {
    expirationTtl: 60 * 60 * 2,
  })

  return c.json({ ok: true, room: record }, 201)
})

app.delete('/room/:code', async (c) => {
  const code = c.req.param('code')

  if (!code) {
    return c.json({ error: 'Missing room code' }, 400)
  }

  await c.env.ROOMS.delete(code)

  return c.json({ ok: true })
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app
