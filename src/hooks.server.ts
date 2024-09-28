import { building } from '$app/environment';
import { GlobalThisWSS } from '$lib/server/webSocket';
import type { Handle } from '@sveltejs/kit';
import type { ExtendedGlobal } from '$lib/server/webSocket';
import sqlite3 from "sqlite3";

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
      console.log(`[wss:kit] client connected (${ws.socketId})`);
      ws.send(`Hello from SvelteKit ${new Date().toLocaleString()} (${ws.socketId})]`);

      ws.on('close', () => {
        console.log(`[wss:kit] client disconnected (${ws.socketId})`);
      });
    });
    wssInitialized = true;
  }
};

export const handle = (async ({ event, resolve }) => {
  startupWebsocketServer();
  // Skip WebSocket server when pre-rendering pages
  if (!building) {
    if (!event.locals.db) {
      // This will create the database within the `db.sqlite` file.
      const db = new sqlite3.Database('db.sqlite', (err) => {
        if(err) {
          throw err;
        }
      });
      
      // Set the db as our events.db variable.
      event.locals.db = db
      
      // We can create a basic table in the db
      const query = "CREATE TABLE IF NOT EXISTS obs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, ip TEXT, port INT, password TEXT)"
      db.run(query, (err) => {
        if(err) {
          throw err
        }
      })
    }

    const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
    if (wss !== undefined) {
      event.locals.wss = wss;
    }
  }
  const response = await resolve(event, {
		filterSerializedResponseHeaders: name => name === 'content-type',
	});
  return response;
}) satisfies Handle;