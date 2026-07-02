// Weave API Evangelist services into the app. Every action routes to
// info@apievangelist.com over a mailto link with the current context
// pre-filled — engagement works even in a forked or fully local copy, with
// no backend. MCP Install is free, open tooling; API Evangelist sells the
// expert services around it, and this is the always-present front door.
const EMAIL = 'info@apievangelist.com';
const APP = 'MCP Install';
const SERVICES_URL = 'https://apievangelist.com/services/';

interface Service {
  title: string;
  blurb: string;
  cta: string;
  subject: string;
  body: string;
}

const SERVICES: Service[] = [
  {
    title: 'MCP enablement',
    blurb: 'Stand up an MCP server for your API — transports, auth, tool design, and publishing to the MCP Registry — so agents can actually use it.',
    cta: 'Ship my MCP server',
    subject: 'MCP enablement engagement',
    body: 'Hi API Evangelist,\n\nWe want help standing up (or hardening) an MCP server for our API and getting it in front of every client.\n\nContext: {ctx}\n\nThanks,',
  },
  {
    title: 'Agent onboarding',
    blurb: 'Make your API onboardable by agents end to end — API Onboarding Descriptors, APIs.json, install buttons, and the docs to match.',
    cta: 'Onboard the agents',
    subject: 'Agentic onboarding engagement',
    body: 'Hi API Evangelist,\n\nWe want our API to be discoverable and installable by AI agents and their humans.\n\nContext: {ctx}\n\nThanks,',
  },
  {
    title: 'Artifact creation',
    blurb: 'No server.json, OpenAPI, APIs.json, or Arazzo yet? We create the governed artifacts your MCP distribution depends on.',
    cta: 'Request artifacts',
    subject: 'MCP / API artifact creation request',
    body: 'Hi API Evangelist,\n\nWe’d like help creating the artifacts behind our MCP distribution (server.json / OpenAPI / APIs.json / Arazzo).\n\nContext: {ctx}\n\nThanks,',
  },
  {
    title: 'Governance review',
    blurb: 'An expert review of your MCP server and install experience — security posture, secrets handling, tool surface, and client coverage.',
    cta: 'Request a review',
    subject: 'MCP governance review request',
    body: 'Hi API Evangelist,\n\nI’d like a governance review of our MCP server and install experience.\n\nContext: {ctx}\n\nWhat does an engagement look like?\n\nThanks,',
  },
];

export function wireEngage(button: HTMLElement): void {
  let modal: HTMLElement | undefined;
  button.addEventListener('click', () => {
    modal ??= buildModal();
    modal.hidden = false;
  });
}

function buildModal(): HTMLElement {
  const ctx = `Sent from ${APP} (${location.href})`;
  const wrap = document.createElement('div');
  wrap.className = 'engage-overlay';
  wrap.innerHTML = `
    <div class="engage-modal" role="dialog" aria-label="Work with API Evangelist">
      <header>
        <h2>Work with API Evangelist</h2>
        <button class="engage-close" type="button" aria-label="Close">×</button>
      </header>
      <p class="engage-lede">${APP} is free, open API Commons tooling. When you want expert hands on the work itself, these are the services behind it — every button below opens an email to ${EMAIL}.</p>
      <div class="engage-grid">
        ${SERVICES.map(
          (s) => `
          <div class="engage-card">
            <h3>${s.title}</h3>
            <p>${s.blurb}</p>
            <a class="engage-cta" href="mailto:${EMAIL}?subject=${encodeURIComponent(s.subject)}&body=${encodeURIComponent(s.body.replace('{ctx}', ctx))}">${s.cta} →</a>
          </div>`
        ).join('')}
      </div>
      <footer><a href="${SERVICES_URL}" target="_blank" rel="noopener">All API Evangelist services ↗</a></footer>
    </div>`;
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap || (e.target as HTMLElement).classList.contains('engage-close')) wrap.hidden = true;
  });
  document.body.appendChild(wrap);
  return wrap;
}
