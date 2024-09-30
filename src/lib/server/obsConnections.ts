import type { OBSConfig } from "../../routes/+page.server";
import { EventSubscription, OBSWebSocket } from 'obs-websocket-js';
import { GlobalThisDB } from "./db";
import type { ExtendedGlobal } from "../../app";
import { sendMessage } from "./sendMessage";

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

  if (db === undefined) return

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

    sendMessage('obs', 'connection', {
      id: id,
      connected: true
    })

    const query = db.prepare('UPDATE obs SET online = true WHERE id = ?');
    query.run(id)

    return true
  } catch (error) {
    console.error(error)
    sendMessage('obs', 'connection', {
      id: id,
      connected: false
    })

    const query = db.prepare('UPDATE obs SET online = false, recordingActive = false WHERE id = ?');
    query.run(id)

    return false
  }
}

export const connect = async (obs: OBSConfig) => {
  const db = (globalThis as ExtendedGlobal)[GlobalThisDB];

  if (db === undefined) return

  const connection = new OBSWebSocket()
  connections.set(obs.id, connection)

  try {
    await connection.connect(`ws://${obs.ip}:${obs.port}`, obs.password, {
      rpcVersion: 1,
      eventSubscriptions: EventSubscription.All
    })

    sendMessage('obs', 'connection', {
      id: obs.id,
      connected: true
    })

    const query = db.prepare('UPDATE obs SET online = true WHERE id = ?');
    query.run(obs.id)
  } catch (error) {
    console.error(error)
    sendMessage('obs', 'connection', {
      id: obs.id,
      connected: false
    })

    const query = db.prepare('UPDATE obs SET online = false, recordingActive = false WHERE id = ?');
    query.run(obs.id)

    return false
  }

  connection.on('ConnectionClosed', async () => {
    sendMessage('obs', 'connection', {
      id: obs.id,
      connected: false
    })

    const query = db.prepare('UPDATE obs SET online = false, recordingActive = false WHERE id = ?');
    query.run(obs.id)
  })
  connection.on('ConnectionError', async (err) => {
    console.error(err)

    sendMessage('obs', 'connection', {
      id: obs.id,
      connected: false
    })

    const query = db.prepare('UPDATE obs SET online = false, recordingActive = false WHERE id = ?');
    query.run(obs.id)
  })

  connection.on('RecordStateChanged', async (rs) => {
    if (rs.outputState.endsWith('ING')) return

    const query = db.prepare('UPDATE obs SET recordingActive = ?, recordingState = ? WHERE id = ?');
    query.run(rs.outputActive ? 1 : 0, rs.outputState, obs.id)
    
    setTimeout(() => {
      sendMessage('obs', 'recording', {
        id: obs.id,
        recordingActive: rs.outputActive,
        recordingState: rs.outputState
      })
    }, 1000)
  })

  return true
}

export const recording = async (id: number, action: 'StartRecord' | 'StopRecord') => {
  const connection = connections.get(id)
  if (connection === undefined) return

  try {
    await connection.call(action)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const all = async (action: 'StartRecord' | 'StopRecord') => {
  const db = (globalThis as ExtendedGlobal)[GlobalThisDB];

  if (db === undefined) return

  let data

  try {
    const query = db.prepare("SELECT * FROM obs");
    data = query.all() as OBSConfig[]
  } catch (error) {
    console.error(error)
    return
  }

  await Promise.all(data.map(async (c) => {
    if (c.recordingActive === true && action === 'StartRecord') return
    if (c.recordingActive === false && action === 'StopRecord') return
    
    return recording(c.id, action)
  }))
}
