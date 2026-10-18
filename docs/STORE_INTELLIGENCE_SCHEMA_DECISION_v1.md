# Store Intelligence Input Schema v1.0 — Operational Decision

Status: OPERATIONAL_V1
Date: 2026-09-02

## Validation Cases
- Violet Yokohama — Reference Case #01: HISTORICAL_INPUT_GAP for pre-creative evidence, creative reference remains valid.
- girasol — Rule Validation Case #02: successfully normalized to v1.
- Lumi 横浜駅店 — contrasting validation case: successfully normalized to v1.

## Decision
The Store Intelligence Input Schema v1.0 is sufficient to enter operational use.

No redesign is required.

## Confirmed strengths
1. Separates factual observation from strategic interpretation.
2. Supports different salon positioning types without changing the input shape.
3. Preserves Evidence Registry and Unknown/Missing Data.
4. Prevents unsupported facts from being silently invented.
5. Preserves visual asset provenance and commercial usage uncertainty.
6. Supports customer voice aggregation without forcing target/persona decisions.

## Refinements adopted as implementation rules
- Observation types: OBSERVED_FACT / SOURCE_SUMMARY / AGGREGATED_PATTERN.
- STRATEGIC_INTERPRETATION is prohibited in Store Intelligence.
- Customer demographic signals are observations only; target persona is downstream.
- Field-level Evidence IDs are preferred for material claims.
- Legacy cases may carry migration status: COMPLETE / PARTIAL / HISTORICAL_INPUT_GAP / COMPLETE_WITH_LEGACY_EVIDENCE_LIMITATIONS.

## Freeze Boundary
Schema v1.0 is now the common input contract for 11A salon validation.

Changes require one of:
- repeated failure across multiple stores,
- inability to support a new category profile,
- audit / safety deficiency,
- downstream interpretation repeatedly requiring data that v1 cannot represent.

Do not change the schema for one store's creative preference.

## Next Stage
Proceed to Design / Marketing Interpretation Rule.

Input: Store Intelligence v1.0
Output: evidence-backed strategic interpretation, without yet generating final LP design.
