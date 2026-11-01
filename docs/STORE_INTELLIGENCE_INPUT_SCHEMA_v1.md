# Store Intelligence Input Schema v1.0 — Draft

## Purpose
Provide every store to 11A in the same auditable input shape before interpretation, concept generation, visual direction, LP generation, and QA.

Store Intelligence must separate FACT from INTERPRETATION.

Do not decide colors, design concept, target persona, or creative direction in this stage unless they are directly stated by the store itself.

## Principles
1. Fact first
2. Evidence required for material claims
3. Unknown is allowed
4. No forced inference
5. Source freshness must be recorded where practical
6. Customer voice must be summarized without exaggeration
7. Visual assets must include provenance / usage status
8. Data must be reusable by downstream agents

## Required Sections

### 1. Identity
Required:
- store_id
- campaign_id
- store_name
- category
- area
- official_website_url

Optional:
- brand_name
- group_name
- branch_name
- google_maps_url
- hotpepper_url
- instagram_url
- other_public_urls

### 2. Contact / Location Facts
Fields:
- address
- nearest_station
- walking_minutes
- phone
- email
- inquiry_url
- reservation_url
- business_hours
- closed_days

Each factual value should include source evidence when used in LP.

### 3. Service / Menu Facts
Fields:
- major_services[]
- signature_services[]
- price_examples[]
- product_or_treatment_names[]
- service_notes[]

Rules:
- Do not infer effectiveness from service name
- Separate “offered” from “proven result”
- Price requires current public evidence

### 4. Customer Voice Raw Evidence
Keep selected source excerpts / structured summaries.

Fields:
- review_sources[]
- review_count_observed
- rating_observed
- positive_voice_samples[]
- negative_or_anxiety_voice_samples[]
- recurring_keywords[]

For each voice sample:
- source
- date_if_known
- customer_attribute_if_public
- summary
- raw_excerpt_if_allowed
- evidence_url

### 5. Customer Voice Aggregation
This stage remains descriptive, not creative.

Fields:
- repeated_praise_themes[]
- repeated_concern_themes[]
- repeated_desire_themes[]
- repeated_experience_themes[]
- repeated_result_themes[]

For each theme:
- theme_name
- supporting_evidence_ids[]
- evidence_count
- confidence: HIGH / MEDIUM / LOW

### 6. Store Facts / Differentiators
Fields:
- stated_store_philosophy[]
- stated_strengths[]
- facilities[]
- staff_features[]
- accessibility_features[]
- location_features[]
- awards_or_credentials[]
- explicit_target_statements[]

Important:
Do not mark a point as a differentiator merely because it exists. Differentiation is decided downstream in Design / Marketing Interpretation.

### 7. Brand / Existing Visual Facts
Fields:
- logo_available
- logo_source
- existing_primary_colors[]
- existing_secondary_colors[]
- typography_observed
- website_visual_tone_observed[]
- interior_visual_tone_observed[]
- exterior_visual_tone_observed[]
- photo_subjects_observed[]

These are observations, not creative decisions.

### 8. Visual Assets Inventory
For every asset:
- asset_id
- asset_type
- source_url_or_repo_path
- subject
- orientation
- resolution_if_known
- visual_quality: HIGH / MEDIUM / LOW
- commercial_usage_status: CONFIRMED / NOT_CONFIRMED / RESTRICTED / UNKNOWN
- evidence_source

Asset types may include:
- logo
- hero
- interior
- exterior
- staff
- style
- result
- texture
- treatment
- counseling
- product

Rule:
Public visibility does not equal commercial usage permission.

### 9. Competitor / Market Context
Optional in v1.0, but structured when available.

Fields:
- nearby_competitors[]
- observed_positioning_patterns[]
- common_market_claims[]
- obvious_similarity_risks[]

This section stores observations only. Strategic differentiation is downstream.

### 10. Claim Safety / Restricted Interpretation
Fields:
- prohibited_claims[]
- unverified_claims[]
- medical_or_treatment_risk_terms[]
- guarantee_risk_terms[]
- fact_conflicts[]

Examples:
- unverified treatment effects
- guaranteed repair / cure
- medical diagnosis language
- unsupported “No.1” / award claims

### 11. Evidence Registry
Every important fact or voice item gets an evidence_id.

Minimum fields:
- evidence_id
- evidence_type: OFFICIAL / REVIEW / GOOGLE / SNS / THIRD_PARTY / IMAGE
- source_name
- source_url
- captured_at_or_checked_at
- supported_fields[]
- confidence: HIGH / MEDIUM / LOW
- notes

### 12. Unknown / Missing Data
Required section.

Fields:
- missing_required_fields[]
- missing_optional_fields[]
- unresolved_conflicts[]
- insufficient_visual_assets[]
- insufficient_customer_voice

Rule:
Never invent missing values.

## Minimum Viable Store Intelligence Gate
Before Design / Marketing Interpretation can run, the store must have at least:
- store_name
- category
- area
- one official or high-confidence public source
- at least one customer voice source OR explicit store philosophy/strength source
- at least one usable visual asset OR explicit “visual asset insufficient” flag
- Evidence Registry
- Unknown / Missing Data section

If the minimum gate fails:
STORE_INTELLIGENCE_STATUS = INSUFFICIENT

If it passes:
STORE_INTELLIGENCE_STATUS = READY_FOR_INTERPRETATION

## Output Status
Allowed values:
- READY_FOR_INTERPRETATION
- INSUFFICIENT
- CONFLICT_REVIEW_REQUIRED

## Separation of Responsibility
Store Intelligence answers:
“What do we know about this store, its customers, its services, and its visible brand?”

It does not answer:
- What is the Creative Concept?
- Who should be the final target persona?
- What colors should the new LP use?
- What should the headline say?
- What section order should be used?

Those belong to downstream interpretation and generation stages.
