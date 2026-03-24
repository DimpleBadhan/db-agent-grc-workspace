# DB agent Local App

Filesystem-backed local version of DB Agent with the updated phase flow:

Onboarding -> Policy Generation -> Policy QA -> Policy Summary ->
Risk Assessment + Vendor Risk -> Control Mapping -> Audit QA -> Output

## What it does

- Creates a company-named folder for each client under `data/clients`
- Stores every phase as structured JSON
- Keeps outputs linked through `policy_id`, `risk_id`, `vendor_id`, and `control_id`
- Enforces phase gating so blocked downstream phases cannot be edited early
- Shows onboarding missing inputs, readiness status, and JSON previews inside the UI
- Loads stored QA and assessment prompts through a local prompt registry API
- Treats generated client data as local working data, not publishable demo content

## Prompt and rules

The current DB Agent operating prompt used for the local app flow is stored in:

`docs/db-agent-system-prompt.md`

Stored QA and assessment prompts are wired through:

- `config/agent-prompt-registry.json`
- `prompts/qa/*`
- `prompts/assessments/*`

Local API endpoints:

- `GET /api/prompt-registry`
- `GET /api/prompts/<prompt-id>`

## Run locally

Double-click `run-local.bat`, or run:

```powershell
cd db-agent-local-app
.\run-local.ps1
```

Then open `http://localhost:8090`.

## Privacy

Generated client records are written under `data/clients`.
Those files should stay local unless you explicitly intend to share them.

## Filesystem layout

```text
data/clients/
  Company Name/
    Client Details/
      onboarding.json
    Policies and Procedures/
      policies.json
    Policy QA/
      policy-qa.json
    Policy Summary/
      policy-summary.json
    Risk Assessments/
      risk-assessments.json
    Vendor Assessments/
      vendor-assessments.json
    Control Mapping/
      controls.json
    Audit QA/
      audit-qa.json
    Output/
      dashboard-output.json
```
