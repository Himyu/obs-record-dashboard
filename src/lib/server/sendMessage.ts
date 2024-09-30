import type { ExtendedGlobal } from "../../app";
import { GlobalThisWSS } from "./webSocket";

export function sendMessage (namespace: string, type: string, data: any): void {
  const wss = (globalThis as ExtendedGlobal)[GlobalThisWSS];

  if (wss === undefined) return

  wss.clients.forEach(c => {
    c.send(JSON.stringify({
      meta: {
        namespace,
        type
      },
      ...data
    }))
  })
}