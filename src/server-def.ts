// Resolve a ServerDef from wherever the button carries it:
//   ?config=<base64url ServerDef>   — self-contained, made by the generator
//   ?server=<url to server.json>    — fetched and normalized (official MCP registry format)
//   ?name=<registry name>           — looked up in the official MCP Registry
// Precedence: name > server > config (a canonical pointer beats an inline copy).

import type { RemoteEndpoint, ServerDef } from './types';
import { decodeServerDef } from './types';

export const MCP_REGISTRY_API = 'https://registry.modelcontextprotocol.io/v0/servers';

export interface ResolvedSource {
  def: ServerDef;
  source: 'config' | 'server.json' | 'registry';
  sourceUrl?: string;
}

export async function resolveFromParams(params: URLSearchParams): Promise<ResolvedSource | undefined> {
  const name = params.get('name');
  if (name) {
    const def = await lookupRegistry(name);
    if (def) return { def, source: 'registry', sourceUrl: `${MCP_REGISTRY_API}?search=${encodeURIComponent(name)}` };
  }
  const serverUrl = params.get('server');
  if (serverUrl) {
    const res = await fetch(serverUrl);
    if (res.ok) {
      const def = parseServerJson(await res.json());
      if (def) return { def, source: 'server.json', sourceUrl: serverUrl };
    }
  }
  const config = params.get('config');
  if (config) {
    try {
      return { def: decodeServerDef(config), source: 'config' };
    } catch {
      /* fall through */
    }
  }
  return undefined;
}

async function lookupRegistry(name: string): Promise<ServerDef | undefined> {
  const res = await fetch(`${MCP_REGISTRY_API}?search=${encodeURIComponent(name)}&limit=10`);
  if (!res.ok) return undefined;
  const body = await res.json();
  const entries: any[] = body.servers ?? body.data ?? (Array.isArray(body) ? body : []);
  if (!entries.length) return undefined;
  const unwrap = (e: any) => e.server ?? e;
  const exact = entries.find((e) => unwrap(e).name === name);
  return parseServerJson(unwrap(exact ?? entries[0]));
}

// Tolerant normalization of the official registry's server.json — field names
// have shifted across schema versions, so read every spelling we know of.
export function parseServerJson(sj: any): ServerDef | undefined {
  if (!sj || typeof sj !== 'object') return undefined;
  const rawName: string = sj.name ?? sj.id ?? 'mcp-server';
  const def: ServerDef = {
    name: rawName.includes('/') ? rawName.split('/').pop()! : rawName,
    description: sj.description,
  };

  const remotes: any[] = sj.remotes ?? [];
  if (remotes.length) {
    const r = remotes[0];
    const t = String(r.transport_type ?? r.transportType ?? r.type ?? 'http').toLowerCase();
    const remote: RemoteEndpoint = {
      type: t.includes('sse') ? 'sse' : 'http',
      url: r.url,
    };
    const headers: Record<string, string> = {};
    for (const h of r.headers ?? []) {
      if (h?.name) headers[h.name] = h.value ?? h.default ?? `<${h.description ?? h.name}>`;
    }
    if (Object.keys(headers).length) remote.headers = headers;
    if (remote.url) def.remote = remote;
  }

  const packages: any[] = sj.packages ?? [];
  if (packages.length) {
    const p = packages[0];
    const registry = String(p.registry_type ?? p.registryType ?? p.registry_name ?? p.registryName ?? '').toLowerCase();
    const identifier = p.identifier ?? p.name ?? p.package;
    const version = p.version && p.version !== 'latest' ? `@${p.version}` : '';
    const runtimeArgs = argList(p.runtime_arguments ?? p.runtimeArguments);
    const packageArgs = argList(p.package_arguments ?? p.packageArguments);

    let command = p.runtime_hint ?? p.runtimeHint;
    let args: string[] = [];
    if (registry === 'npm' || (!registry && (command === 'npx' || !command))) {
      command = command || 'npx';
      args = command === 'npx' ? [...runtimeArgs.filter((a) => a !== '-y'), '-y', `${identifier}${version}`] : [...runtimeArgs, identifier];
    } else if (registry === 'pypi') {
      command = command || 'uvx';
      args = [...runtimeArgs, `${identifier}${version.replace('@', '==')}`];
    } else if (registry === 'oci' || command === 'docker') {
      command = command || 'docker';
      args = args.length ? args : ['run', '-i', '--rm', ...runtimeArgs, identifier];
    } else if (registry === 'nuget') {
      command = command || 'dnx';
      args = [...runtimeArgs, `${identifier}${version}`, '--yes'];
    } else {
      command = command || identifier;
      args = [...runtimeArgs];
    }
    args = [...args, ...packageArgs];

    const env: Record<string, string> = {};
    for (const v of p.environment_variables ?? p.environmentVariables ?? []) {
      if (v?.name) env[v.name] = v.value ?? v.default ?? `<${v.description ?? v.name}>`;
    }
    if (command) {
      def.package = { command, args, ...(Object.keys(env).length ? { env } : {}) };
    }
  }

  if (!def.remote && !def.package) return undefined;
  return def;
}

function argList(raw: any[] | undefined): string[] {
  const out: string[] = [];
  for (const a of raw ?? []) {
    if (typeof a === 'string') out.push(a);
    else if (a?.type === 'named' && a.name) {
      out.push(a.name);
      if (a.value ?? a.default) out.push(String(a.value ?? a.default));
    } else if (a?.value ?? a?.default) out.push(String(a.value ?? a.default));
  }
  return out;
}
