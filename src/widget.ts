// <mcp-install-button> — the embeddable universal install button.
// Built standalone as /button.js (IIFE); also imported by the app so the
// generator's live preview is the real component.
//
//   <script src="https://install.apicommons.org/button.js" async></script>
//   <mcp-install-button name="io.github.acme/acme-mcp"></mcp-install-button>
//
// Attributes:
//   name     — server name in the official MCP Registry (preferred)
//   server   — URL of a server.json to fetch
//   config   — base64url-encoded inline ServerDef (from the generator)
//   label    — button text (default "Install MCP Server")
//   clients  — comma-separated client ids to limit the menu to
//   registry — override the clients.json URL
//   theme    — "dark" (default) or "light"
//   color    — accent hex (e.g. "#3098d8") for the trigger button + menu accents

import type { ClientDef, InstallOption, ServerDef } from './types';
import { detectOS, installOptions } from './actions';
import { resolveFromParams } from './server-def';
import { esc, copyText } from './util';

// Captured at script-eval time so the widget finds its own origin's
// clients.json and chooser page even when embedded on a provider's site.
const SCRIPT_BASE = (() => {
  const src = (document.currentScript as HTMLScriptElement | null)?.src;
  try {
    return src ? new URL('.', src).href.replace(/\/$/, '') : 'https://install.apicommons.org';
  } catch {
    return 'https://install.apicommons.org';
  }
})();

const CATEGORY_LABELS: Record<string, string> = {
  deeplink: 'One-click',
  cli: 'Command line',
  config: 'Config file',
  connector: 'Connect in app',
};

const STYLES = `
  :host { display: inline-block; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; position: relative; }
  /* Embedders can size the trigger button to match their own buttons by setting
     these custom properties on the host (e.g. style="--mcp-btn-font-size:1.25rem").
     Defaults preserve the original look. */
  .btn { display: inline-flex; align-items: center; gap: .5rem; cursor: pointer; border: 1px solid transparent;
    border-radius: var(--mcp-btn-radius, 8px); padding: var(--mcp-btn-pad-y, .55rem) var(--mcp-btn-pad-x, 1rem);
    font-size: var(--mcp-btn-font-size, .9rem); line-height: var(--mcp-btn-line-height, 1.5); font-weight: 600;
    background: var(--mcp-btn-bg, #0b1220); color: var(--mcp-btn-color, #fff); }
  .btn svg { flex: none; }
  .btn:hover { background: var(--mcp-btn-bg-hover, #16233f); }
  :host([theme="light"]) .btn { background: var(--mcp-btn-bg, #fff); color: var(--mcp-btn-color, #0b1220); border-color: #cbd5e1; }
  .panel { position: absolute; z-index: 9999; top: calc(100% + 6px); left: 0; min-width: 340px; max-width: 420px;
    max-height: 420px; overflow-y: auto; background: #fff; color: #0f172a; border: 1px solid #dbe2ea;
    border-radius: 10px; box-shadow: 0 12px 32px rgba(2, 8, 23, .18); padding: .4rem; }
  .group { font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: #64748b; padding: .5rem .6rem .2rem; }
  .row { border-radius: 8px; }
  .row > .head { display: flex; align-items: center; gap: .5rem; width: 100%; padding: .45rem .6rem;
    background: none; border: 0; font: inherit; font-size: .85rem; cursor: pointer; text-align: left;
    color: inherit; text-decoration: none; border-radius: 8px; box-sizing: border-box; }
  .row > .head:hover { background: #f1f5f9; }
  .row .go { margin-left: auto; color: var(--mcp-accent, #3098d8); font-size: .8rem; white-space: nowrap; }
  .detail { padding: .3rem .6rem .6rem; }
  .detail .where { font-size: .72rem; color: #475569; margin: 0 0 .3rem; }
  pre { margin: 0; padding: .5rem .6rem; background: #0b1220; color: #e2e8f0; border-radius: 8px;
    font-size: .72rem; line-height: 1.45; overflow-x: auto; white-space: pre; }
  ol { margin: .2rem 0; padding-left: 1.1rem; font-size: .78rem; }
  ol li { margin: .15rem 0; }
  .copy { margin-top: .35rem; font-size: .72rem; padding: .25rem .6rem; border: 1px solid #cbd5e1;
    border-radius: 6px; background: #fff; cursor: pointer; color: #0f172a; }
  .copy:hover { background: #f1f5f9; }
  .note { font-size: .7rem; color: #64748b; margin: .35rem 0 0; }
  .foot { display: flex; justify-content: space-between; align-items: center; gap: .5rem;
    padding: .5rem .6rem .3rem; border-top: 1px solid #e2e8f0; margin-top: .3rem; }
  .foot a { font-size: .74rem; color: var(--mcp-accent, #3098d8); text-decoration: none; }
  .muted { font-size: .68rem; color: #94a3b8; }
  .status { padding: .6rem; font-size: .8rem; color: #475569; }
`;

const ICON = `<svg width="14" height="14" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 10v26" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><path d="M18 26l14 14 14-14" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 52h36" stroke="currentColor" stroke-width="8" stroke-linecap="round"/></svg>`;

export class MCPInstallButtonElement extends HTMLElement {
  private root = this.attachShadow({ mode: 'open' });
  private open = false;
  private loaded = false;

  connectedCallback(): void {
    this.render();
    document.addEventListener('click', (e) => {
      if (this.open && !e.composedPath().includes(this)) this.toggle(false);
    });
  }

  private chooserHref(): string {
    const name = this.getAttribute('name');
    const server = this.getAttribute('server');
    const config = this.getAttribute('config');
    if (name) return `${SCRIPT_BASE}/?name=${encodeURIComponent(name)}`;
    if (server) return `${SCRIPT_BASE}/?server=${encodeURIComponent(server)}`;
    return `${SCRIPT_BASE}/?config=${config ?? ''}`;
  }

  private render(): void {
    const label = this.getAttribute('label') ?? 'Install MCP Server';
    this.applyColor();
    this.root.innerHTML = `
      <style>${STYLES}</style>
      <button class="btn" type="button" aria-haspopup="true" aria-expanded="false">${ICON}<span>${esc(label)}</span></button>
      <div class="panel" hidden></div>
    `;
    this.root.querySelector('.btn')!.addEventListener('click', () => this.toggle(!this.open));
  }

  // Map the `color` attribute onto the button/menu accent custom properties,
  // picking a readable text color and a slightly darker hover automatically.
  private applyColor(): void {
    const hex = normalizeHex(this.getAttribute('color'));
    if (!hex) {
      for (const p of ['--mcp-btn-bg', '--mcp-btn-bg-hover', '--mcp-btn-color', '--mcp-accent']) {
        this.style.removeProperty(p);
      }
      return;
    }
    this.style.setProperty('--mcp-btn-bg', hex);
    this.style.setProperty('--mcp-btn-bg-hover', darken(hex, 0.14));
    this.style.setProperty('--mcp-btn-color', textOn(hex));
    this.style.setProperty('--mcp-accent', hex);
  }

  private toggle(open: boolean): void {
    this.open = open;
    const panel = this.root.querySelector<HTMLElement>('.panel')!;
    panel.hidden = !open;
    this.root.querySelector('.btn')!.setAttribute('aria-expanded', String(open));
    if (open && !this.loaded) {
      this.loaded = true;
      panel.innerHTML = `<div class="status">Loading install options…</div>`;
      void this.populate(panel);
    }
  }

  private async populate(panel: HTMLElement): Promise<void> {
    try {
      const registryUrl = this.getAttribute('registry') ?? `${SCRIPT_BASE}/clients.json`;
      const params = new URLSearchParams();
      for (const key of ['name', 'server', 'config'] as const) {
        const v = this.getAttribute(key);
        if (v) params.set(key, v);
      }
      const [registry, resolved] = await Promise.all([
        fetch(registryUrl).then((r) => r.json()),
        resolveFromParams(params),
      ]);
      if (!resolved) {
        panel.innerHTML = `<div class="status">Could not load this server's definition.</div>`;
        return;
      }
      const filter = (this.getAttribute('clients') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
      let clients: ClientDef[] = registry.clients;
      if (filter.length) clients = clients.filter((c) => filter.includes(c.id));
      this.renderClients(panel, clients, resolved.def);
    } catch {
      panel.innerHTML = `<div class="status">Could not load install options — <a href="${esc(this.chooserHref())}">open the install page ↗</a></div>`;
    }
  }

  private renderClients(panel: HTMLElement, clients: ClientDef[], def: ServerDef): void {
    const os = detectOS();
    const groups: Record<string, string[]> = {};
    const details = new Map<string, InstallOption>();

    for (const client of clients) {
      const options = installOptions(client, def, os);
      if (!options.length) continue;
      const best = options[0];
      const id = `c-${client.id}`;
      let row: string;
      if (best.kind === 'link') {
        row = `<div class="row"><a class="head" href="${esc(best.href)}">${esc(client.name)}<span class="go">Add ↗</span></a></div>`;
      } else {
        details.set(id, best);
        row = `<div class="row"><button class="head" type="button" data-detail="${id}">${esc(client.name)}<span class="go">${best.kind === 'steps' ? 'How ▾' : 'Copy ▾'}</span></button><div class="detail" id="${id}" hidden></div></div>`;
      }
      (groups[client.category] ??= []).push(row);
    }

    const sections = (['deeplink', 'cli', 'config', 'connector'] as const)
      .filter((c) => groups[c]?.length)
      .map((c) => `<div class="group">${CATEGORY_LABELS[c]}</div>${groups[c].join('')}`)
      .join('');

    panel.innerHTML = `
      ${sections || `<div class="status">No compatible clients for this server definition.</div>`}
      <div class="foot">
        <a href="${esc(this.chooserHref())}" target="_blank" rel="noopener">All install options ↗</a>
        <span class="muted">API Commons</span>
      </div>
    `;

    panel.querySelectorAll<HTMLElement>('[data-detail]').forEach((head) => {
      head.addEventListener('click', () => {
        const el = panel.querySelector<HTMLElement>(`#${head.getAttribute('data-detail')}`)!;
        if (el.hidden) {
          const option = details.get(el.id)!;
          if (!el.innerHTML) el.innerHTML = renderDetail(option);
          const btn = el.querySelector<HTMLElement>('.copy');
          btn?.addEventListener('click', () => {
            void copyText(el.getAttribute('data-copy-text') ?? '', btn);
          });
        }
        el.hidden = !el.hidden;
      });
    });

    for (const [id, option] of details) {
      const el = panel.querySelector<HTMLElement>(`#${id}`);
      const text = option.kind === 'command' ? option.command : option.kind === 'snippet' ? option.code : option.kind === 'steps' ? (option.copy ?? '') : '';
      el?.setAttribute('data-copy-text', text);
    }
  }
}

function renderDetail(option: InstallOption): string {
  switch (option.kind) {
    case 'command':
      return `<pre>${esc(option.command)}</pre><button class="copy" type="button">Copy command</button>${note(option.note)}`;
    case 'snippet':
      return `${option.where ? `<p class="where">${esc(option.where)}</p>` : ''}<pre>${esc(option.code)}</pre><button class="copy" type="button">Copy snippet</button>${note(option.note)}`;
    case 'steps':
      return `<ol>${option.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>${option.copy ? `<button class="copy" type="button">Copy server URL</button>` : ''}${note(option.note)}`;
    default:
      return '';
  }
}

function note(text?: string): string {
  return text ? `<p class="note">${esc(text)}</p>` : '';
}

// Accept #rgb / #rrggbb (with or without the hash) → normalized #rrggbb, else undefined.
function normalizeHex(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const v = raw.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(v)) return '#' + v.split('').map((c) => c + c).join('').toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(v)) return '#' + v.toLowerCase();
  return undefined;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// White on dark colors, near-black on light ones (WCAG relative luminance).
function textOn(hex: string): string {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.42 ? '#0b1220' : '#ffffff';
}

function darken(hex: string, amount: number): string {
  const to = (c: number) => Math.max(0, Math.round(c * (1 - amount)));
  const [r, g, b] = rgb(hex).map(to);
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

if (!customElements.get('mcp-install-button')) {
  customElements.define('mcp-install-button', MCPInstallButtonElement);
}
