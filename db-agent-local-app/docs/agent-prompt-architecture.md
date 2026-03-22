# Agent Prompt Architecture

DB Agent now treats prompt design as a context-aware pipeline rather than a single template-tailoring instruction set.

## Design goals

- prevent generic output
- inject company context into every generation path
- separate analysis from control selection and final writing
- keep framework identifiers internal while improving company-facing prose
- support transparent reasoning and quality validation

## Core model

Every substantive generation flow should use:

1. Context Analyzer
2. Control Strategy Engine
3. Output Generator

The existing `policy_generation_agent.txt` remains the umbrella master standard. The three additional generation prompts capture the stage-specific responsibilities behind that standard.

## Registry

The registry file is:

`config/agent-prompt-registry.json`

It defines:

- prompt IDs
- display names
- categories
- purposes
- local relative file paths
- bound phases
- phase-to-prompt bindings

## Prompt storage

Prompt files are stored in the local app here:

- `prompts/generation/`
- `prompts/qa/`
- `prompts/assessments/`

## Local API

The server exposes:

- `GET /api/prompt-registry`
- `GET /api/prompts/<prompt-id>`

These endpoints return prompt metadata and text so the UI can surface the current prompt set by phase.

## Current generation model

### Policy generation

- master standard: `policy-generation-agent`
- stage analysis: `context-analyzer-agent`
- stage control selection: `control-strategy-engine`
- stage artifact writing: `output-generator-agent`

### Risk assessment

- stage analysis: `context-analyzer-agent`
- stage control selection: `control-strategy-engine`
- stage artifact writing: `output-generator-agent`
- specialist assessment: `risk-management-assistant`
- QA: `risk-qa-agent`

### Vendor risk

- stage analysis: `context-analyzer-agent`
- stage control selection: `control-strategy-engine`
- stage artifact writing: `output-generator-agent`
- specialist assessment: `vendor-risk-assessment-agent`
- QA: `vendor-qa-agent`

## Quality guardrails

All generation prompts are expected to enforce:

- reasoning before generation
- no template language
- no generic company-agnostic prose
- stack and industry references in major sections
- variation in structure and sentence rhythm
- identity-test validation before finalization
