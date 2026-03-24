# DB Agent

DB Agent is a client-centric GRC workspace for GRC consultancies. It handles client onboarding, AI-powered policy generation, risk assessment, vendor risk assessment, control mapping, and audit-ready outputs — all running locally with no third-party SaaS dependency.

Built for [GreenHat Assurance](https://greenhatassurance.in.com) — a GRC consultancy providing audit readiness and compliance services.

---

## What it does

DB Agent takes a client through a full GRC workflow:

```
Onboarding
    ↓
AI — Build company brief
    ↓
AI — Discover company-specific risks
    ↓
AI — Write 25 tailored compliance policies
    ↓
AI — Score and review all policies
    ↓
AI — Fix flagged policies
    ↓
QA and finalize policy pack
    ↓
Risk Assessment → Vendor Risk → Control Mapping → Audit QA → Output
```

Every AI step uses the client's actual environment — cloud providers, identity systems, data types, vendors, compliance framework, security posture — not generic templates.

---

## Key features

- **AI policy generation** — 25 policies written specifically for each client, referencing their real tools, vendors, data types, and risks
- **AI risk discovery** — company-specific risks identified from onboarding data before policies are written, so policies address real risks
- **Vendor risk assessment** — all client vendors assessed with data access, DPA, contract, and certification checks
- **Control mapping** — policies and risks mapped to SOC 2, ISO 27001, or other framework controls
- **Change detection engine** — onboarding or vendor changes automatically trigger selective regeneration of affected policies, risks, and vendor assessments
- **Audit-ready outputs** — downloadable policy pack, risk register, vendor assessments, and control mapping
- **Policy governance** — sign-off, publish, and approval history tracking per policy
- **Evidence tracker** — evidence tasks linked to controls and risks
- **Fully local** — all data stored on disk, no cloud dependency, no SaaS fees

---

## Tech stack

| Layer | Technology |
|---|---|
| Server | Node.js + Express (async, non-blocking) |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Frontend | Vanilla JS, no framework |
| Storage | Local JSON files per client |
| Auth | API key via `.env` |

---

## Repository structure

```
.
├── db-agent-local-app/         # Main local app (Node.js server + frontend)
│   ├── server.js               # Express server — all endpoints and AI agents
│   ├── package.json            # Node.js dependencies
│   ├── run-local.bat           # Double-click to start the app
│   ├── public/                 # Frontend JS and HTML
│   ├── prompts/                # AI prompt files
│   ├── config/                 # Agent prompt registry and settings
│   └── local-processing-store/ # Client data (gitignored)
├── db-agent-github-safe/       # Public-safe static demo
├── compliance_inputs/          # Prompt assets and framework source files
└── .github/workflows/          # GitHub Pages workflow for demo variant
```

---

## Run locally

### Requirements

- Node.js v18+ (download from [nodejs.org](https://nodejs.org))
- Anthropic API key

### Setup

```bash
cd db-agent-local-app
npm install
```

Create a `.env` file in `db-agent-local-app/`:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### Start

Double-click `run-local.bat`, or run:

```bash
cd db-agent-local-app
node server.js
```

Then open: `http://localhost:8090`

---

## AI pipeline

The policy generation pipeline runs fully async — the server stays responsive during all AI calls:

| Stage | Agent | Description |
|---|---|---|
| 1 | Orchestrator | Builds a structured company brief from onboarding data |
| 2 | Risk Discovery | Generates 9-12 company-specific risks |
| 3 | Policy Writer | Writes all 25 policies referencing real tools, vendors, risks |
| 4 | Critic | Scores every policy — flags generic language, missing specificity |
| 5 | Rewriter | Fixes all policies that scored below 80 |
| 6 | QA | Final quality pass and pack finalization |

---

## Change detection

The change engine monitors onboarding and vendor data for changes and automatically triggers selective regeneration:

| Change | Auto-trigger |
|---|---|
| Onboarding field updated (framework, data types, cloud, etc.) | Affected risks and policies regenerated |
| Vendor added | Full vendor risk assessment triggered |
| Vendor removed | Dependent risks and policies flagged |
| Vendor intel fields filled (data types, access level, DPA, etc.) | Vendor reassessment triggered |
| Evidence saved/deleted | Audit QA re-scored, affected risks updated |

---

## Security

- `.env` and all client data are gitignored — never committed
- Repo is private
- Branch protection on `main` — all changes via pull request
- Dependabot enabled for dependency vulnerability alerts

---

## Status

Active development. Running in production for GreenHat Assurance client work.
