# DB Agent

DB Agent is a client-centric GRC workspace for onboarding, policy generation, risk assessment, vendor assessment, control mapping, and audit-ready outputs.

This repository contains two app variants:

- `db-agent-local-app`
  - main local app
  - stores client workspaces and structured JSON records on disk
  - designed for real client processing
- `db-agent-github-safe`
  - public-safe static demo
  - excludes local client data and private source materials
  - suitable for GitHub upload and simple sharing

## Core workflow

DB Agent is built around this flow:

`Onboarding -> Policy Generation -> Risk Assessment -> Vendor Assessment -> Control Mapping -> Output`

The local app also supports:

- client-specific workspaces
- reusable vendor data
- policy ownership and sign-off
- downloadable policy, risk, and vendor exports
- prompt-driven generation architecture for policy, risk, vendor, and QA workflows

## Repository structure

```text
.
|- db-agent-local-app/      # Main local app
|- db-agent-github-safe/    # Public-safe static demo
|- compliance_inputs/       # Stored prompt assets and private source inputs
|- .github/workflows/       # GitHub Pages workflow for the demo variant
|- index.html               # First-pass root prototype
|- styles.css
|- app.js
```

## Recommended use

Use `db-agent-local-app` if you want the real working version with local client storage.

Use `db-agent-github-safe` if you want a public GitHub version without local client records, exports, or private framework/template source files.

## Run locally

### Local app

```powershell
cd "C:\Users\Dimple Badhan\Documents\New project 9\db-agent-local-app"
.\run-local.ps1
```

Then open:

`http://127.0.0.1:8093/`

### Public-safe demo

Open:

`C:\Users\Dimple Badhan\Documents\New project 9\db-agent-github-safe\index.html`

Or serve it locally:

```powershell
cd "C:\Users\Dimple Badhan\Documents\New project 9\db-agent-github-safe"
py -m http.server 8080
```

Then open:

`http://localhost:8080`

## GitHub upload guidance

If you want a public GitHub repository, upload the repo in its current GitHub-safe form.

Important:

- local runtime data is ignored
- private framework/template files are ignored
- local client workspaces are not included in the repository

## Deploy demo with GitHub Pages

This repository includes a Pages workflow in:

`.github/workflows/deploy-pages.yml`

Steps:

1. Create a GitHub repository
2. Push this repo to `main`
3. In GitHub, open `Settings -> Pages`
4. Set source to `GitHub Actions`
5. Wait for the Pages workflow to finish

## Privacy note

Do not publish private client data, raw compliance source files, or local processing artifacts unless you explicitly intend to share them.

The repository is configured to keep these out of Git, but you should still review before pushing.

## Included prompt architecture

The local app includes a prompt registry and staged generation prompt set for:

- context analysis
- control strategy
- output generation
- policy QA
- risk assessment and QA
- vendor assessment and QA

Key files:

- `db-agent-local-app/config/agent-prompt-registry.json`
- `db-agent-local-app/docs/db-agent-system-prompt.md`
- `db-agent-local-app/docs/agent-prompt-architecture.md`

## Status

The repository is prepared for GitHub push and already has a local commit with the GitHub-safe structure.
