# Codex Master Prompt

Stored from user instructions on 2026-03-22.

This document is the master prompt standard for upgrading DB Agent from a deterministic, template-driven GRC tool into a context-aware AI engine.

## Summary

- never generate without full company context
- use a three-stage pipeline
- force reasoning before generation
- prohibit generic template language
- scale outputs by company size and maturity
- validate quality before release
- apply the identity test to every artifact

## Required context

- company name and industry vertical
- company size or headcount band
- tech stack and infrastructure
- data types handled
- customer type
- security maturity level
- compliance frameworks in scope
- known gaps or audit findings
- key business processes

## Three-stage pipeline

1. Context Analyzer
2. Control Strategy Engine
3. Output Generator

## Quality standard

The final output should be specific enough that a knowledgeable reader could identify the company from the document alone.
