// Shared shapes: the normalized server definition every install option is
// rendered from, and the client registry entries loaded from /clients.json.

export type Transport = 'stdio' | 'http' | 'sse';

export interface RemoteEndpoint {
  type: 'http' | 'sse';
  url: string;
  headers?: Record<string, string>;
}

export interface PackageRun {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// A server can offer a hosted endpoint, a runnable package, or both — each
// client picks whichever it supports.
export interface ServerDef {
  name: string;
  description?: string;
  remote?: RemoteEndpoint;
  package?: PackageRun;
}

export type ClientCategory = 'deeplink' | 'cli' | 'config' | 'connector';

export type DeeplinkBuilder =
  | 'cursor'
  | 'vscode'
  | 'vscode-insiders'
  | 'visual-studio'
  | 'lmstudio'
  | 'goose';

export interface DeeplinkSpec {
  builder: DeeplinkBuilder;
  note?: string;
}

export interface CliSpec {
  stdio?: string;
  http?: string;
  sse?: string;
  envFlag?: string;
  headerFlag?: string;
  note?: string;
}

export type ConfigStyle = 'default' | 'vscode' | 'zed' | 'continue' | 'toml' | 'opencode';

export interface ConfigSpec {
  format: 'json' | 'yaml' | 'toml';
  rootKey?: string;
  style?: ConfigStyle;
  urlKey?: string;
  paths?: { mac?: string; windows?: string; linux?: string };
  location?: string;
  steps?: string[];
  note?: string;
}

export interface ConnectorSpec {
  requires?: 'remote' | 'any';
  steps: string[];
  note?: string;
}

export interface ClientDef {
  id: string;
  name: string;
  maker?: string;
  category: ClientCategory;
  transports: Transport[];
  platforms?: string[];
  website?: string;
  docs?: string;
  deeplink?: DeeplinkSpec;
  cli?: CliSpec;
  config?: ConfigSpec;
  connector?: ConnectorSpec;
  notes?: string;
}

export interface ClientRegistry {
  name: string;
  description?: string;
  version: string;
  clients: ClientDef[];
}

// One renderable install affordance for a (client, server) pair.
export type InstallOption =
  | { kind: 'link'; label: string; href: string; note?: string }
  | { kind: 'command'; label: string; command: string; note?: string }
  | { kind: 'snippet'; label: string; code: string; lang: string; where?: string; steps?: string[]; note?: string }
  | { kind: 'steps'; label: string; steps: string[]; copy?: string; note?: string };

// The chooser/widget URL carries the ServerDef base64url-encoded in ?config=.
export function encodeServerDef(def: ServerDef): string {
  const json = JSON.stringify(def);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeServerDef(encoded: string): ServerDef {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as ServerDef;
}

// Key used inside config files — a filesystem/JSON-safe slug of the name.
export function serverKey(def: ServerDef): string {
  return (
    def.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'mcp-server'
  );
}
