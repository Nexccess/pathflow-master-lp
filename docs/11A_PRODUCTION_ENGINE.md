# 11A-Production Engine

## Purpose
Generate store-specific Approved Creative Packages at production scale while preserving a consistent decision and QA standard.

11A is not a one-off LP design workshop. Its primary objective is to produce different store creatives through the same reproducible decision logic.

AI must not score design by taste. AI checks compliance with the Production Rule.

## Product Positioning
Path-Flow initial creative is a high-quality first proposal used to obtain a response, not a final one-shot custom design.

Standardized Core:
- Store-specific LP derived from public evidence and customer voice
- Production Rule compliant structure
- Commercial minimum quality
- Path-Flow diagnosis entry point

Adaptive Customization after response:
- Design preference tuning
- Reservation flow / Google Calendar
- Analytics / GA4
- Stored interaction data
- Continuous optimization based on response data

## Input
- Lead / Store Data
- Store Intelligence
- Public evidence / customer voice inputs

## Pipeline
Lead / Store Data
→ Store Intelligence
→ Customer Voice
→ Design / Marketing Interpretation
→ Creative Concept
→ Visual Direction
→ Information Priority
→ Creative Assets
→ LP Creative Generation
→ Rule Compliance Check
→ Hard Gate
→ Design QA
→ Commercial QA
→ AUTO_PASS / REVIEW_REQUIRED / REJECTED
→ Kei Review when required
→ Approved Creative Package

## Production Rule v0.2

### Core design principles
All LPs must apply:
- Contrast
- Repetition
- Proximity
- Alignment
- Mobile First
- Evidence-based claims
- Customer Journey based information order

### Store Specificity
Do not use a simple item-count test alone. Judge semantic store specificity.

Required store-specific core:
- Creative Concept
- Primary Message / Reason to Choose
- Customer Voice or Evidence Connection

In addition, at least one of the following must be store-specific:
- Visual Direction
- Headline
- Information Priority
- Visual Proof

Store-name substitution alone is REJECTED.

### Evidence Traceability
Major claims must preserve:
Claim → Evidence → Interpretation → LP Expression

The system must retain this mapping for audit.

### Hard Gates
Any material failure prevents AUTO_PASS.

Gate A — Evidence
- Store-specific claims have evidence
- Customer voice is not exaggerated
- Price / awards / access / facts are correct
- Unverified treatment effects are not generated

Gate B — Store Specificity
- Required semantic store specificity is present

Gate C — Mobile
- No horizontal overflow
- No clipped text
- CTA does not materially obstruct content
- Images do not break layout
- Tap targets are adequate

Gate D — Commercial
At least one valid chain must exist:
Customer Desire × Store Strength × Evidence

### Global Visual Rhythm Rule
Avoid excessive repetition of the same information and presentation pattern. The sequence must support understanding and emotional progression.

Category-specific profiles may define stricter rules.

#### Beauty Profile
- Avoid 3 consecutive text-dominant sections
- Introduce meaningful visual change approximately every 2–3 viewport heights
- Use multiple meaningful visual section types where evidence/assets permit
- Avoid repeating the same card layout across 3 or more consecutive sections
- Use visual structures such as full-bleed / grid / editorial / card intentionally, not decoratively

### Future State Representation Rule
At least one section must help the customer imagine a better state after using the service.

Beauty implementations may include:
- Style
- Result imagery
- Hair texture
- Lifestyle visual
- Salon experience

Before / After is not mandatory and must never be fabricated.

### Customer Voice Rule
Customer voice must be transformed as:
Review / Voice → Common Evaluation → Store Value → LP Expression

Evidence visibility should remain sufficient to avoid the impression of invented advertising copy.

### CTA Role
CTA must connect content understanding to wish organization.

Default Path-Flow role:
- Not a reservation form
- Not an automatic medical / treatment diagnosis
- A short pre-contact process to organize current concerns, desired state, and things to avoid

Default CTA copy:
希望を整理する（無料・5問）

CTA must remain visible without materially obstructing content.

## Freedom Boundary

### Fixed Layer
Do not change per store:
- Production Process
- Evidence Requirement
- Customer Journey philosophy
- Mobile First
- QA Structure
- CTA Role
- Path-Flow Diagnosis Role
- Claim Safety
- Evidence Traceability

### Controlled Layer
May change according to Store Intelligence / Interpretation:
- Information Priority
- Section Order
- CTA Position
- Visual Density
- Visual Proof format

### Free Creative Layer
Designer / AI has freedom within the Production Rule:
- Color
- Typography Direction
- Photography Composition
- Layout Composition
- Section Presentation
- Motion concept
- Shapes
- Whitespace
- Decorative Treatment
- Headline expression

## QA Output Contract
Formal QA output must be compliance-oriented, not taste scoring.

Example:

Hard Gate: PASS
Design QA: PASS
Commercial QA: REVIEW_REQUIRED

Failed Rules:
- VISUAL_RHYTHM_BEAUTY
- FUTURE_STATE_REPRESENTATION

Revision Instruction:
- Add a meaningful future-state visual section
- Break up consecutive text-dominant sections

Do not use subjective scoring such as “78 points” or “needs more luxury” as the formal engine decision.

## Output Contract
Only Approved Creative Packages may flow to 11B-Integration.

Required package fields:
- LP Design
- Message Strategy
- Information Priority
- Visual Direction
- Creative Assets
- Evidence Map
- CTA Placement
- Diagnosis Entry Point
- creative_status
- creative_version
- QA result
- approval_type (HUMAN_APPROVED / AUTO_APPROVED)

## Validation Cases
- Violet = Reference Case #01
- girasol = Rule Validation Case #02

The objective of validation cases is not to perfect one creative indefinitely. They are used to verify that the same Production Rule can create commercially acceptable but store-specific outputs.

## Initial Validation
Run several stores to approximately 10 stores through AI QA + human review. Measure agreement before expanding AUTO_PASS.

## Formal Build Order
1. Production Rule v0.2
2. Store Intelligence Input Schema
3. Design / Marketing Interpretation Rule
4. Creative Concept Generator
5. Visual Direction Generator
6. LP Generator
7. Creative QA Engine

## Final Connection
11A-Production → Approved Creative Package → 11B-Integration
