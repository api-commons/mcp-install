# MCP Install

**The universal install button for MCP servers — one button, every client.**
Live at [install.apicommons.org](https://install.apicommons.org). An [API Commons](https://apicommons.org) tool.

The "Run in Postman" button, for MCP. A provider configures their server once and gets a single button that installs it in every major and niche MCP client — one-click deep links where clients support them (Cursor, VS Code, Visual Studio, LM Studio, Goose), ready-to-run CLI commands (Claude Code, Gemini CLI, Codex CLI), per-OS config snippets (Claude Desktop, Windsurf, Zed, Cline, Continue, Warp, Kiro, and more), and web connector walkthroughs (Claude, ChatGPT, Copilot coding agent).

## The pieces

### 1. The open client install registry — [`/clients.json`](https://install.apicommons.org/clients.json)

The load-bearing artifact: a machine-readable registry of **how every MCP client installs a server** — deep-link builders, CLI command templates, config file paths per OS, root keys and snippet shapes, connector steps. Validated by [`/clients.schema.json`](https://install.apicommons.org/clients.schema.json).

Anyone can build on it — badge generators, docs sites, directories, CLIs. Adding a client is (almost always) a pure data PR to [`public/clients.json`](public/clients.json). No code change unless the client invented a genuinely new mechanism.

### 2. The hosted chooser — `install.apicommons.org/?…`

What the button links to. Resolves the server definition, detects the visitor's OS, and renders every client's install path. Three ways to carry the server:

| Parameter | Carries | Use when |
|---|---|---|
| `?name=io.github.acme/acme-mcp` | Official [MCP Registry](https://modelcontextprotocol.io/registry/about) name | You publish server.json to the registry (best — installs stay current) |
| `?server=https://…/server.json` | URL of a self-hosted server.json | You host the manifest yourself |
| `?config=<base64url>` | Inline definition | Quick start, no manifest anywhere yet |

### 3. The embeddable web component — `/button.js`

The dynamic in-page button with the client picker, self-contained, no framework:

```html
<script src="https://install.apicommons.org/button.js" async></script>
<mcp-install-button name="io.github.acme/acme-mcp"></mcp-install-button>
```

Attributes: `name` / `server` / `config` (one of, as above), `label`, `clients` (comma-separated ids to limit the menu), `theme="light"`, `color="#hex"` (accent color for the button — readable text color and hover are derived automatically), `registry` (override the clients.json URL — point it at your fork).

### 4. The generator

The home page. Fill the form (or import from the MCP Registry / a server.json), then copy the button as a plain link, Markdown, HTML, the web component, or a row of per-client deep-link badges.

## Deep-link builders

The registry names a `builder` per deep-link client; the formats are:

| Builder | Format |
|---|---|
| `cursor` | `https://cursor.com/en/install-mcp?name={key}&config={base64 JSON}` |
| `vscode` | `https://vscode.dev/redirect/mcp/install?name={key}&config={URI-encoded JSON}` |
| `vscode-insiders` | same, on `insiders.vscode.dev`, plus `&quality=insiders` |
| `visual-studio` | `https://vs-open.link/mcp-install?{URI-encoded JSON incl. name}` |
| `lmstudio` | `lmstudio://add_mcp?name={key}&config={base64 JSON}` |
| `goose` | `goose://extension?cmd=…&arg=…&id=…&name=…&description=…` (or `url=…&type=streamable_http`) |

Remote-only servers still reach stdio-only clients via an auto-generated [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) bridge command, clearly labeled.

## Security posture

- The button carries a **pointer** (registry name or server.json URL) whenever possible, not an inline config — the chooser shows users exactly what they're about to install, from a canonical source.
- **Never put real secrets in a button.** Use `<PLACEHOLDER>` values for env vars and headers; clients prompt users or OAuth.
- Nothing executes from the page: every output is a link the user's client confirms, or text the user copies deliberately.

## Add a client

PR [`public/clients.json`](public/clients.json) with an entry that validates against [`public/clients.schema.json`](public/clients.schema.json):

- `category`: the best mechanism the client offers — `deeplink`, `cli`, `config`, or `connector`.
- `transports`: which of `stdio` / `http` / `sse` the client speaks.
- Then whichever of `deeplink` (a named builder), `cli` (command templates with `{name}` `{command}` `{args}` `{url}` `{envFlags}` `{headerFlags}` `{jsonWithName}` tokens), `config` (format, rootKey, snippet style, per-OS paths), and `connector` (steps) apply — a client may have several.

## Develop

```bash
npm install
npm run dev      # app at localhost:5173
npm run build    # dist/ = app + clients.json + button.js
```

Vanilla TypeScript + Vite, no runtime dependencies. Deploys to GitHub Pages on push to `main`.

## License

Apache-2.0. Free, open tooling from [API Commons](https://apicommons.org); expert services behind it from [API Evangelist](https://apievangelist.com/services/).

