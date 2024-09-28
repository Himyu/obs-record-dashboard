import type { ExtendedWebSocketServer } from '$lib/server/webSocket';
import type { Database } from 'sqlite3';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			wss?: ExtendedWebSocketServer;
			db?: Database
		}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};