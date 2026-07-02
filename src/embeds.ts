// Everything a provider copies out of the generator: the hosted button link,
// markdown/HTML embeds, the web component snippet, and per-client badge rows.

import type { ClientDef, ServerDef } from './types';
import { encodeServerDef, serverKey } from './types';
import { buildDeeplink } from './actions';

export const SITE = 'https://install.apicommons.org';

export interface ButtonSource {
  // Which parameter the button carries — a canonical pointer beats an inline copy.
  registryName?: string; // ?name=
  serverJsonUrl?: string; // ?server=
  def: ServerDef; // fallback payload for ?config=
}

export function chooserUrl(src: ButtonSource): string {
  if (src.registryName) return `${SITE}/?name=${encodeURIComponent(src.registryName)}`;
  if (src.serverJsonUrl) return `${SITE}/?server=${encodeURIComponent(src.serverJsonUrl)}`;
  return `${SITE}/?config=${encodeServerDef(src.def)}`;
}

export function badgeImageUrl(def: ServerDef): string {
  const name = serverKey(def).replace(/-/g, '_');
  return `https://img.shields.io/badge/Install_MCP_Server-${encodeURIComponent(name)}-3098d8?style=flat-square`;
}

export function markdownButton(src: ButtonSource): string {
  return `[![Install MCP Server](${badgeImageUrl(src.def)})](${chooserUrl(src)})`;
}

export function htmlButton(src: ButtonSource): string {
  return `<a href="${chooserUrl(src)}"><img src="${badgeImageUrl(src.def)}" alt="Install MCP Server" /></a>`;
}

export function webComponentSnippet(src: ButtonSource): string {
  const attr = src.registryName
    ? `name="${escapeAttr(src.registryName)}"`
    : src.serverJsonUrl
      ? `server="${escapeAttr(src.serverJsonUrl)}"`
      : `config="${encodeServerDef(src.def)}"`;
  return [
    `<script src="${SITE}/button.js" async></script>`,
    `<mcp-install-button ${attr}></mcp-install-button>`,
  ].join('\n');
}

// Per-client badge row for the clients that support one-click deep links.
export function badgeRow(clients: ClientDef[], def: ServerDef): string {
  const rows: string[] = [];
  for (const client of clients) {
    if (!client.deeplink) continue;
    const href = buildDeeplink(client, def);
    if (!href) continue;
    const label = `Add to ${client.name}`.replace(/\s/g, '_').replace(/-/g, '--');
    const img = `https://img.shields.io/badge/${encodeURIComponent(label)}-0b1220?style=flat-square`;
    rows.push(`[![Add to ${client.name}](${img})](${href})`);
  }
  return rows.join('\n');
}

function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
