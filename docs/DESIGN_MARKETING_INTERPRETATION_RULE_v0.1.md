# Design / Marketing Interpretation Rule v0.1

Status: DRAFT_FOR_RULE_VALIDATION
Input contract: Store Intelligence Input Schema v1.0

## Purpose
Convert factual Store Intelligence into an evidence-backed strategic interpretation that can drive Creative Concept and Visual Direction.

This stage may interpret. It may not yet design the final LP.

## Core Principle
Every strategic interpretation must be traceable to Store Intelligence evidence.

The stage answers:
- Who appears most relevant to speak to?
- What customer desire is visible?
- What customer anxiety is visible?
- What store strength answers that desire/anxiety?
- Why might this store be chosen?
- What emotional value does the store appear to provide?
- What must the LP avoid claiming?
- What brand/visual signals should be respected downstream?

It does NOT yet answer:
- final headline wording
- final color palette
- final section order
- final layout
- final CTA placement

Those belong to later stages.

## Required Output

### 1. Customer Signals
- primary_customer_signal[]
- secondary_customer_signal[]
- customer_desires[]
- customer_anxieties[]
- customer_decision_barriers[]

Each item requires:
- statement
- evidence_ids[]
- confidence: HIGH / MEDIUM / LOW

### 2. Store Value Signals
- store_strength_signals[]
- trust_signals[]
- experience_signals[]
- result_signals[]

Do not call a feature a differentiator yet unless evidence supports comparison or meaningful distinctiveness.

### 3. Customer × Store Fit
Generate at least one candidate fit statement:

Customer Desire or Anxiety
×
Store Strength
×
Evidence
=
Potential Reason to Choose

Required fields:
- customer_need
- store_response
- evidence_ids[]
- fit_strength: HIGH / MEDIUM / LOW
- notes

If no credible fit exists:
INTERPRETATION_STATUS = INSUFFICIENT_FOR_CONCEPT

### 4. Positioning Candidates
Generate up to 3 positioning candidates.

For each:
- positioning_statement
- supporting_evidence_ids[]
- customer_relevance
- store_specificity
- risk_of_genericness: HIGH / MEDIUM / LOW
- claim_risk: HIGH / MEDIUM / LOW

Do not choose final Creative Concept in this stage.

### 5. Brand Personality Signals
Allowed examples:
- calm
- energetic
- premium
- friendly
- technical
- natural
- urban
- playful
- conservative

Every signal must state whether it came from:
- official brand language
- visual observation
- customer voice
- service / price / space signal

Do not infer personality from one arbitrary color or one photo alone.

### 6. Existing Visual Constraints / Opportunities
Output observations for downstream Visual Direction:
- brand_elements_to_respect[]
- visual_assets_with_high_value[]
- visual_asset_gaps[]
- visual_usage_restrictions[]
- visual_genericness_risks[]

No final palette is chosen here.

### 7. Future State Opportunity
Production Rule v0.2 requires Future State Representation downstream.

Interpretation must identify:
- desired_future_state[]
- evidence_ids[]
- possible_visual_proof_types[]

Examples for beauty:
- easier daily manageability
- natural gloss / texture
- confidence in consultation
- feeling understood before treatment

Do not invent a result unsupported by evidence.

### 8. Claim Safety Translation
Convert Store Intelligence safety data into creative restrictions:
- prohibited_message_directions[]
- claims_requiring_recheck[]
- wording_that_must_be_qualified[]

### 9. Genericness Check
A strategic interpretation is not acceptable if it could describe most competitors with no meaningful change.

Check:
- Does the interpretation use store-specific customer evidence?
- Does it use store-specific service / experience / brand evidence?
- Is the proposed reason-to-choose more specific than "丁寧", "高品質", "安心" alone?

If genericness is HIGH, return REVIEW_REQUIRED before Creative Concept generation.

## Hard Gates

### Gate A — Evidence Traceability
All primary interpretation outputs require evidence IDs.
Failure: REJECTED_FOR_INTERPRETATION

### Gate B — Customer × Store Fit
At least one credible Customer Need × Store Response relationship must exist.
Failure: INSUFFICIENT_FOR_CONCEPT

### Gate C — Claim Safety
No medical, guaranteed, fabricated ranking, or unsupported treatment effect may become a strategic selling point.
Failure: REJECTED_FOR_INTERPRETATION

### Gate D — Store Specificity
The main interpretation cannot be composed only of generic category language.
Failure: REVIEW_REQUIRED

## Output Status
- READY_FOR_CONCEPT
- REVIEW_REQUIRED
- INSUFFICIENT_FOR_CONCEPT
- REJECTED_FOR_INTERPRETATION

## Rule Boundary
This stage is Controlled Layer.

It is not Free Creative Layer.

Therefore:
- evidence controls interpretation,
- interpretation narrows later creative freedom,
- but final visual/design expression remains downstream.

## Validation Plan
Run the rule against:
1. girasol — consultation / damage-anxiety oriented case
2. Lumi — vague-request / fit-and-suggestion oriented case

Expected result:
Different positioning candidates must emerge from the same rule without changing the rule itself.
