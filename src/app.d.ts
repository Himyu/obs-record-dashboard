import type { GlobalThisDB } from '$lib/server/db';
import type { GlobalThisConn } from '$lib/server/obsConnections';
import type { ExtendedWebSocketServer, GlobalThisWSS } from '$lib/server/webSocket';
import type { Database } from "better-sqlite3";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			wss?: ExtendedWebSocketServer;
			db?: Database;
			connections?: Map<number, OBSWebSocket>;
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export type ExtendedGlobal = typeof globalThis & {
  [GlobalThisWSS]?: ExtendedWebSocketServer;
  [GlobalThisDB]?: Database;
  [GlobalThisConn]?: Map<number, OBSWebSocket>;
};

export {};