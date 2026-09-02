# Store Intelligence Schema Validation #01

## Purpose
Validate Store Intelligence Input Schema v1.0 against two real cases:
- Violet Yokohama — Reference Case #01
- girasol — Rule Validation Case #02

The goal is not to improve either LP. The goal is to test whether the input schema can preserve enough factual, auditable information for downstream interpretation and creative generation.

## Result Summary

### girasol
Status: MIGRATABLE / READY AFTER NORMALIZATION

The existing `store_intelligence.json` contains enough source material to populate the new schema, but it mixes facts and interpretations.

Observed migration issues:
1. `commercial_hypotheses` contains downstream interpretation and must not remain in Store Intelligence.
2. `positioning` mixes service facts, claims, and interpretation.
3. Customer segment signal is descriptive but requires explicit evidence linkage.
4. Existing evidence is URL-level only; field-level Evidence Registry is needed.
5. Visual asset provenance / commercial usage status was not previously represented.
6. Review aggregates exist, but sample-level customer voice evidence is incomplete in the old file.
7. Claim safety guardrails exist and map well to the new schema.

Conclusion:
The new schema improves auditability and prevents creative assumptions from leaking into the factual input layer.

### Violet Yokohama
Status: HISTORICAL_INPUT_GAP

The approved creative package contains approved interpretations and creative outputs, including:
- Message Strategy
- Information Priority
- Visual Direction
- Evidence policy
- CTA placement
- QA result

However, the repository does not contain a pre-creative Store Intelligence record in the new factual format.

Important rule:
Do NOT reverse-engineer the approved creative into factual Store Intelligence and present it as original evidence.

The approved creative package can verify that downstream outputs existed, but it cannot prove the exact raw evidence used to derive them.

Therefore Violet is retained as:
- Reference Case #01 for creative quality and approved outcome
- NOT a complete historical Store Intelligence validation case

This is a migration/audit-history limitation, not a reason to invalidate Violet.

## Schema Findings

### Keep as required
- Fact / Interpretation separation
- Evidence Registry
- Unknown / Missing Data
- Claim Safety
- Visual Asset provenance and usage status
- Customer Voice aggregation with supporting evidence IDs

### Add / strengthen in v1.0 implementation guidance
1. **Source Observation vs Derived Summary**
   Every aggregated field should indicate whether it is:
   - OBSERVED_FACT
   - SOURCE_SUMMARY
   - AGGREGATED_PATTERN
   No STRATEGIC_INTERPRETATION is allowed in Store Intelligence.

2. **Demographic Signal Safety**
   Age/gender/customer-segment signals may be recorded only as observed source distributions or explicit public statements. They must not be converted into a final target persona here.

3. **Field-level Evidence IDs**
   Material claims must reference Evidence Registry IDs, not only URLs.

4. **Asset Usage Status as a gate input**
   Publicly visible imagery may be used for analysis but not automatically treated as commercially reusable.

5. **Historical Migration Status**
   Legacy/reference cases may be marked:
   - COMPLETE
   - PARTIAL
   - HISTORICAL_INPUT_GAP
   This avoids inventing missing pre-schema evidence.

## Validation Decision

Store Intelligence Input Schema v1.0 is directionally valid.

Decision: KEEP AND REFINE, not redesign.

The schema is suitable to proceed to structured real-store normalization, with the following implementation priorities:
- normalize girasol as the first complete v1 case
- preserve Violet as a creative reference with historical input gap
- use additional stores to test whether the same input shape remains sufficient across different positioning types

## Next Step
1. Normalize girasol into `store_intelligence_v1.json`.
2. Create explicit Violet migration-gap record.
3. Test one additional contrasting salon before freezing schema v1.0.
4. Then proceed to Design / Marketing Interpretation Rule.
