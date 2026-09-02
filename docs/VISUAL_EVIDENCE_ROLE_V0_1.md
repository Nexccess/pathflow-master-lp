# 11A Visual Evidence Role v0.1

## Purpose
Prevent illustrative or generated visuals from being mistaken for actual store evidence.

## Roles
- STORE_EVIDENCE: verified real-store visual evidence with confirmed commercial usage rights.
- ILLUSTRATIVE: atmosphere, concept, or style-support visual that must not be treated as proof of actual staff, customers, facilities, or treatment results.
- UNCLASSIFIED: not ready for commercial review.

## GENERATED asset rule
All `source_type = GENERATED` assets are automatically classified as:
- `evidence_role = ILLUSTRATIVE`
- `store_evidence_status = NOT_STORE_EVIDENCE`

Disclosure level:
- Hero: `LIGHT` — visitor-facing note that the visual is an image/illustration.
- Consultation / Style Set and other evidence-adjacent visuals: `FULL` — explicit notice that the visual is AI-generated and is not an actual treatment example, staff member, or customer photo.

## Commercial QA gate
Commercial QA must remain blocked unless:
1. Every GENERATED visual is explicitly classified as ILLUSTRATIVE.
2. No GENERATED visual is marked or implied as STORE_EVIDENCE.
3. Required visitor-facing disclosures are rendered.
4. Real store evidence, when used later, is separately traceable and has `commercial_usage_status = CONFIRMED`.

A Visual Evidence Guard PASS means only `READY_FOR_HUMAN_REVIEW`. It does not set Sales Ready or Live Send.
