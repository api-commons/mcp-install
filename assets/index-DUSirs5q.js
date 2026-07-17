(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();function O(e){const t=JSON.stringify(e);return btoa(String.fromCharCode(...new TextEncoder().encode(t))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function ce(e){const t=e.replace(/-/g,"+").replace(/_/g,"/"),n=Uint8Array.from(atob(t),o=>o.charCodeAt(0));return JSON.parse(new TextDecoder().decode(n))}function I(e){return e.name.toLowerCase().trim().replace(/[^a-z0-9._-]+/g,"-").replace(/^-+|-+$/g,"")||"mcp-server"}function _(e){return btoa(unescape(encodeURIComponent(JSON.stringify(e))))}function le(e){return/^[A-Za-z0-9@%_+=:,./-]+$/.test(e)?e:`'${e.replace(/'/g,"'\\''")}'`}function de(e){const t=["-y","mcp-remote",e.url];for(const[n,o]of Object.entries(e.headers??{}))t.push("--header",`${n}: ${o}`);return{command:"npx",args:t}}function E(e,t){const n=e.transports.includes("http")||e.transports.includes("sse"),o=e.transports.includes("stdio"),r=n&&t.remote?t.remote:void 0;let s=o&&t.package?t.package:void 0,a=!1;return!r&&!s&&o&&t.remote&&(s=de(t.remote),a=!0),{remote:r,pkg:s,bridged:a}}function Z(e,t){const{remote:n,pkg:o}=E(e,t);if(!n&&!o)return;const r=t.name,s=I(t);switch(e.deeplink?.builder){case"cursor":{const a=n?{url:n.url,...n.headers?{headers:n.headers}:{}}:{command:o.command,args:o.args,...o.env?{env:o.env}:{}};return`https://cursor.com/en/install-mcp?name=${encodeURIComponent(s)}&config=${encodeURIComponent(_(a))}`}case"vscode":case"vscode-insiders":{const a=n?{type:n.type,url:n.url,...n.headers?{headers:n.headers}:{}}:{type:"stdio",command:o.command,args:o.args,...o.env?{env:o.env}:{}},i=e.deeplink.builder==="vscode-insiders"?"insiders.vscode.dev":"vscode.dev",d=e.deeplink.builder==="vscode-insiders"?"&quality=insiders":"";return`https://${i}/redirect/mcp/install?name=${encodeURIComponent(s)}&config=${encodeURIComponent(JSON.stringify(a))}${d}`}case"visual-studio":{const a=n?{name:s,type:n.type,url:n.url}:{name:s,type:"stdio",command:o.command,args:o.args,...o.env?{env:o.env}:{}};return`https://vs-open.link/mcp-install?${encodeURIComponent(JSON.stringify(a))}`}case"lmstudio":{const a=n?{url:n.url,...n.headers?{headers:n.headers}:{}}:{command:o.command,args:o.args,...o.env?{env:o.env}:{}};return`lmstudio://add_mcp?name=${encodeURIComponent(s)}&config=${encodeURIComponent(_(a))}`}case"goose":{const a=`id=${encodeURIComponent(s)}&name=${encodeURIComponent(r)}&description=${encodeURIComponent(t.description||r)}`;if(n){const c=n.type==="sse"?"sse":"streamable_http";return`goose://extension?url=${encodeURIComponent(n.url)}&type=${c}&${a}`}const i=o.args.map(c=>`arg=${encodeURIComponent(c)}`).join("&"),d=Object.entries(o.env??{}).map(([c,l])=>`&env=${encodeURIComponent(`${c}=${l}`)}`).join("");return`goose://extension?cmd=${encodeURIComponent(o.command)}${i?"&"+i:""}${d}&${a}&timeout=300`}default:return}}function z(e,t){return!e||!t?"":Object.entries(t).map(([n,o])=>e.replace("{key}",n).replace("{value}",o)).join("")}function pe(e,t,n){const{remote:o,pkg:r,bridged:s}=E(t,n),a=I(n);if(o&&(e.http||e.sse))return{command:((o.type==="sse"?e.sse:e.http)||e.http||e.sse).replace("{name}",a).replace("{url}",o.url).replace("{headerFlags}",z(e.headerFlag,o.headers)).replace("{jsonWithName}",JSON.stringify({name:a,type:o.type,url:o.url,...o.headers?{headers:o.headers}:{}})),note:e.note};if(r&&e.stdio)return{command:e.stdio.replace("{name}",a).replace("{command}",r.command).replace("{args}",r.args.map(le).join(" ")).replace("{envFlags}",z(e.envFlag,r.env)).replace("{jsonWithName}",JSON.stringify({name:a,command:r.command,args:r.args,...r.env?{env:r.env}:{}})),note:s?Q(e.note):e.note}}function Q(e){const t="Uses the mcp-remote bridge — this client speaks stdio, so the hosted endpoint is proxied locally.";return e?`${t} ${e}`:t}function x(e){return JSON.stringify(e,null,2)}function A(e){return`"${e.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`}function ue(e,t,n){const{remote:o,pkg:r,bridged:s}=E(t,n);if(!o&&!r)return;const a=I(n),i=e.style??"default";if(i==="continue"){const l=["mcpServers:",`  - name: ${n.name}`];if(o){l.push(`    type: ${o.type==="sse"?"sse":"streamable-http"}`,`    url: ${o.url}`);for(const[p,f]of Object.entries(o.headers??{}))l.indexOf("    requestOptions:")===-1&&l.push("    requestOptions:","      headers:"),l.push(`        ${p}: ${f}`)}else{l.push(`    command: ${r.command}`,"    args:");for(const f of r.args)l.push(`      - "${f.replace(/"/g,'\\"')}"`);const p=Object.entries(r.env??{});if(p.length){l.push("    env:");for(const[f,v]of p)l.push(`      ${f}: "${v}"`)}}return{code:l.join(`
`),lang:"yaml",bridged:s}}if(i==="toml"){const l=e.rootKey??"mcp_servers",p=[`[${l}.${a}]`];if(r){p.push(`command = ${A(r.command)}`),p.push(`args = [${r.args.map(A).join(", ")}]`);const f=Object.entries(r.env??{});if(f.length){p.push("",`[${l}.${a}.env]`);for(const[v,b]of f)p.push(`${v} = ${A(b)}`)}}else o&&p.push(`url = ${A(o.url)}`);return{code:p.join(`
`),lang:"toml",bridged:s}}if(i==="zed"){const l=r?{source:"custom",command:r.command,args:r.args,env:r.env??{}}:{source:"custom",command:"npx",args:["-y","mcp-remote",o.url],env:{}};return{code:x({[e.rootKey??"context_servers"]:{[a]:l}}),lang:"json",bridged:s||!r}}if(i==="opencode"){const l=o?{type:"remote",url:o.url,enabled:!0,...o.headers?{headers:o.headers}:{}}:{type:"local",command:[r.command,...r.args],enabled:!0,...r.env?{environment:r.env}:{}};return{code:x({[e.rootKey??"mcp"]:{[a]:l}}),lang:"json",bridged:s}}if(i==="vscode"){const l=o?{type:o.type,url:o.url,...o.headers?{headers:o.headers}:{}}:{type:"stdio",command:r.command,args:r.args,...r.env?{env:r.env}:{}};return{code:x({[e.rootKey??"servers"]:{[a]:l}}),lang:"json",bridged:s}}const d=e.urlKey??"url",c=o?{[d]:o.url,...o.headers?{headers:o.headers}:{}}:{command:r.command,args:r.args,...r.env?{env:r.env}:{}};return{code:x({[e.rootKey??"mcpServers"]:{[a]:c}}),lang:"json",bridged:s}}function X(){const e=(navigator.platform||navigator.userAgent).toLowerCase();return e.includes("win")?"windows":e.includes("linux")||e.includes("x11")?"linux":"mac"}function me(e,t){return e.paths?.[t]??e.paths?.mac??e.paths?.windows??e.paths?.linux}function T(e,t,n){const o=[];if(E(e,t),e.deeplink){const r=Z(e,t);r&&o.push({kind:"link",label:`Add to ${e.name}`,href:r,note:e.deeplink.note})}if(e.cli){const r=pe(e.cli,e,t);r&&o.push({kind:"command",label:"Run in a terminal",command:r.command,note:r.note})}if(e.config){const r=ue(e.config,e,t);if(r){const s=me(e.config,n)??e.config.location;o.push({kind:"snippet",label:s?`Add to ${s}`:`Add to ${e.name} config`,code:r.code,lang:r.lang,where:s,steps:e.config.steps,note:r.bridged?Q(e.config.note):e.config.note})}}return e.connector&&(!((e.connector.requires??"remote")==="remote")||t.remote)&&o.push({kind:"steps",label:`Connect in ${e.name}`,steps:e.connector.steps,copy:t.remote?.url,note:e.connector.note}),o}function fe(e,t){if(!(T(e,t,"mac").length>0))return e.connector&&!t.remote&&(e.connector.requires??"remote")==="remote"?"Needs a hosted (http/sse) endpoint — this server only ships as a local package.":!t.package&&!t.remote?"No package or endpoint defined yet.":"No compatible transport between this client and server."}const N="https://registry.modelcontextprotocol.io/v0/servers";async function ee(e){const t=e.get("name");if(t){const r=await ge(t);if(r)return{def:r,source:"registry",sourceUrl:`${N}?search=${encodeURIComponent(t)}`}}const n=e.get("server");if(n){const r=await fetch(n);if(r.ok){const s=q(await r.json());if(s)return{def:s,source:"server.json",sourceUrl:n}}}const o=e.get("config");if(o)try{return{def:ce(o),source:"config"}}catch{}}async function ge(e){const t=await fetch(`${N}?search=${encodeURIComponent(e)}&limit=10`);if(!t.ok)return;const n=await t.json(),o=n.servers??n.data??(Array.isArray(n)?n:[]);if(!o.length)return;const r=a=>a.server??a,s=o.find(a=>r(a).name===e);return q(r(s??o[0]))}function q(e){if(!e||typeof e!="object")return;const t=e.name??e.id??"mcp-server",n={name:t.includes("/")?t.split("/").pop():t,description:e.description},o=e.remotes??[];if(o.length){const s=o[0],i={type:String(s.transport_type??s.transportType??s.type??"http").toLowerCase().includes("sse")?"sse":"http",url:s.url},d={};for(const c of s.headers??[])c?.name&&(d[c.name]=c.value??c.default??`<${c.description??c.name}>`);Object.keys(d).length&&(i.headers=d),i.url&&(n.remote=i)}const r=e.packages??[];if(r.length){const s=r[0],a=String(s.registry_type??s.registryType??s.registry_name??s.registryName??"").toLowerCase(),i=s.identifier??s.name??s.package,d=s.version&&s.version!=="latest"?`@${s.version}`:"",c=J(s.runtime_arguments??s.runtimeArguments),l=J(s.package_arguments??s.packageArguments);let p=s.runtime_hint??s.runtimeHint,f=[];a==="npm"||!a&&(p==="npx"||!p)?(p=p||"npx",f=p==="npx"?[...c.filter(b=>b!=="-y"),"-y",`${i}${d}`]:[...c,i]):a==="pypi"?(p=p||"uvx",f=[...c,`${i}${d.replace("@","==")}`]):a==="oci"||p==="docker"?(p=p||"docker",f=f.length?f:["run","-i","--rm",...c,i]):a==="nuget"?(p=p||"dnx",f=[...c,`${i}${d}`,"--yes"]):(p=p||i,f=[...c]),f=[...f,...l];const v={};for(const b of s.environment_variables??s.environmentVariables??[])b?.name&&(v[b.name]=b.value??b.default??`<${b.description??b.name}>`);p&&(n.package={command:p,args:f,...Object.keys(v).length?{env:v}:{}})}if(!(!n.remote&&!n.package))return n}function J(e){const t=[];for(const n of e??[])typeof n=="string"?t.push(n):n?.type==="named"&&n.name?(t.push(n.name),(n.value??n.default)&&t.push(String(n.value??n.default))):(n?.value??n?.default)&&t.push(String(n.value??n.default));return t}function m(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}async function te(e,t){try{if(await navigator.clipboard.writeText(e),t){const n=t.textContent;t.textContent="Copied ✓",setTimeout(()=>t.textContent=n,1500)}}catch{}}function M(e){e.querySelectorAll("[data-copy]").forEach(t=>{t.addEventListener("click",()=>{const n=t.getAttribute("data-copy"),r=(n.startsWith("#")?e.querySelector(n):null)?.textContent??n;te(r,t)})})}const S=(()=>{const e=document.currentScript?.src;try{return e?new URL(".",e).href.replace(/\/$/,""):"https://install.apicommons.org"}catch{return"https://install.apicommons.org"}})(),he={deeplink:"One-click",cli:"Command line",config:"Config file",connector:"Connect in app"},ve=`
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
`,be='<svg width="14" height="14" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 10v26" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><path d="M18 26l14 14 14-14" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 52h36" stroke="currentColor" stroke-width="8" stroke-linecap="round"/></svg>';class ye extends HTMLElement{root=this.attachShadow({mode:"open"});open=!1;loaded=!1;connectedCallback(){this.render(),document.addEventListener("click",t=>{this.open&&!t.composedPath().includes(this)&&this.toggle(!1)})}chooserHref(){const t=this.getAttribute("name"),n=this.getAttribute("server"),o=this.getAttribute("config");return t?`${S}/?name=${encodeURIComponent(t)}`:n?`${S}/?server=${encodeURIComponent(n)}`:`${S}/?config=${o??""}`}render(){const t=this.getAttribute("label")??"Install MCP Server";this.applyColor(),this.root.innerHTML=`
      <style>${ve}</style>
      <button class="btn" type="button" aria-haspopup="true" aria-expanded="false">${be}<span>${m(t)}</span></button>
      <div class="panel" hidden></div>
    `,this.root.querySelector(".btn").addEventListener("click",()=>this.toggle(!this.open))}applyColor(){const t=ke(this.getAttribute("color"));if(!t){for(const n of["--mcp-btn-bg","--mcp-btn-bg-hover","--mcp-btn-color","--mcp-accent"])this.style.removeProperty(n);return}this.style.setProperty("--mcp-btn-bg",t),this.style.setProperty("--mcp-btn-bg-hover",Ce(t,.14)),this.style.setProperty("--mcp-btn-color",we(t)),this.style.setProperty("--mcp-accent",t)}toggle(t){this.open=t;const n=this.root.querySelector(".panel");n.hidden=!t,this.root.querySelector(".btn").setAttribute("aria-expanded",String(t)),t&&!this.loaded&&(this.loaded=!0,n.innerHTML='<div class="status">Loading install options…</div>',this.populate(n))}async populate(t){try{const n=this.getAttribute("registry")??`${S}/clients.json`,o=new URLSearchParams;for(const d of["name","server","config"]){const c=this.getAttribute(d);c&&o.set(d,c)}const[r,s]=await Promise.all([fetch(n).then(d=>d.json()),ee(o)]);if(!s){t.innerHTML=`<div class="status">Could not load this server's definition.</div>`;return}const a=(this.getAttribute("clients")??"").split(",").map(d=>d.trim()).filter(Boolean);let i=r.clients;a.length&&(i=i.filter(d=>a.includes(d.id))),this.renderClients(t,i,s.def)}catch{t.innerHTML=`<div class="status">Could not load install options — <a href="${m(this.chooserHref())}">open the install page ↗</a></div>`}}renderClients(t,n,o){const r=X(),s={},a=new Map;for(const d of n){const c=T(d,o,r);if(!c.length)continue;const l=c[0],p=`c-${d.id}`;let f;l.kind==="link"?f=`<div class="row"><a class="head" href="${m(l.href)}">${m(d.name)}<span class="go">Add ↗</span></a></div>`:(a.set(p,l),f=`<div class="row"><button class="head" type="button" data-detail="${p}">${m(d.name)}<span class="go">${l.kind==="steps"?"How ▾":"Copy ▾"}</span></button><div class="detail" id="${p}" hidden></div></div>`),(s[d.category]??=[]).push(f)}const i=["deeplink","cli","config","connector"].filter(d=>s[d]?.length).map(d=>`<div class="group">${he[d]}</div>${s[d].join("")}`).join("");t.innerHTML=`
      ${i||'<div class="status">No compatible clients for this server definition.</div>'}
      <div class="foot">
        <a href="${m(this.chooserHref())}" target="_blank" rel="noopener">All install options ↗</a>
        <span class="muted">API Commons</span>
      </div>
    `,t.querySelectorAll("[data-detail]").forEach(d=>{d.addEventListener("click",()=>{const c=t.querySelector(`#${d.getAttribute("data-detail")}`);if(c.hidden){const l=a.get(c.id);c.innerHTML||(c.innerHTML=$e(l));const p=c.querySelector(".copy");p?.addEventListener("click",()=>{te(c.getAttribute("data-copy-text")??"",p)})}c.hidden=!c.hidden})});for(const[d,c]of a){const l=t.querySelector(`#${d}`),p=c.kind==="command"?c.command:c.kind==="snippet"?c.code:c.kind==="steps"?c.copy??"":"";l?.setAttribute("data-copy-text",p)}}}function $e(e){switch(e.kind){case"command":return`<pre>${m(e.command)}</pre><button class="copy" type="button">Copy command</button>${R(e.note)}`;case"snippet":return`${e.where?`<p class="where">${m(e.where)}</p>`:""}<pre>${m(e.code)}</pre><button class="copy" type="button">Copy snippet</button>${R(e.note)}`;case"steps":return`<ol>${e.steps.map(t=>`<li>${m(t)}</li>`).join("")}</ol>${e.copy?'<button class="copy" type="button">Copy server URL</button>':""}${R(e.note)}`;default:return""}}function R(e){return e?`<p class="note">${m(e)}</p>`:""}function ke(e){if(!e)return;const t=e.trim().replace(/^#/,"");if(/^[0-9a-fA-F]{3}$/.test(t))return"#"+t.split("").map(n=>n+n).join("").toLowerCase();if(/^[0-9a-fA-F]{6}$/.test(t))return"#"+t.toLowerCase()}function ne(e){const t=parseInt(e.slice(1),16);return[t>>16&255,t>>8&255,t&255]}function we(e){const[t,n,o]=ne(e).map(s=>{const a=s/255;return a<=.03928?a/12.92:Math.pow((a+.055)/1.055,2.4)});return .2126*t+.7152*n+.0722*o>.42?"#0b1220":"#ffffff"}function Ce(e,t){const n=a=>Math.max(0,Math.round(a*(1-t))),[o,r,s]=ne(e).map(n);return"#"+[o,r,s].map(a=>a.toString(16).padStart(2,"0")).join("")}customElements.get("mcp-install-button")||customElements.define("mcp-install-button",ye);let B;function oe(e="/clients.json"){return B??=fetch(e).then(t=>{if(!t.ok)throw new Error(`clients.json ${t.status}`);return t.json()}),B}const xe={deeplink:{title:"One-click install",blurb:"These clients accept a deep link — click and confirm in the app."},cli:{title:"Command line",blurb:"Copy one command into a terminal."},config:{title:"Config file",blurb:"Paste a snippet into the client’s MCP config."},connector:{title:"Web connectors",blurb:"Attach the hosted endpoint in the client’s settings."}};async function Ae(e,t){e.innerHTML='<div class="loading">Resolving server definition…</div>';let n,o;try{n=await ee(t)}catch(l){o=l instanceof Error?l.message:String(l)}if(!n){e.innerHTML=`
      <div class="empty">
        <h2>Couldn’t load that server</h2>
        <p>${o?m(o):"The link is missing a valid <code>?name=</code>, <code>?server=</code>, or <code>?config=</code> parameter."}</p>
        <p><a href="/">Build a button instead →</a></p>
      </div>`;return}const r=await oe(),s=n.def;let a=X(),i="";const d=()=>{e.innerHTML=Se(r.clients,s,n,a,i),M(e),e.querySelectorAll("[data-os]").forEach(p=>p.addEventListener("click",()=>{a=p.dataset.os,d()}));const l=e.querySelector("#client-filter");l?.addEventListener("input",()=>{i=l.value,c()}),i&&(l.value=i,l.focus(),l.setSelectionRange(i.length,i.length))},c=()=>{const l=e.querySelector("#client-list");l&&(l.innerHTML=re(r.clients,s,a,i),M(l))};d()}function Se(e,t,n,o,r){const s=[t.remote?`remote (${t.remote.type})`:null,t.package?`local package (${t.package.command})`:null].filter(Boolean).join(" + "),a=n.source==="registry"?"MCP Registry":n.source==="server.json"?"server.json":"inline config";return`
    <section class="server-head">
      <div>
        <h1>${m(t.name)}</h1>
        ${t.description?`<p class="desc">${m(t.description)}</p>`:""}
        <p class="meta">
          <span class="chip">${m(s)}</span>
          <span class="chip chip-src" title="${n.sourceUrl?m(n.sourceUrl):""}">from ${a}</span>
        </p>
      </div>
      <div class="head-controls">
        <div class="os-toggle" role="group" aria-label="Operating system">
          ${["mac","windows","linux"].map(i=>`<button type="button" data-os="${i}" class="${i===o?"active":""}">${i==="mac"?"macOS":i==="windows"?"Windows":"Linux"}</button>`).join("")}
        </div>
        <input id="client-filter" type="search" placeholder="Filter clients…" autocomplete="off" />
      </div>
    </section>
    <p class="trust-note">Review what you install: the commands and configs below are generated from the server definition above — nothing runs from this page. Keep secrets out of links; use env vars and OAuth.</p>
    <div id="client-list">${re(e,t,o,r)}</div>
  `}function re(e,t,n,o){const r=o.trim().toLowerCase(),s=r?e.filter(i=>(i.name+" "+(i.maker??"")+" "+i.id).toLowerCase().includes(r)):e,a=[];for(const i of["deeplink","cli","config","connector"]){const d=s.filter(p=>p.category===i);if(!d.length)continue;const c=d.map(p=>Pe(p,t,n)).join(""),l=xe[i];a.push(`
      <section class="category">
        <h2>${l.title}</h2>
        <p class="cat-blurb">${l.blurb}</p>
        <div class="cards">${c}</div>
      </section>`)}return a.join("")||`<p class="empty">No clients match “${m(o)}”.</p>`}let Le=0;function Pe(e,t,n){const o=T(e,t,n),r=`
    <header>
      <h3>${m(e.name)}</h3>
      ${e.maker?`<span class="maker">${m(e.maker)}</span>`:""}
      ${e.docs?`<a class="docs" href="${m(e.docs)}" target="_blank" rel="noopener" title="MCP docs for ${m(e.name)}">docs ↗</a>`:""}
    </header>`;if(!o.length){const s=fe(e,t);return`<article class="card card-off">${r}<p class="off-reason">${m(s??"Not compatible.")}</p></article>`}return`<article class="card">${r}${o.map(s=>je(s)).join("")}</article>`}function je(e){const t=`opt-${++Le}`;switch(e.kind){case"link":return`
        <div class="opt">
          <a class="btn-install" href="${m(e.href)}">${m(e.label)} →</a>
          ${L(e.note)}
        </div>`;case"command":return`
        <div class="opt">
          <div class="opt-label">${m(e.label)}</div>
          <pre id="${t}"><code>${m(e.command)}</code></pre>
          <button class="copy-btn" type="button" data-copy="#${t}">Copy command</button>
          ${L(e.note)}
        </div>`;case"snippet":return`
        <div class="opt">
          <div class="opt-label">${e.where?`Merge into <code>${m(e.where)}</code>`:m(e.label)}</div>
          <pre id="${t}"><code>${m(e.code)}</code></pre>
          <button class="copy-btn" type="button" data-copy="#${t}">Copy snippet</button>
          ${e.steps?.length?`<ul class="steps">${e.steps.map(n=>`<li>${m(n)}</li>`).join("")}</ul>`:""}
          ${L(e.note)}
        </div>`;case"steps":return`
        <div class="opt">
          <div class="opt-label">${m(e.label)}</div>
          <ol class="steps">${e.steps.map(n=>`<li>${m(n)}</li>`).join("")}</ol>
          ${e.copy?`<pre id="${t}"><code>${m(e.copy)}</code></pre><button class="copy-btn" type="button" data-copy="#${t}">Copy server URL</button>`:""}
          ${L(e.note)}
        </div>`}}function L(e){return e?`<p class="opt-note">${m(e)}</p>`:""}const j="https://install.apicommons.org",se="3098d8";function U(e){const t=(e??"").trim().replace(/^#/,"").toLowerCase();return/^[0-9a-f]{3}$/.test(t)?t.split("").map(n=>n+n).join(""):/^[0-9a-f]{6}$/.test(t)?t:se}function H(e){return e.registryName?`${j}/?name=${encodeURIComponent(e.registryName)}`:e.serverJsonUrl?`${j}/?server=${encodeURIComponent(e.serverJsonUrl)}`:`${j}/?config=${O(e.def)}`}function ae(e,t){const n=I(e).replace(/-/g,"_");return`https://img.shields.io/badge/Install_MCP_Server-${encodeURIComponent(n)}-${U(t)}?style=flat-square`}function Ie(e){return`[![Install MCP Server](${ae(e.def,e.color)})](${H(e)})`}function Ee(e){return`<a href="${H(e)}"><img src="${ae(e.def,e.color)}" alt="Install MCP Server" /></a>`}function Re(e){const t=[e.registryName?`name="${F(e.registryName)}"`:e.serverJsonUrl?`server="${F(e.serverJsonUrl)}"`:`config="${O(e.def)}"`];return U(e.color)!==se&&t.push(`color="#${U(e.color)}"`),[`<script src="${j}/button.js" async><\/script>`,`<mcp-install-button ${t.join(" ")}></mcp-install-button>`].join(`
`)}function Me(e,t){const n=[];for(const o of e){if(!o.deeplink)continue;const r=Z(o,t);if(!r)continue;const s=`Add to ${o.name}`.replace(/\s/g,"_").replace(/-/g,"--"),a=`https://img.shields.io/badge/${encodeURIComponent(s)}-0b1220?style=flat-square`;n.push(`[![Add to ${o.name}](${a})](${r})`)}return n.join(`
`)}function F(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function Ue(e){e.innerHTML=`
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
        <div class="style-row">
          <span class="opt-label">Button color</span>
          <div class="swatches" id="swatches"></div>
          <input type="color" id="f-color" value="#3098d8" aria-label="Pick button color" />
          <input type="text" id="f-color-hex" value="#3098d8" class="hex-input" spellcheck="false"
            maxlength="7" aria-label="Button color hex" />
        </div>
        <div class="preview-box">
          <div class="opt-label">Live preview — this is the real embeddable component</div>
          <div id="preview"></div>
        </div>
        <div id="embeds"></div>
      </section>
    </div>
  `;const t=u=>e.querySelector(u),n=e.querySelectorAll("input, textarea, select"),o="#3098d8",r={color:o},s=()=>{const u=t("#f-name").value.trim();if(!u)return;const g={name:u},h=t("#f-desc").value.trim();h&&(g.description=h);const k=t("#f-remote-url").value.trim();if(k){const y=K(t("#f-remote-headers").value,":");g.remote={type:t("#f-remote-type").value,url:k,...y?{headers:y}:{}}}const $=t("#f-command").value.trim();if($){const y=K(t("#f-env").value,"=");g.package={command:$,args:Oe(t("#f-args").value),...y?{env:y}:{}}}if(!(!g.remote&&!g.package))return g},a=async()=>{const u=s(),g=t("#preview"),h=t("#embeds");if(!u){g.innerHTML='<p class="muted">Name your server and give it an endpoint or a package to see the button.</p>',h.innerHTML="";return}const k=e.querySelector("input[name=carry]:checked")?.value??"config",$={def:u,registryName:k==="name"?r.registryName:void 0,serverJsonUrl:k==="server"?r.serverJsonUrl:void 0,color:r.color};g.innerHTML="";const y=document.createElement("mcp-install-button");y.setAttribute("config",O(u)),y.setAttribute("registry",`${location.origin}/clients.json`),r.color.toLowerCase()!==o&&y.setAttribute("color",r.color),g.appendChild(y);const{clients:w}=await oe(),ie=H($).replace("https://install.apicommons.org",location.origin==="null"?"https://install.apicommons.org":location.origin);h.innerHTML=[C("Button link","Anywhere a URL works — docs, READMEs, emails.",ie),C("Markdown","READMEs and docs sites.",Ie($)),C("HTML","Landing pages and developer portals.",Ee($)),C("Web component","The dynamic in-page button with the client picker, as previewed.",Re($)),C("Per-client badges","Deep-link badges for the clients that support one-click install.",Me(w,u))].join(""),M(h)};n.forEach(u=>u.addEventListener("input",()=>void a())),e.querySelectorAll("input[name=carry]").forEach(u=>u.addEventListener("change",()=>void a()));const i=t("#f-color"),d=t("#f-color-hex"),c=t("#swatches"),l=[["API Commons blue","#3098d8"],["Ink","#0b1220"],["Slate","#334155"],["Emerald","#059669"],["Violet","#7c3aed"],["Rose","#e11d48"],["Amber","#d97706"]],p=u=>{const g=u.trim().replace(/^#/,"");if(/^[0-9a-fA-F]{3}$/.test(g))return"#"+g.split("").map(h=>h+h).join("").toLowerCase();if(/^[0-9a-fA-F]{6}$/.test(g))return"#"+g.toLowerCase()};c.innerHTML=l.map(([u,g])=>`<button type="button" class="swatch" data-hex="${g}" title="${m(u)}" style="background:${g}"></button>`).join("");const f=(u,g=!0)=>{r.color=u,d.value=u,g&&(i.value=u),c.querySelectorAll(".swatch").forEach(h=>h.classList.toggle("active",h.dataset.hex?.toLowerCase()===u.toLowerCase())),a()};i.addEventListener("input",()=>f(i.value,!1)),d.addEventListener("input",()=>{const u=p(d.value);u&&f(u)}),c.querySelectorAll(".swatch").forEach(u=>u.addEventListener("click",()=>f(u.dataset.hex))),f(o);const v=t("#imp-status"),b=(u,g)=>{const h=q(u);if(!h){v.textContent=`Could not read a server definition from ${g}.`;return}t("#f-name").value=h.name,t("#f-desc").value=h.description??"",t("#f-remote-url").value=h.remote?.url??"",t("#f-remote-type").value=h.remote?.type??"http",t("#f-remote-headers").value=W(h.remote?.headers,": "),t("#f-command").value=h.package?.command??"",t("#f-args").value=(h.package?.args??[]).map(Te).join(" "),t("#f-env").value=W(h.package?.env,"="),v.textContent=`Imported from ${g}. Review the fields — placeholders may need editing.`,a()};t("#imp-lookup").addEventListener("click",async()=>{const u=t("#imp-name").value.trim();if(u){v.textContent="Searching the MCP Registry…";try{const h=await(await fetch(`${N}?search=${encodeURIComponent(u)}&limit=10`)).json(),k=h.servers??h.data??[],$=w=>w.server??w,y=k.find(w=>$(w).name===u)??k[0];if(!y){v.textContent="No registry entry found for that name.";return}r.registryName=$(y).name,t("#carry-name").disabled=!1,t("#carry-name").checked=!0,b($(y),`the MCP Registry (${r.registryName})`)}catch{v.textContent="Registry lookup failed — check the name or try the server.json URL."}}}),t("#imp-fetch").addEventListener("click",async()=>{const u=t("#imp-url").value.trim();if(u){v.textContent="Fetching server.json…";try{const g=await fetch(u);r.serverJsonUrl=u,t("#carry-server").disabled=!1,t("#carry-server").checked=!0,b(await g.json(),u)}catch{v.textContent="Fetch failed — the file may not allow cross-origin requests. Paste it instead."}}}),t("#imp-parse").addEventListener("click",()=>{try{b(JSON.parse(t("#imp-paste").value),"pasted JSON")}catch{v.textContent="That isn’t valid JSON."}}),a()}function C(e,t,n){const o=`embed-${e.toLowerCase().replace(/[^a-z]+/g,"-")}`;return`
    <div class="embed">
      <div class="embed-head"><strong>${m(e)}</strong><span class="muted small">${m(t)}</span>
        <button class="copy-btn" type="button" data-copy="#${o}">Copy</button></div>
      <pre id="${o}"><code>${m(n)}</code></pre>
    </div>`}function K(e,t){const n={};for(const o of e.split(`
`)){const r=o.indexOf(t);r>0&&(n[o.slice(0,r).trim()]=o.slice(r+1).trim())}return Object.keys(n).length?n:void 0}function W(e,t){return Object.entries(e??{}).map(([n,o])=>`${n}${t}${o}`).join(`
`)}function Oe(e){const t=[],n=/"([^"]*)"|'([^']*)'|(\S+)/g;let o;for(;o=n.exec(e);)t.push(o[1]??o[2]??o[3]);return t}function Te(e){return/\s/.test(e)?`"${e}"`:e}const D="info@apievangelist.com",Y="MCP Install",Ne="https://apievangelist.com/services/",qe=[{title:"MCP enablement",blurb:"Stand up an MCP server for your API — transports, auth, tool design, and publishing to the MCP Registry — so agents can actually use it.",cta:"Ship my MCP server",subject:"MCP enablement engagement",body:`Hi API Evangelist,

We want help standing up (or hardening) an MCP server for our API and getting it in front of every client.

Context: {ctx}

Thanks,`},{title:"Agent onboarding",blurb:"Make your API onboardable by agents end to end — API Onboarding Descriptors, APIs.json, install buttons, and the docs to match.",cta:"Onboard the agents",subject:"Agentic onboarding engagement",body:`Hi API Evangelist,

We want our API to be discoverable and installable by AI agents and their humans.

Context: {ctx}

Thanks,`},{title:"Artifact creation",blurb:"No server.json, OpenAPI, APIs.json, or Arazzo yet? We create the governed artifacts your MCP distribution depends on.",cta:"Request artifacts",subject:"MCP / API artifact creation request",body:`Hi API Evangelist,

We’d like help creating the artifacts behind our MCP distribution (server.json / OpenAPI / APIs.json / Arazzo).

Context: {ctx}

Thanks,`},{title:"Governance review",blurb:"An expert review of your MCP server and install experience — security posture, secrets handling, tool surface, and client coverage.",cta:"Request a review",subject:"MCP governance review request",body:`Hi API Evangelist,

I’d like a governance review of our MCP server and install experience.

Context: {ctx}

What does an engagement look like?

Thanks,`}];function He(e){let t;e.addEventListener("click",()=>{t??=_e(),t.hidden=!1})}function _e(){const e=`Sent from ${Y} (${location.href})`,t=document.createElement("div");return t.className="engage-overlay",t.innerHTML=`
    <div class="engage-modal" role="dialog" aria-label="Work with API Evangelist">
      <header>
        <h2>Work with API Evangelist</h2>
        <button class="engage-close" type="button" aria-label="Close">×</button>
      </header>
      <p class="engage-lede">${Y} is free, open API Commons tooling. When you want expert hands on the work itself, these are the services behind it — every button below opens an email to ${D}.</p>
      <div class="engage-grid">
        ${qe.map(n=>`
          <div class="engage-card">
            <h3>${n.title}</h3>
            <p>${n.blurb}</p>
            <a class="engage-cta" href="mailto:${D}?subject=${encodeURIComponent(n.subject)}&body=${encodeURIComponent(n.body.replace("{ctx}",e))}">${n.cta} →</a>
          </div>`).join("")}
      </div>
      <footer><a href="${Ne}" target="_blank" rel="noopener">All API Evangelist services ↗</a></footer>
    </div>`,t.addEventListener("click",n=>{(n.target===t||n.target.classList.contains("engage-close"))&&(t.hidden=!0)}),document.body.appendChild(t),t}const V=document.getElementById("app"),P=new URLSearchParams(location.search);P.has("name")||P.has("server")||P.has("config")?Ae(V,P):Ue(V);const G=document.getElementById("engage-ae");G&&He(G);
