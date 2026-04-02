# SOC 2 Framework Intake

- Intake date: `2026-03-18`
- Status: `loaded`
- Working approach: `full SOC 2 control and evidence data loaded from AICPA Trust Services Criteria 2017 (revised 2022)`

## Framework files

| File | Description |
|---|---|
| `soc2-controls.json` | 63 SOC 2 controls across all 5 TSC categories, with descriptions, evidence requirements, auditor test procedures, ISO 27001 and NIST CSF 2.0 mappings |
| `soc2-evidence.json` | 63 evidence tracking entries, one per control, with owner, frequency, status, and collection fields |

## Trust Services Categories

| TSC | Prefix | Controls | Required |
|---|---|---|---|
| Security | CC1–CC9 | 34 | Yes (mandatory) |
| Availability | A1 | 4 | No |
| Processing Integrity | PI1 | 5 | No |
| Confidentiality | C1 | 2 | No |
| Privacy | P1–P8 | 18 | No |

## Working basis

- SOC 2 Trust Services Categories: `Security`, `Availability`, `Processing Integrity`, `Confidentiality`, `Privacy`
- Primary reference: `2017 Trust Services Criteria (With Revised Points of Focus - 2022)`
- Cross-framework mappings included: ISO 27001:2022 and NIST CSF 2.0

## Notes

- Security (CC1–CC9) is mandatory for all SOC 2 engagements.
- Additional TSC categories are in-scope based on client selection during onboarding.
- Exact AICPA criterion wording is paraphrased; authoritative text is in the licensed AICPA publication.
- Phase 4 control mapping uses control IDs from `soc2-controls.json` (e.g. CC6.1, A1.2, PI1.3).
