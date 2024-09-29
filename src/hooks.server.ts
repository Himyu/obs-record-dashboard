import { building } from '$app/environment';
import { GlobalThisWSS } from '$lib/server/webSocket';
import type { Handle } from '@sveltejs/kit';
import { GlobalThisConn, initSavedOBSConfig } from '$lib/server/obsConnections';
import type { ExtendedGlobal } from './app';
import { GlobalThisDB, initDB } from '$lib/server/db';

// This can be extracted into a separate file
let wssInitialized = false;
const startupWebsocketServer = () => {
  if (wssInitialized) return;
  console.log('[wss:kit] setup');
  const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
  if (wss !== undefined) {
    wss.on('connection', (ws) => {
      // This is where you can authenticate the client from the request
      // const session = await getSessionFromCookie(request.headers.cookie || '');
      // if (!session) ws.close(1008, 'User not authenticated');
      // ws.userId = session.userId;
      console.debug(`[wss:kit] client connected (${ws.socketId})`);

      ws.on('close', () => {
        console.debug(`[wss:kit] client disconnected (${ws.socketId})`);
      });
    });
    wssInitialized = true;
  }
};


export const handle = (async ({ event, resolve }) => {
  startupWebsocketServer()
  initDB()
  initSavedOBSConfig()

  if (!event.locals.db) {
    const db = (globalThis as ExtendedGlobal)[GlobalThisDB];
    if (db !== undefined) {
      event.locals.db = db
    }
  }

  // Skip WebSocket server when pre-rendering pages
  if (!building) {
    const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
    if (wss !== undefined) {
      event.locals.wss = wss;
    }

    const connections = (globalThis as ExtendedGlobal)[GlobalThisConn];
    if (connections !== undefined) {
      event.locals.connections = connections;
    }
  }
  const response = await resolve(event, {
    filterSerializedResponseHeaders: name => name === 'content-type',
  });
  return response;
}) satisfies Handle;