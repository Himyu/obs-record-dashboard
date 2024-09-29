import { connect, reconnect } from '$lib/server/obsConnections';
import type OBSWebSocket from 'obs-websocket-js';
import type { PageServerLoad, Actions } from './$types';

export interface OBSConfig {
  id: number
  name: string
  ip: string
  port: number
  password?: string
  online: boolean
  recording: boolean
}

export const load = (async ({ locals }) => {
  const sql = locals.db?.prepare('SELECT * FROM obs')
  const data = sql?.all() as OBSConfig[]

  return {
    OBSConfig: data
  };
}) satisfies PageServerLoad;

export const actions = {
  add: async ({ request, locals }) => {
    const data = await request.formData()
    if (!data.has('name') || !data.has('ip') || !data.has('port')) {
      return
    }

    const sql = locals.db?.prepare('INSERT INTO obs(name, ip, port, password) VALUES (?, ?, ?, ?)')
    const response = sql?.run(data.get('name'), data.get('ip'), data.get('port'), data.get('password') ?? undefined)

    if (response === undefined) return

    await connect({
      id: response.lastInsertRowid as number,
      name: data.get('name') as string,
      ip: data.get('ip') as string,
      port: Number(data.get('port')?.toString()),
      password: data.get('password')?.toString() ?? undefined,
      online: false,
      recording: false
    })
  },
  delete: async ({ request, locals }) => {
    const data = await request.formData()
    if (!data.has('id')) {
      return
    }

    const sql = locals.db?.prepare('DELETE FROM obs WHERE id = ?')
    const response = sql?.run(data.get('id'))

    if (response === undefined) return

    const conn: OBSWebSocket = locals.connections?.get(Number(data.get('id')?.toString()))
    await conn.disconnect()

    locals.connections?.delete(Number(data.get('id')?.toString()))
  },
  reconnect: async ({ request }) => {
    const data = await request.formData()
    if (!data.has('id')) return
    const id = Number(data.get('id')!.toString())

    await reconnect(id)
  }
} satisfies Actions;