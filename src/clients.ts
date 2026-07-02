import type { ClientRegistry } from './types';

let cached: Promise<ClientRegistry> | undefined;

// The app loads its own /clients.json; the widget passes an absolute URL
// derived from wherever button.js was loaded from.
export function loadClients(url: string = '/clients.json'): Promise<ClientRegistry> {
  cached ??= fetch(url).then((r) => {
    if (!r.ok) throw new Error(`clients.json ${r.status}`);
    return r.json() as Promise<ClientRegistry>;
  });
  return cached;
}
