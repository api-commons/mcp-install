// The generator view — where a provider configures their server once and
// copies out the button in every format: hosted link, markdown, HTML, the
// web component, and per-client deep-link badges. The live preview is the
// real <mcp-install-button> component.

import type { ServerDef } from './types';
import { encodeServerDef } from './types';
import { loadClients } from './clients';
import { parseServerJson, MCP_REGISTRY_API } from './server-def';
import { badgeRow, chooserUrl, htmlButton, markdownButton, webComponentSnippet, type ButtonSource } from './embeds';
import { esc, wireCopyButtons } from './util';

export function renderGenerator(app: HTMLElement): void {
  app.innerHTML = `
    <section class="intro">
      <h1>One button. Every MCP client.</h1>
      <p>The <strong>Install MCP Server</strong> button is the “Run in Postman” button for MCP — one link that installs your
      server in every major and niche client: one-click deep links where they exist, ready-to-run CLI commands and config
      snippets everywhere else, driven by an open <a href="/clients.json">machine-readable registry of client install methods</a>.</p>
    </section>

    <div class="gen-layout">
      <section class="pane">
        <h2>1 · Define your server</h2>

        <details class="import-box">
          <summary>Import from the MCP Registry or a server.json</summary>
          <div class="import-body">
            <div class="field-row">
              <input id="imp-name" placeholder="Registry name — e.g. io.github.acme/acme-mcp" autocomplete="off" />
              <button id="imp-lookup" type="button">Look up</button>
            </div>
            <div class="field-row">
              <input id="imp-url" type="url" placeholder="URL of a server.json" autocomplete="off" />
              <button id="imp-fetch" type="button">Fetch</button>
            </div>
            <textarea id="imp-paste" rows="4" placeholder="…or paste server.json here"></textarea>
            <button id="imp-parse" type="button">Parse pasted JSON</button>
            <p id="imp-status" class="muted small"></p>
          </div>
        </details>

        <label class="field"><span>Server name</span>
          <input id="f-name" placeholder="Acme MCP" autocomplete="off" /></label>
        <label class="field"><span>Description</span>
          <input id="f-desc" placeholder="What agents can do with it" autocomplete="off" /></label>

        <fieldset>
          <legend>Hosted endpoint <span class="muted">(remote clients — Claude, ChatGPT, Cursor…)</span></legend>
          <div class="field-row">
            <select id="f-remote-type"><option value="http">Streamable HTTP</option><option value="sse">SSE</option></select>
            <input id="f-remote-url" type="url" placeholder="https://mcp.example.com/mcp" autocomplete="off" />
          </div>
          <label class="field"><span>Headers <span class="muted">one per line, Key: Value — no real secrets, use placeholders</span></span>
            <textarea id="f-remote-headers" rows="2" placeholder="Authorization: Bearer &lt;YOUR_TOKEN&gt;"></textarea></label>
        </fieldset>

        <fieldset>
          <legend>Local package <span class="muted">(stdio clients — run on the user’s machine)</span></legend>
          <div class="field-row">
            <input id="f-command" placeholder="Command — npx, uvx, docker…" autocomplete="off" />
            <input id="f-args" placeholder="Args — e.g. -y @acme/mcp-server" autocomplete="off" />
          </div>
          <label class="field"><span>Environment variables <span class="muted">one per line, KEY=&lt;placeholder&gt;</span></span>
            <textarea id="f-env" rows="2" placeholder="ACME_API_KEY=&lt;YOUR_KEY&gt;"></textarea></label>
        </fieldset>

        <fieldset>
          <legend>What the button carries</legend>
          <label class="radio"><input type="radio" name="carry" value="config" checked />
            <span>Inline config — self-contained link, works with just this form</span></label>
          <label class="radio"><input type="radio" name="carry" value="name" id="carry-name" disabled />
            <span>MCP Registry name — canonical; installs stay current as you publish</span></label>
          <label class="radio"><input type="radio" name="carry" value="server" id="carry-server" disabled />
            <span>server.json URL — canonical; you host the manifest</span></label>
        </fieldset>
      </section>

      <section class="pane">
        <h2>2 · Take your button</h2>
        <div class="preview-box">
          <div class="opt-label">Live preview — this is the real embeddable component</div>
          <div id="preview"></div>
        </div>
        <div id="embeds"></div>
      </section>
    </div>
  `;

  const $ = <T extends HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
  const inputs = app.querySelectorAll<HTMLElement>('input, textarea, select');

  const state: { registryName?: string; serverJsonUrl?: string } = {};

  const readDef = (): ServerDef | undefined => {
    const name = $<HTMLInputElement>('#f-name').value.trim();
    if (!name) return undefined;
    const def: ServerDef = { name };
    const desc = $<HTMLInputElement>('#f-desc').value.trim();
    if (desc) def.description = desc;

    const url = $<HTMLInputElement>('#f-remote-url').value.trim();
    if (url) {
      const headers = parseKV($<HTMLTextAreaElement>('#f-remote-headers').value, ':');
      def.remote = {
        type: $<HTMLSelectElement>('#f-remote-type').value as 'http' | 'sse',
        url,
        ...(headers ? { headers } : {}),
      };
    }
    const command = $<HTMLInputElement>('#f-command').value.trim();
    if (command) {
      const env = parseKV($<HTMLTextAreaElement>('#f-env').value, '=');
      def.package = {
        command,
        args: splitArgs($<HTMLInputElement>('#f-args').value),
        ...(env ? { env } : {}),
      };
    }
    if (!def.remote && !def.package) return undefined;
    return def;
  };

  const update = async () => {
    const def = readDef();
    const preview = $('#preview');
    const embeds = $('#embeds');
    if (!def) {
      preview.innerHTML = `<p class="muted">Name your server and give it an endpoint or a package to see the button.</p>`;
      embeds.innerHTML = '';
      return;
    }
    const carry = (app.querySelector<HTMLInputElement>('input[name=carry]:checked')?.value ?? 'config') as 'config' | 'name' | 'server';
    const src: ButtonSource = {
      def,
      registryName: carry === 'name' ? state.registryName : undefined,
      serverJsonUrl: carry === 'server' ? state.serverJsonUrl : undefined,
    };

    // Rebuild the component so it re-resolves the fresh config.
    preview.innerHTML = '';
    const el = document.createElement('mcp-install-button');
    el.setAttribute('config', encodeServerDef(def));
    el.setAttribute('registry', `${location.origin}/clients.json`);
    preview.appendChild(el);

    const { clients } = await loadClients();
    const url = chooserUrl(src).replace('https://install.apicommons.org', location.origin === 'null' ? 'https://install.apicommons.org' : location.origin);
    embeds.innerHTML = [
      embedBlock('Button link', 'Anywhere a URL works — docs, READMEs, emails.', url),
      embedBlock('Markdown', 'READMEs and docs sites.', markdownButton(src)),
      embedBlock('HTML', 'Landing pages and developer portals.', htmlButton(src)),
      embedBlock('Web component', 'The dynamic in-page button with the client picker, as previewed.', webComponentSnippet(src)),
      embedBlock('Per-client badges', 'Deep-link badges for the clients that support one-click install.', badgeRow(clients, def)),
    ].join('');
    wireCopyButtons(embeds);
  };

  inputs.forEach((el) => el.addEventListener('input', () => void update()));
  app.querySelectorAll<HTMLInputElement>('input[name=carry]').forEach((el) => el.addEventListener('change', () => void update()));

  // ------------------------------------------------------------ imports
  const status = $<HTMLElement>('#imp-status');
  const applyServerJson = (raw: unknown, from: string): void => {
    const def = parseServerJson(raw);
    if (!def) {
      status.textContent = `Could not read a server definition from ${from}.`;
      return;
    }
    $<HTMLInputElement>('#f-name').value = def.name;
    $<HTMLInputElement>('#f-desc').value = def.description ?? '';
    $<HTMLInputElement>('#f-remote-url').value = def.remote?.url ?? '';
    $<HTMLSelectElement>('#f-remote-type').value = def.remote?.type ?? 'http';
    $<HTMLTextAreaElement>('#f-remote-headers').value = joinKV(def.remote?.headers, ': ');
    $<HTMLInputElement>('#f-command').value = def.package?.command ?? '';
    $<HTMLInputElement>('#f-args').value = (def.package?.args ?? []).map(quoteArg).join(' ');
    $<HTMLTextAreaElement>('#f-env').value = joinKV(def.package?.env, '=');
    status.textContent = `Imported from ${from}. Review the fields — placeholders may need editing.`;
    void update();
  };

  $('#imp-lookup').addEventListener('click', async () => {
    const name = $<HTMLInputElement>('#imp-name').value.trim();
    if (!name) return;
    status.textContent = 'Searching the MCP Registry…';
    try {
      const res = await fetch(`${MCP_REGISTRY_API}?search=${encodeURIComponent(name)}&limit=10`);
      const body = await res.json();
      const entries: any[] = body.servers ?? body.data ?? [];
      const unwrap = (e: any) => e.server ?? e;
      const hit = entries.find((e) => unwrap(e).name === name) ?? entries[0];
      if (!hit) {
        status.textContent = 'No registry entry found for that name.';
        return;
      }
      state.registryName = unwrap(hit).name;
      $<HTMLInputElement>('#carry-name').disabled = false;
      $<HTMLInputElement>('#carry-name').checked = true;
      applyServerJson(unwrap(hit), `the MCP Registry (${state.registryName})`);
    } catch {
      status.textContent = 'Registry lookup failed — check the name or try the server.json URL.';
    }
  });

  $('#imp-fetch').addEventListener('click', async () => {
    const url = $<HTMLInputElement>('#imp-url').value.trim();
    if (!url) return;
    status.textContent = 'Fetching server.json…';
    try {
      const res = await fetch(url);
      state.serverJsonUrl = url;
      $<HTMLInputElement>('#carry-server').disabled = false;
      $<HTMLInputElement>('#carry-server').checked = true;
      applyServerJson(await res.json(), url);
    } catch {
      status.textContent = 'Fetch failed — the file may not allow cross-origin requests. Paste it instead.';
    }
  });

  $('#imp-parse').addEventListener('click', () => {
    try {
      applyServerJson(JSON.parse($<HTMLTextAreaElement>('#imp-paste').value), 'pasted JSON');
    } catch {
      status.textContent = 'That isn’t valid JSON.';
    }
  });

  void update();
}

function embedBlock(title: string, blurb: string, code: string): string {
  const id = `embed-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return `
    <div class="embed">
      <div class="embed-head"><strong>${esc(title)}</strong><span class="muted small">${esc(blurb)}</span>
        <button class="copy-btn" type="button" data-copy="#${id}">Copy</button></div>
      <pre id="${id}"><code>${esc(code)}</code></pre>
    </div>`;
}

function parseKV(text: string, sep: ':' | '='): Record<string, string> | undefined {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const i = line.indexOf(sep);
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return Object.keys(out).length ? out : undefined;
}

function joinKV(map: Record<string, string> | undefined, sep: string): string {
  return Object.entries(map ?? {})
    .map(([k, v]) => `${k}${sep}${v}`)
    .join('\n');
}

function splitArgs(raw: string): string[] {
  const args: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) args.push(m[1] ?? m[2] ?? m[3]);
  return args;
}

function quoteArg(a: string): string {
  return /\s/.test(a) ? `"${a}"` : a;
}
