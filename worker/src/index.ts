export interface Env { ROOMS: KVNamespace }

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type',
      ...(init.headers ?? {}),
    },
  })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'OPTIONS') return json({}, { status: 204 })

    if (request.method === 'GET' && path.startsWith('/room/')) {
      const code = path.split('/').pop()!
      const room = await env.ROOMS.get(code)
      return json({ exists: !!room, room: room ? JSON.parse(room) : null })
    }

    if (request.method === 'POST' && path === '/room') {
      const body = await request.json() as { code: string; hostPeerId: string }
      const record = { code: body.code, hostPeerId: body.hostPeerId, createdAt: new Date().toISOString() }
      await env.ROOMS.put(body.code, JSON.stringify(record), { expirationTtl: 60 * 60 * 2 })
      return json({ ok: true, room: record }, { status: 201 })
    }

    if (request.method === 'DELETE' && path.startsWith('/room/')) {
      const code = path.split('/').pop()!
      await env.ROOMS.delete(code)
      return json({ ok: true })
    }

    return json({ error: 'Not found' }, { status: 404 })
  },
}
