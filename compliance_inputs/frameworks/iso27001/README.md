# ISO 27001:2022 Framework Intake

- Intake date: `2026-03-18`
- Status: `loaded`
- Working approach: `full ISO 27001:2022 Annex A control and evidence data loaded from ISO/IEC 27001:2022`

## Framework files

| File | Description |
|---|---|
| `iso27001-controls.json` | 93 Annex A controls across all 4 themes, with descriptions, evidence requirements, auditor test procedures, SOC 2 and NIST CSF 2.0 cross-mappings |
| `iso27001-evidence.json` | 93 evidence tracking entries, one per control, with owner, frequency, status, and collection fields |

## Annex A Themes

| Theme | Code | Controls | Description |
|---|---|---|---|
| Organizational | A.5 | 37 | Policies, roles, supplier management, incident management, business continuity, compliance |
| People | A.6 | 8 | Screening, employment terms, training, disciplinary, termination, remote working |
| Physical | A.7 | 14 | Physical perimeters, entry controls, equipment protection, secure disposal |
| Technological | A.8 | 34 | Endpoint devices, access control, cryptography, vulnerability management, secure development, network security |

## Legacy source files

| File | Status |
|---|---|
| `iso27001_all.xlsx` | Superseded by `iso27001-controls.json` — retained for reference |
| `ISO27001-V2022-v2.xlsx` | Superseded — retained for reference |

## Notes

- All 93 controls from Annex A of ISO/IEC 27001:2022 are included.
- Unlike SOC 2, ISO 27001 does not use category scoping — all 93 controls are assessed; some may be excluded via Statement of Applicability (SoA) with documented justification.
- Cross-framework mappings to SOC 2 Trust Services Criteria and NIST CSF 2.0 are included per control.
- Phase 4 control mapping uses control IDs from `iso27001-controls.json` (e.g. A.5.1, A.8.5, A.6.3).
- Exact ISO control wording is paraphrased; authoritative text is in the licensed ISO/IEC 27001:2022 publication.
