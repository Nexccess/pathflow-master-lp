# Creative Concept Generator Rule v0.1

Status: DRAFT_FOR_RULE_VALIDATION
Input: Design / Marketing Interpretation Rule output
Output: one primary Creative Concept + supporting concept contract

## Purpose
Select one primary store-specific Creative Concept from validated strategic interpretation without designing the final LP.

A Creative Concept is not a slogan and not a visual style.
It is the single strategic idea that should unify message, information priority, visual direction, customer journey emphasis, and diagnosis framing.

## Core Rule
Creative Concept = Customer Need × Store Response × Store-Specific Evidence × Desired Future State

The concept must be specific enough to distinguish the store, broad enough to guide the whole LP, and safe enough to support commercial production.

## Required Output

### 1. Primary Creative Concept
Fields:
- concept_statement
- concept_type
- evidence_ids[]
- source_positioning_candidate
- customer_need
- store_response
- desired_future_state
- confidence: HIGH / MEDIUM / LOW

### 2. Reason to Choose
Fields:
- reason_to_choose
- evidence_ids[]
- claim_risk: HIGH / MEDIUM / LOW

This must explain why this store is relevant to the target need. Generic claims such as "丁寧", "高品質", or "安心" alone are prohibited.

### 3. Message Territory
Define allowed message territory, not final copy:
- must_express[]
- may_express[]
- must_not_express[]

### 4. Customer Journey Emphasis
Select the dominant emotional transition, for example:
- confusion → clarity
- anxiety → reassurance
- dissatisfaction → aspiration
- uncertainty → confidence
- effort → ease

This guides downstream Information Priority and Visual Direction.

### 5. Future State Contract
Fields:
- future_state_statement
- required_visual_or_experiential_proof[]
- evidence_ids[]

The final LP must make this future state imaginable at least once.

### 6. Path-Flow Diagnosis Role
The concept must define why the 5-question diagnosis belongs in this LP.

Fields:
- diagnosis_role
- diagnosis_should_help_user_organize[]
- diagnosis_must_not_do[]

Diagnosis must organize wishes before store contact. It must not become medical diagnosis, guaranteed recommendation, or unsupported treatment selection.

### 7. Store Specificity Check
Hard questions:
- Could this concept be used unchanged for most competitors?
- Does it rely on actual customer voice or store fact evidence?
- Does it explain a meaningful customer × store fit?

If genericness is HIGH: REVIEW_REQUIRED.

### 8. Claim Safety Check
Any concept dependent on an unsupported result, medical effect, guaranteed outcome, ranking, or unverifiable credential is REJECTED.

## Selection Logic
When multiple positioning candidates exist:
1. Prefer the candidate with strongest Customer × Store Fit.
2. Prefer lower genericness.
3. Prefer lower claim risk.
4. Prefer the candidate with clearer Future State Representation opportunity.
5. Do not choose based on aesthetic preference.

## Output Status
- READY_FOR_VISUAL_DIRECTION
- REVIEW_REQUIRED
- INSUFFICIENT_FOR_CONCEPT
- REJECTED_FOR_CLAIM_RISK

## Boundary
This stage may decide:
- primary strategic concept
- reason to choose
- message territory
- emotional transition
- future-state contract
- diagnosis role

It may not decide:
- final headline wording
- colors
- typography
- photography composition
- layout
- section order
- CTA placement

Those belong downstream.

## Validation Cases
Use the same two stores:
- girasol — expected concept centered on current-condition / damage-anxiety consultation
- Lumi — expected concept centered on vague-request / fit-and-suggestion clarity

Success condition:
The generator must produce meaningfully different concepts from the same rule without manual store-specific rule changes.
