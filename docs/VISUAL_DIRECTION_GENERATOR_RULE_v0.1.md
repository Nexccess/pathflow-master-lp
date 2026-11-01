# Visual Direction Generator Rule v0.1

Status: DRAFT_FOR_RULE_VALIDATION
Input: Creative Concept Generator output + Store Intelligence visual facts/assets
Output: evidence-aware Visual Direction contract

## Purpose
Translate the approved strategic concept into a store-specific visual system without designing the final LP.

Visual Direction must explain why the chosen visual treatment fits the store and concept. It must not be an arbitrary aesthetic choice.

## Core Principle
Visual Direction = Creative Concept × Existing Brand Signals × Customer Emotion × Available Visual Evidence × Category Profile

## Required Output

### 1. Visual Objective
- visual_objective
- intended_first_impression
- emotional_transition_to_support

### 2. Color Direction
Fields:
- primary_color_direction
- secondary_color_direction
- accent_color_direction
- background_direction
- saturation_level
- contrast_level
- evidence_or_reasoning

Selection order:
1. existing brand color if reliable and usable,
2. observed interior / photography / logo signal,
3. customer and concept emotional fit,
4. category-safe fallback.

Never choose color only because it is attractive.

If evidence is weak:
- EXISTING_BRAND_FOLLOW
- CATEGORY_SAFE_NEUTRAL
- REVIEW_REQUIRED

### 3. Typography Direction
- heading_style
- body_style
- emphasis_style
- tone
- legibility_constraints

Typography must support the concept and customer, while mobile readability remains fixed.

### 4. Photography Direction
- primary_subjects[]
- secondary_subjects[]
- future_state_visuals[]
- evidence_visuals[]
- avoid_visuals[]
- usage_constraints[]

The system must distinguish:
- Store Proof
- Customer Future State
- Atmosphere / Experience
- Decorative imagery

Decorative imagery may not substitute for Visual Proof.

### 5. Layout / Density Direction
- overall_density: LOW / MEDIUM / HIGH
- whitespace_direction
- hero_structure_direction
- visual_text_balance
- card_usage_direction
- full_bleed_usage_direction
- section_variation_direction

This is direction, not final layout.

### 6. Category Profile
For Beauty:
- visual rhythm is mandatory,
- text-dominant section repetition should be avoided,
- Future State Representation must be visibly supported,
- beauty/result/style imagery should have meaningful presence,
- image quality must support commercial first impression.

Future categories may define separate profiles.

### 7. CTA Treatment Direction
CTA role is fixed by Production Rule, but treatment may vary.

Fields:
- visual_prominence
- sticky_cta_behavior_direction
- obstruction_risk_limit
- button_tone

Rule:
CTA must be obvious but must not dominate or materially obstruct visual consumption.

### 8. Visual Proof Contract
- proof_required: true/false
- required_proof_types[]
- minimum_proof_role
- evidence_limitations[]

For Beauty, Future State Representation and at least one meaningful Visual Proof role are required.

### 9. Freedom Boundary
Fixed:
- mobile readability
- evidence/claim safety
- Future State Representation requirement
- CTA role
- category profile QA

Controlled:
- color direction
- density
- visual proof type
- section rhythm direction

Free downstream creative:
- exact composition
- exact spacing
- exact decorative treatment
- exact typography implementation
- exact image crop

### 10. Commercial Usage Safety
Publicly visible image does not imply commercial reuse permission.

If store assets are NOT_CONFIRMED for commercial usage, Visual Direction may reference their visual role but final production must use:
- confirmed store-provided assets,
- licensed assets,
- generated assets where appropriate,
- or other approved sources.

### 11. Genericness Check
Reject/review if:
- the same palette and photo direction could be applied unchanged to most category peers,
- visual direction ignores the primary Creative Concept,
- visual proof is decorative rather than customer-relevant,
- brand signals are overwritten without reason.

## Output Status
- READY_FOR_LP_GENERATION
- REVIEW_REQUIRED
- INSUFFICIENT_VISUAL_EVIDENCE
- REJECTED_FOR_USAGE_RISK

## Validation Cases
Apply to:
- girasol: condition-aware / damage-anxiety / calm consultation
- Lumi: fit-and-suggestion / style-direction clarity

Success condition:
The rule should produce visibly different direction while maintaining the same quality and category standards.
