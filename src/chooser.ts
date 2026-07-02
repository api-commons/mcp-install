// The chooser view — what the Install MCP Server button opens. Resolves the
// server definition from the URL, then renders every client's install path:
// one-click deep links, CLI commands, config snippets with per-OS paths, and
// web connector walkthroughs.

import type { ClientDef, InstallOption, ServerDef } from './types';
import { detectOS, installOptions, incompatibilityReason, type OS } from './actions';
import { loadClients } from './clients';
import { resolveFromParams, type ResolvedSource } from './server-def';
import { esc, wireCopyButtons } from './util';

const CATEGORY_META: Record<string, { title: string; blurb: string }> = {
  deeplink: { title: 'One-click install', blurb: 'These clients accept a deep link — click and confirm in the app.' },
  cli: { title: 'Command line', blurb: 'Copy one command into a terminal.' },
  config: { title: 'Config file', blurb: 'Paste a snippet into the client’s MCP config.' },
  connector: { title: 'Web connectors', blurb: 'Attach the hosted endpoint in the client’s settings.' },
};

export async function renderChooser(app: HTMLElement, params: URLSearchParams): Promise<void> {
  app.innerHTML = `<div class="loading">Resolving server definition…</div>`;

  let resolved: ResolvedSource | undefined;
  let error: string | undefined;
  try {
    resolved = await resolveFromParams(params);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  if (!resolved) {
    app.innerHTML = `
      <div class="empty">
        <h2>Couldn’t load that server</h2>
        <p>${error ? esc(error) : 'The link is missing a valid <code>?name=</code>, <code>?server=</code>, or <code>?config=</code> parameter.'}</p>
        <p><a href="/">Build a button instead →</a></p>
      </div>`;
    return;
  }

  const registry = await loadClients();
  const def = resolved.def;
  let os = detectOS();
  let query = '';

  const draw = () => {
    app.innerHTML = renderPage(registry.clients, def, resolved!, os, query);
    wireCopyButtons(app);
    app.querySelectorAll<HTMLButtonElement>('[data-os]').forEach((btn) =>
      btn.addEventListener('click', () => {
        os = btn.dataset.os as OS;
        draw();
      })
    );
    const search = app.querySelector<HTMLInputElement>('#client-filter');
    search?.addEventListener('input', () => {
      query = search.value;
      redrawList();
    });
    if (query) {
      search!.value = query;
      search!.focus();
      search!.setSelectionRange(query.length, query.length);
    }
  };

  const redrawList = () => {
    const list = app.querySelector<HTMLElement>('#client-list');
    if (list) {
      list.innerHTML = renderSections(registry.clients, def, os, query);
      wireCopyButtons(list);
    }
  };

  draw();
}

function renderPage(clients: ClientDef[], def: ServerDef, resolved: ResolvedSource, os: OS, query: string): string {
  const transports = [
    def.remote ? `remote (${def.remote.type})` : null,
    def.package ? `local package (${def.package.command})` : null,
  ].filter(Boolean).join(' + ');
  const sourceLabel =
    resolved.source === 'registry' ? 'MCP Registry' : resolved.source === 'server.json' ? 'server.json' : 'inline config';

  return `
    <section class="server-head">
      <div>
        <h1>${esc(def.name)}</h1>
        ${def.description ? `<p class="desc">${esc(def.description)}</p>` : ''}
        <p class="meta">
          <span class="chip">${esc(transports)}</span>
          <span class="chip chip-src" title="${resolved.sourceUrl ? esc(resolved.sourceUrl) : ''}">from ${sourceLabel}</span>
        </p>
      </div>
      <div class="head-controls">
        <div class="os-toggle" role="group" aria-label="Operating system">
          ${(['mac', 'windows', 'linux'] as OS[])
            .map((o) => `<button type="button" data-os="${o}" class="${o === os ? 'active' : ''}">${o === 'mac' ? 'macOS' : o === 'windows' ? 'Windows' : 'Linux'}</button>`)
            .join('')}
        </div>
        <input id="client-filter" type="search" placeholder="Filter clients…" autocomplete="off" />
      </div>
    </section>
    <p class="trust-note">Review what you install: the commands and configs below are generated from the server definition above — nothing runs from this page. Keep secrets out of links; use env vars and OAuth.</p>
    <div id="client-list">${renderSections(clients, def, os, query)}</div>
  `;
}

function renderSections(clients: ClientDef[], def: ServerDef, os: OS, query: string): string {
  const q = query.trim().toLowerCase();
  const visible = q ? clients.filter((c) => (c.name + ' ' + (c.maker ?? '') + ' ' + c.id).toLowerCase().includes(q)) : clients;

  const sections: string[] = [];
  for (const category of ['deeplink', 'cli', 'config', 'connector'] as const) {
    const group = visible.filter((c) => c.category === category);
    if (!group.length) continue;
    const cards = group.map((c) => renderClientCard(c, def, os)).join('');
    const meta = CATEGORY_META[category];
    sections.push(`
      <section class="category">
        <h2>${meta.title}</h2>
        <p class="cat-blurb">${meta.blurb}</p>
        <div class="cards">${cards}</div>
      </section>`);
  }
  return sections.join('') || `<p class="empty">No clients match “${esc(query)}”.</p>`;
}

let uid = 0;

function renderClientCard(client: ClientDef, def: ServerDef, os: OS): string {
  const options = installOptions(client, def, os);
  const head = `
    <header>
      <h3>${esc(client.name)}</h3>
      ${client.maker ? `<span class="maker">${esc(client.maker)}</span>` : ''}
      ${client.docs ? `<a class="docs" href="${esc(client.docs)}" target="_blank" rel="noopener" title="MCP docs for ${esc(client.name)}">docs ↗</a>` : ''}
    </header>`;

  if (!options.length) {
    const reason = incompatibilityReason(client, def);
    return `<article class="card card-off">${head}<p class="off-reason">${esc(reason ?? 'Not compatible.')}</p></article>`;
  }
  return `<article class="card">${head}${options.map((o) => renderOption(o)).join('')}</article>`;
}

function renderOption(option: InstallOption): string {
  const id = `opt-${++uid}`;
  switch (option.kind) {
    case 'link':
      return `
        <div class="opt">
          <a class="btn-install" href="${esc(option.href)}">${esc(option.label)} →</a>
          ${noteHtml(option.note)}
        </div>`;
    case 'command':
      return `
        <div class="opt">
          <div class="opt-label">${esc(option.label)}</div>
          <pre id="${id}"><code>${esc(option.command)}</code></pre>
          <button class="copy-btn" type="button" data-copy="#${id}">Copy command</button>
          ${noteHtml(option.note)}
        </div>`;
    case 'snippet':
      return `
        <div class="opt">
          <div class="opt-label">${option.where ? `Merge into <code>${esc(option.where)}</code>` : esc(option.label)}</div>
          <pre id="${id}"><code>${esc(option.code)}</code></pre>
          <button class="copy-btn" type="button" data-copy="#${id}">Copy snippet</button>
          ${option.steps?.length ? `<ul class="steps">${option.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
          ${noteHtml(option.note)}
        </div>`;
    case 'steps':
      return `
        <div class="opt">
          <div class="opt-label">${esc(option.label)}</div>
          <ol class="steps">${option.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
          ${option.copy ? `<pre id="${id}"><code>${esc(option.copy)}</code></pre><button class="copy-btn" type="button" data-copy="#${id}">Copy server URL</button>` : ''}
          ${noteHtml(option.note)}
        </div>`;
  }
}

function noteHtml(note?: string): string {
  return note ? `<p class="opt-note">${esc(note)}</p>` : '';
}
