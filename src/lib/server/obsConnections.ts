import type { OBSConfig } from "../../routes/+page.server";
import { EventSubscription, OBSWebSocket } from 'obs-websocket-js';
import { GlobalThisWSS } from "./webSocket";
import { GlobalThisDB } from "./db";
import type { ExtendedGlobal } from "../../app";

export const GlobalThisConn = Symbol.for('sveltekit.obs-connections');
export const connections: Map<number, OBSWebSocket> = new Map()

let obsInitialized = false;
export const initSavedOBSConfig = async () => {
  if (obsInitialized) return;
  console.log('[obs:kit] setup');

  (globalThis as ExtendedGlobal)[GlobalThisConn] = connections
  const db = (globalThis as ExtendedGlobal)[GlobalThisDB];

  if (db === undefined) return

  try {
    const query = db.prepare("SELECT * FROM obs");
    const data = query.all() as OBSConfig[]

    await Promise.all(data.map(async (obs) => {
      await connect(obs)
    }))

    obsInitialized = true
  } catch (error) {
    console.error(error)
  }
}

export const reconnect = async (id: number) => {
  const db = (globalThis as ExtendedGlobal)[GlobalThisDB];
  const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];

  if (db === undefined || wss === undefined) return

  let data

  try {
    const query = db.prepare("SELECT * FROM obs WHERE id = ?");
    data = query.get(id) as OBSConfig
  } catch (error) {
    console.error(error)
    return
  }

  const connection = connections.get(id)
  if (connection === undefined) return

  try {
    await connection.connect(`ws://${data.ip}:${data.port}`, data.password, {
      rpcVersion: 1,
      eventSubscriptions: EventSubscription.All
    })

    wss.clients.forEach(c => {
      c.send(JSON.stringify({
        meta: {
          namespace: 'obs',
          type: 'connection'
        },
        id: id,
        connected: true
      }))
    })

    const query = db.prepare('UPDATE obs SET online = true WHERE id = ?');
    query.run(id)

    return true
  } catch (error) {
    console.error(error)
    wss.clients.forEach(c => {
      c.send(JSON.stringify({
        meta: {
          namespace: 'obs',
          type: 'connection'
        },
        id: id,
        connected: false
      }))
    })

    const query = db.prepare('UPDATE obs SET online = false, recording = false WHERE id = ?');
    query.run(id)

    return false
  }
}

export const connect = async (obs: OBSConfig) => {
  const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
  const db = (globalThis as ExtendedGlobal)[GlobalThisDB];

  if (db === undefined || wss === undefined) return

  const connection = new OBSWebSocket()
  connections.set(obs.id, connection)

  try {
    await connection.connect(`ws://${obs.ip}:${obs.port}`, obs.password, {
      rpcVersion: 1,
      eventSubscriptions: EventSubscription.All
    })

    wss.clients.forEach(c => {
      c.send(JSON.stringify({
        meta: {
          namespace: 'obs',
          type: 'connection'
        },
        id: obs.id,
        connected: true
      }))
    })

    const query = db.prepare('UPDATE obs SET online = true WHERE id = ?');
    query.run(obs.id)
  } catch (error) {
    console.error(error)
    wss.clients.forEach(c => {
      c.send(JSON.stringify({
        meta: {
          namespace: 'obs',
          type: 'connection'
        },
        id: obs.id,
        connected: false
      }))
    })

    const query = db.prepare('UPDATE obs SET online = false, recording = false WHERE id = ?');
    query.run(obs.id)

    return false
  }

  connection.on('ConnectionClosed', () => {
    wss.clients.forEach(c => {
      c.send(JSON.stringify({
        meta: {
          namespace: 'obs',
          type: 'connection'
        },
        id: obs.id,
        connected: false
      }))
    })

    const query = db.prepare('UPDATE obs SET online = false, recording = false WHERE id = ?');
    query.run(obs.id)
  })
  connection.on('ConnectionError', (err) => {
    console.error(err)

    wss.clients.forEach(c => {
      c.send(JSON.stringify({
        meta: {
          namespace: 'obs',
          type: 'connection'
        },
        id: obs.id,
        connected: false
      }))
    })

    const query = db.prepare('UPDATE obs SET online = false, recording = false WHERE id = ?');
    query.run(obs.id)
  })

  connection.on('RecordStateChanged', (rs) => {
    wss.clients.forEach(c => {
      c.send(JSON.stringify({
        meta: {
          namespace: 'obs',
          type: 'recording'
        },
        id: obs.id,
        state: rs.outputActive
      }))
    })

    const query = db.prepare('UPDATE obs SET recording = ? WHERE id = ?');
    query.run(rs.outputState, obs.id)
  })

  return true
}

