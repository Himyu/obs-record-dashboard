import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import type WebSocket from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import type { ExtendedGlobal } from '../../app';

export const GlobalThisWSS = Symbol.for('sveltekit.wss');

interface ExtendedWebSocket extends WebSocket {
  socketId: string;
  // userId: string;
};

type ExtendedWebSocketConstructor = typeof WebSocket & {
  new(): ExtendedWebSocket
}

// You can define server-wide functions or class instances here
// export interface ExtendedServer extends Server<ExtendedWebSocket> {};

export type ExtendedWebSocketServer = WebSocket.Server<ExtendedWebSocketConstructor>;

export const onHttpServerUpgrade = (req: IncomingMessage, sock: Duplex, head: Buffer) => {
  const pathname = req.url ?? null;
  if (pathname !== '/websocket') return;

  const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];
  if (wss === undefined) return

  wss.handleUpgrade(req, sock, head, (ws) => {
    console.debug('[handleUpgrade] creating new connecttion');
    wss.emit('connection', ws, req);
  });
};

export const createWSSGlobalInstance = () => {
  const wss = new WebSocketServer({ noServer: true }) as ExtendedWebSocketServer;

  (globalThis as ExtendedGlobal)[GlobalThisWSS] = wss;

  wss.on('connection', (ws) => {
    ws.socketId = nanoid();
    console.debug(`[wss:global] client connected (${ws.socketId})`);

    ws.on('close', () => {
      console.debug(`[wss:global] client disconnected (${ws.socketId})`);
    });
  });

  return wss;
};