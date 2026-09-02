# 11A Design Intelligence Layer v0.1

Status: OPERATIONAL_SPEC
Scope: 11A LP Production Engine only

## 1. Purpose

The Design Intelligence Layer converts a store-specific Creative Concept into structured design candidates without allowing an external design recommender to override Path-Flow evidence, claim safety, or store specificity.

UI/UX Pro Max is a candidate generator and UX/design reference source. It is not the final decision authority.

## 2. Position in the 11A pipeline

Store Intelligence
→ Design / Marketing Interpretation
→ Creative Concept
→ UI/UX Pro Max Candidate Generation
→ Path-Flow Design Intelligence Filter
→ Visual Direction
→ LP Generator
→ Creative QA
→ Approved LP

This layer does not include diagnostic AI, question flow, result generation, inquiry processing, tracking, or 11B functionality.

## 3. Authority boundary

### 3.1 UI/UX Pro Max MAY propose

- landing-page pattern candidates
- section/layout patterns
- style candidates
- color-family candidates
- typography candidates
- effects and motion guidance
- accessibility guidance
- responsive guidance
- UX anti-patterns
- implementation-oriented UI/UX cautions

All such outputs are CANDIDATES until filtered by 11A.

### 3.2 UI/UX Pro Max MUST NOT decide

- factual store claims
- customer-value claims unsupported by evidence
- the store's final positioning
- final Creative Concept
- whether a public image is commercially usable
- final store-specific color or typography direction
- final section order when it conflicts with Customer Journey evidence
- final CTA role
- approval status
- Sales Ready status
- Live Send status

### 3.3 Path-Flow 11A retains final authority over

- Evidence Traceability
- Creative Concept alignment
- Store Specificity
- Genericness Risk
- Claim Safety
- Existing Brand Evidence
- Customer Journey fit
- Mobile First constraints
- QA status
- Approved LP status

## 4. Required inputs

The layer consumes only versioned upstream artifacts:

- Store Intelligence Schema v1.0 output
- Design / Marketing Interpretation Rule output
- Creative Concept output
- Production Rule v0.2 constraints

Unknown or missing facts remain UNKNOWN. The layer must not infer missing commercial rights, service facts, prices, effects, or claims.

## 5. Candidate generation contract

The UI/UX Pro Max adapter receives a derived query composed from upstream interpretation and concept signals. The query may include:

- product/page type
- industry/category
- primary customer signal
- primary store value signal
- Creative Concept tone
- visual density direction
- consultation/choice/support intent

The query must not introduce unsupported store facts.

The adapter records:

- query
- project/store identifier
- executed command arguments excluding machine-specific executable paths where possible
- return code
- stdout
- stderr
- timestamp
- adapter status

Adapter status values:

- PASS
- TOOL_NOT_FOUND
- EXECUTION_FAILED
- EMPTY_OUTPUT

A PASS means only that candidate generation executed successfully. It does not mean the design is accepted.

## 6. Path-Flow Design Intelligence Filter contract

Each recommendation is evaluated against six mandatory filters:

1. Evidence Alignment
2. Creative Concept Alignment
3. Store Specificity
4. Genericness Risk
5. Claim Safety
6. Existing Brand Evidence

Recommended disposition values:

- ACCEPT
- MODIFY
- REJECT
- REVIEW_REQUIRED

The filter must preserve both the original UI/UX Pro Max recommendation and the 11A disposition/reason so that the decision remains auditable.

## 7. Non-negotiable rejection conditions

A candidate must not pass unchanged when any of the following applies:

- conflicts with store evidence
- conflicts with the approved Creative Concept
- introduces an unsupported factual or quality claim
- treats public visibility of an asset as commercial usage permission
- creates store specificity only through superficial color substitution
- materially resembles a generic industry preset without store-specific rationale
- contradicts confirmed existing brand evidence without an explicit documented reason
- weakens mobile readability, accessibility, CTA clarity, or customer journey requirements

## 8. Example: girasol

If UI/UX Pro Max proposes pink/lavender because the page belongs to the beauty industry, that recommendation remains a candidate only.

If the store evidence and Creative Concept support a deep muted green / warm ivory direction, 11A may reject or modify the generic beauty-industry palette while retaining useful pattern, typography, accessibility, or UX guidance.

This is an expected result, not a tool failure.

## 9. Output boundary

The Design Intelligence Layer outputs a filtered Design Intelligence artifact for the Visual Direction Generator.

It must not output an Approved LP directly.

## 10. Gate rules

- UI/UX Pro Max execution PASS ≠ Design Intelligence PASS
- Design Intelligence PASS ≠ Visual Direction PASS
- Visual Direction PASS ≠ LP Approved
- Technical deploy success ≠ product completion
- 11A Approved LP ≠ PathFlow
- Sales Ready and Live Send remain blocked until the separately defined gates are passed

## 11. Direction-drift rule

If UI/UX Pro Max recommendations conflict with upstream evidence, Creative Concept, Production Rule v0.2, or responsibility boundaries, the system must not silently rewrite the upstream specification.

It must preserve the conflict and return REVIEW_REQUIRED or REJECT for that candidate.
