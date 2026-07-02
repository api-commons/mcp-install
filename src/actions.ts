// The engine: turn a (ClientDef, ServerDef) pair into concrete install
// options — deep links, shell commands, config snippets, or connector steps.
// Everything here is driven by the registry data in /clients.json; the only
// code-level knowledge is the small set of named deep-link builders and
// config snippet styles, documented in the README.

import type {
  ClientDef,
  CliSpec,
  ConfigSpec,
  InstallOption,
  PackageRun,
  RemoteEndpoint,
  ServerDef,
} from './types';
import { serverKey } from './types';

// ---------------------------------------------------------------- helpers

function b64(json: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(json))));
}

function shellArg(a: string): string {
  return /^[A-Za-z0-9@%_+=:,./-]+$/.test(a) ? a : `'${a.replace(/'/g, `'\\''`)}'`;
}

// A remote-only server can still reach stdio-only clients through the
// mcp-remote bridge; we synthesize the package for that case and label it.
export function bridgedPackage(remote: RemoteEndpoint): PackageRun {
  const args = ['-y', 'mcp-remote', remote.url];
  for (const [k, v] of Object.entries(remote.headers ?? {})) {
    args.push('--header', `${k}: ${v}`);
  }
  return { command: 'npx', args };
}

interface Resolved {
  remote?: RemoteEndpoint;
  pkg?: PackageRun;
  bridged: boolean;
}

// Pick what this client can actually run: its own transports vs what the
// server offers, bridging remote→stdio when that's the only path.
export function resolveFor(client: ClientDef, server: ServerDef): Resolved {
  const wantsRemote = client.transports.includes('http') || client.transports.includes('sse');
  const wantsStdio = client.transports.includes('stdio');
  const remote = wantsRemote && server.remote ? server.remote : undefined;
  let pkg = wantsStdio && server.package ? server.package : undefined;
  let bridged = false;
  if (!remote && !pkg && wantsStdio && server.remote) {
    pkg = bridgedPackage(server.remote);
    bridged = true;
  }
  return { remote, pkg, bridged };
}

// ---------------------------------------------------------- deep links

// Verified formats (see README for sources):
//   cursor:        https://cursor.com/en/install-mcp?name={n}&config={base64 json}
//   vscode:        https://vscode.dev/redirect/mcp/install?name={n}&config={uri json}
//   vscode-insiders: https://insiders.vscode.dev/redirect/mcp/install?...&quality=insiders
//   visual-studio: https://vs-open.link/mcp-install?{uri json incl. name}
//   lmstudio:      lmstudio://add_mcp?name={n}&config={base64 json}
//   goose:         goose://extension?cmd=..&arg=..&id=..&name=..&description=..
export function buildDeeplink(client: ClientDef, server: ServerDef): string | undefined {
  const { remote, pkg } = resolveFor(client, server);
  if (!remote && !pkg) return undefined;
  const name = server.name;
  const key = serverKey(server);

  switch (client.deeplink?.builder) {
    case 'cursor': {
      const config = remote
        ? { url: remote.url, ...(remote.headers ? { headers: remote.headers } : {}) }
        : { command: pkg!.command, args: pkg!.args, ...(pkg!.env ? { env: pkg!.env } : {}) };
      return `https://cursor.com/en/install-mcp?name=${encodeURIComponent(key)}&config=${encodeURIComponent(b64(config))}`;
    }
    case 'vscode':
    case 'vscode-insiders': {
      const config = remote
        ? { type: remote.type, url: remote.url, ...(remote.headers ? { headers: remote.headers } : {}) }
        : { type: 'stdio', command: pkg!.command, args: pkg!.args, ...(pkg!.env ? { env: pkg!.env } : {}) };
      const host = client.deeplink.builder === 'vscode-insiders' ? 'insiders.vscode.dev' : 'vscode.dev';
      const quality = client.deeplink.builder === 'vscode-insiders' ? '&quality=insiders' : '';
      return `https://${host}/redirect/mcp/install?name=${encodeURIComponent(key)}&config=${encodeURIComponent(JSON.stringify(config))}${quality}`;
    }
    case 'visual-studio': {
      const config = remote
        ? { name: key, type: remote.type, url: remote.url }
        : { name: key, type: 'stdio', command: pkg!.command, args: pkg!.args, ...(pkg!.env ? { env: pkg!.env } : {}) };
      return `https://vs-open.link/mcp-install?${encodeURIComponent(JSON.stringify(config))}`;
    }
    case 'lmstudio': {
      const config = remote
        ? { url: remote.url, ...(remote.headers ? { headers: remote.headers } : {}) }
        : { command: pkg!.command, args: pkg!.args, ...(pkg!.env ? { env: pkg!.env } : {}) };
      return `lmstudio://add_mcp?name=${encodeURIComponent(key)}&config=${encodeURIComponent(b64(config))}`;
    }
    case 'goose': {
      const common =
        `id=${encodeURIComponent(key)}&name=${encodeURIComponent(name)}` +
        `&description=${encodeURIComponent(server.description || name)}`;
      if (remote) {
        const type = remote.type === 'sse' ? 'sse' : 'streamable_http';
        return `goose://extension?url=${encodeURIComponent(remote.url)}&type=${type}&${common}`;
      }
      const args = pkg!.args.map((a) => `arg=${encodeURIComponent(a)}`).join('&');
      const env = Object.entries(pkg!.env ?? {})
        .map(([k, v]) => `&env=${encodeURIComponent(`${k}=${v}`)}`)
        .join('');
      return `goose://extension?cmd=${encodeURIComponent(pkg!.command)}${args ? '&' + args : ''}${env}&${common}&timeout=300`;
    }
    default:
      return undefined;
  }
}

// ---------------------------------------------------------- CLI commands

function expandFlags(template: string | undefined, map: Record<string, string> | undefined): string {
  if (!template || !map) return '';
  return Object.entries(map)
    .map(([key, value]) => template.replace('{key}', key).replace('{value}', value))
    .join('');
}

export function buildCli(spec: CliSpec, client: ClientDef, server: ServerDef): { command: string; note?: string } | undefined {
  const { remote, pkg, bridged } = resolveFor(client, server);
  const key = serverKey(server);

  if (remote && (spec.http || spec.sse)) {
    const template = (remote.type === 'sse' ? spec.sse : spec.http) || spec.http || spec.sse!;
    const command = template
      .replace('{name}', key)
      .replace('{url}', remote.url)
      .replace('{headerFlags}', expandFlags(spec.headerFlag, remote.headers))
      .replace('{jsonWithName}', JSON.stringify({ name: key, type: remote.type, url: remote.url, ...(remote.headers ? { headers: remote.headers } : {}) }));
    return { command, note: spec.note };
  }
  if (pkg && spec.stdio) {
    const command = spec.stdio
      .replace('{name}', key)
      .replace('{command}', pkg.command)
      .replace('{args}', pkg.args.map(shellArg).join(' '))
      .replace('{envFlags}', expandFlags(spec.envFlag, pkg.env))
      .replace('{jsonWithName}', JSON.stringify({ name: key, command: pkg.command, args: pkg.args, ...(pkg.env ? { env: pkg.env } : {}) }));
    return {
      command,
      note: bridged ? withBridgeNote(spec.note) : spec.note,
    };
  }
  return undefined;
}

function withBridgeNote(note?: string): string {
  const bridge = 'Uses the mcp-remote bridge — this client speaks stdio, so the hosted endpoint is proxied locally.';
  return note ? `${bridge} ${note}` : bridge;
}

// ---------------------------------------------------------- config snippets

function jsonBlock(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

function tomlString(v: string): string {
  return `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function buildConfigSnippet(
  spec: ConfigSpec,
  client: ClientDef,
  server: ServerDef
): { code: string; lang: string; bridged: boolean } | undefined {
  const { remote, pkg, bridged } = resolveFor(client, server);
  if (!remote && !pkg) return undefined;
  const key = serverKey(server);
  const style = spec.style ?? 'default';

  if (style === 'continue') {
    const lines = ['mcpServers:', `  - name: ${server.name}`];
    if (remote) {
      lines.push(`    type: ${remote.type === 'sse' ? 'sse' : 'streamable-http'}`, `    url: ${remote.url}`);
      for (const [k, v] of Object.entries(remote.headers ?? {})) {
        if (lines.indexOf('    requestOptions:') === -1) lines.push('    requestOptions:', '      headers:');
        lines.push(`        ${k}: ${v}`);
      }
    } else {
      lines.push(`    command: ${pkg!.command}`, '    args:');
      for (const a of pkg!.args) lines.push(`      - "${a.replace(/"/g, '\\"')}"`);
      const env = Object.entries(pkg!.env ?? {});
      if (env.length) {
        lines.push('    env:');
        for (const [k, v] of env) lines.push(`      ${k}: "${v}"`);
      }
    }
    return { code: lines.join('\n'), lang: 'yaml', bridged };
  }

  if (style === 'toml') {
    const root = spec.rootKey ?? 'mcp_servers';
    const lines = [`[${root}.${key}]`];
    if (pkg) {
      lines.push(`command = ${tomlString(pkg.command)}`);
      lines.push(`args = [${pkg.args.map(tomlString).join(', ')}]`);
      const env = Object.entries(pkg.env ?? {});
      if (env.length) {
        lines.push('', `[${root}.${key}.env]`);
        for (const [k, v] of env) lines.push(`${k} = ${tomlString(v)}`);
      }
    } else if (remote) {
      lines.push(`url = ${tomlString(remote.url)}`);
    }
    return { code: lines.join('\n'), lang: 'toml', bridged };
  }

  if (style === 'zed') {
    const entry = pkg
      ? { source: 'custom', command: pkg.command, args: pkg.args, env: pkg.env ?? {} }
      : { source: 'custom', command: 'npx', args: ['-y', 'mcp-remote', remote!.url], env: {} };
    return { code: jsonBlock({ [spec.rootKey ?? 'context_servers']: { [key]: entry } }), lang: 'json', bridged: bridged || !pkg };
  }

  if (style === 'opencode') {
    const entry = remote
      ? { type: 'remote', url: remote.url, enabled: true, ...(remote.headers ? { headers: remote.headers } : {}) }
      : { type: 'local', command: [pkg!.command, ...pkg!.args], enabled: true, ...(pkg!.env ? { environment: pkg!.env } : {}) };
    return { code: jsonBlock({ [spec.rootKey ?? 'mcp']: { [key]: entry } }), lang: 'json', bridged };
  }

  if (style === 'vscode') {
    const entry = remote
      ? { type: remote.type, url: remote.url, ...(remote.headers ? { headers: remote.headers } : {}) }
      : { type: 'stdio', command: pkg!.command, args: pkg!.args, ...(pkg!.env ? { env: pkg!.env } : {}) };
    return { code: jsonBlock({ [spec.rootKey ?? 'servers']: { [key]: entry } }), lang: 'json', bridged };
  }

  // default: the common mcpServers shape
  const urlKey = spec.urlKey ?? 'url';
  const entry = remote
    ? { [urlKey]: remote.url, ...(remote.headers ? { headers: remote.headers } : {}) }
    : { command: pkg!.command, args: pkg!.args, ...(pkg!.env ? { env: pkg!.env } : {}) };
  return { code: jsonBlock({ [spec.rootKey ?? 'mcpServers']: { [key]: entry } }), lang: 'json', bridged };
}

// ---------------------------------------------------------- assembly

export type OS = 'mac' | 'windows' | 'linux';

export function detectOS(): OS {
  const p = (navigator.platform || navigator.userAgent).toLowerCase();
  if (p.includes('win')) return 'windows';
  if (p.includes('linux') || p.includes('x11')) return 'linux';
  return 'mac';
}

export function configPath(spec: ConfigSpec, os: OS): string | undefined {
  return spec.paths?.[os] ?? spec.paths?.mac ?? spec.paths?.windows ?? spec.paths?.linux;
}

// All install options this client offers for this server, best first.
export function installOptions(client: ClientDef, server: ServerDef, os: OS): InstallOption[] {
  const options: InstallOption[] = [];
  const { remote, pkg, bridged } = resolveFor(client, server);

  if (client.deeplink) {
    const href = buildDeeplink(client, server);
    if (href) {
      options.push({ kind: 'link', label: `Add to ${client.name}`, href, note: client.deeplink.note });
    }
  }

  if (client.cli) {
    const cli = buildCli(client.cli, client, server);
    if (cli) options.push({ kind: 'command', label: 'Run in a terminal', command: cli.command, note: cli.note });
  }

  if (client.config) {
    const snippet = buildConfigSnippet(client.config, client, server);
    if (snippet) {
      const where = configPath(client.config, os) ?? client.config.location;
      options.push({
        kind: 'snippet',
        label: where ? `Add to ${where}` : `Add to ${client.name} config`,
        code: snippet.code,
        lang: snippet.lang,
        where,
        steps: client.config.steps,
        note: snippet.bridged ? withBridgeNote(client.config.note) : client.config.note,
      });
    }
  }

  if (client.connector) {
    const needsRemote = (client.connector.requires ?? 'remote') === 'remote';
    if (!needsRemote || server.remote) {
      options.push({
        kind: 'steps',
        label: `Connect in ${client.name}`,
        steps: client.connector.steps,
        copy: server.remote?.url,
        note: client.connector.note,
      });
    }
  }

  void remote;
  void pkg;
  void bridged;
  return options;
}

// Why a client has no options — shown instead of silently hiding it.
export function incompatibilityReason(client: ClientDef, server: ServerDef): string | undefined {
  if (installOptions(client, server, 'mac').length > 0) return undefined;
  if (client.connector && !server.remote && (client.connector.requires ?? 'remote') === 'remote') {
    return 'Needs a hosted (http/sse) endpoint — this server only ships as a local package.';
  }
  if (!server.package && !server.remote) return 'No package or endpoint defined yet.';
  return 'No compatible transport between this client and server.';
}
