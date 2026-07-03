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
  color?: string; // accent hex for the button + badges (default API Commons blue)
}

const DEFAULT_COLOR = '3098d8';

// Normalize a hex color to a bare 6-digit lowercase string (no hash), or the default.
function badgeColor(color?: string): string {
  const v = (color ?? '').trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(v)) return v.split('').map((c) => c + c).join('');
  if (/^[0-9a-f]{6}$/.test(v)) return v;
  return DEFAULT_COLOR;
}

export function chooserUrl(src: ButtonSource): string {
  if (src.registryName) return `${SITE}/?name=${encodeURIComponent(src.registryName)}`;
  if (src.serverJsonUrl) return `${SITE}/?server=${encodeURIComponent(src.serverJsonUrl)}`;
  return `${SITE}/?config=${encodeServerDef(src.def)}`;
}

export function badgeImageUrl(def: ServerDef, color?: string): string {
  const name = serverKey(def).replace(/-/g, '_');
  return `https://img.shields.io/badge/Install_MCP_Server-${encodeURIComponent(name)}-${badgeColor(color)}?style=flat-square`;
}

export function markdownButton(src: ButtonSource): string {
  return `[![Install MCP Server](${badgeImageUrl(src.def, src.color)})](${chooserUrl(src)})`;
}

export function htmlButton(src: ButtonSource): string {
  return `<a href="${chooserUrl(src)}"><img src="${badgeImageUrl(src.def, src.color)}" alt="Install MCP Server" /></a>`;
}

export function webComponentSnippet(src: ButtonSource): string {
  const attrs = [
    src.registryName
      ? `name="${escapeAttr(src.registryName)}"`
      : src.serverJsonUrl
        ? `server="${escapeAttr(src.serverJsonUrl)}"`
        : `config="${encodeServerDef(src.def)}"`,
  ];
  if (badgeColor(src.color) !== DEFAULT_COLOR) attrs.push(`color="#${badgeColor(src.color)}"`);
  return [
    `<script src="${SITE}/button.js" async></script>`,
    `<mcp-install-button ${attrs.join(' ')}></mcp-install-button>`,
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
