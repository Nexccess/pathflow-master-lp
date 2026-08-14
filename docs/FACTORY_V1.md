# Path-Flow Lite Factory v1

## Purpose
Mass-produce a useful, believable "one receptionist at the front desk" experience for local service businesses. The product is not the technology itself; the LP must help an end user understand what to ask, choose, or do next.

## Recovered source facts
Historical pipeline:
1. Google Places lead collection -> 1,560 rows.
2. Website contact discovery -> form_url / email.
3. Historical outreach selector -> 921 rows where a non-HotPepper form URL OR an email existed.

The 921 rule is preserved in `pipeline/target_selector.py` for reproducibility, not treated as a permanent business rule.

## Factory gates

### Gate A — Outreach route
Classify the historical 921 candidates. Flag obvious false positives (dummy/example email, telemetry email, booking/reservation URL masquerading as a contact form). Do not automate sending from unreviewed legacy data.

### Gate B — Store facts
Build a store card from verifiable facts only. Unknown stays unknown. Keep source/provenance per fact where practical.

Minimum store card:
- lead/store id
- company name
- category
- area/address
- phone/official website
- rating and review count when legitimately available
- confirmed services/menu facts
- confirmed payment/access/business-hours facts
- positive review-derived themes only when the data source and permitted use are clear

### Gate C — Claims policy
Never invent quality claims. Words equivalent to "careful", "safe", "high quality", "skilled", etc. require concrete positive evidence. Negative reviews are not converted into marketing copy and are not euphemized into claims.

### Gate D — Reception design
Generate questions for the end customer, not the business owner. The AI should behave like a restrained receptionist/adviser: ask first, organize the customer's needs, explain likely options, and provide a gentle next step. It must not invent services, prices, availability, medical/legal efficacy, or unsupported quality.

### Gate E — LP generation
Render the common template from structured store data. Store-specific data and common presentation remain separate. One Vercel project serves many store IDs.

### Gate F — Automated QA
Fail publication when required facts are missing, unsupported claims appear, negative-review content leaks into marketing copy, or an AI recommendation references an unconfirmed service.

### Gate G — Human sample review
Before scaling a new category/region/model version, review a small sample in a browser for two questions:
1. Would the business recognize this as its own shop?
2. Would an end customer think "this is useful / I want to try this"?

## Rollout
10-store golden set -> medium batch -> production batch. Do not jump directly to all historical targets.

## Model roles
- Offline batch generation: local Ollama/Qwen may be used after golden-set accuracy testing.
- Live customer reception: hosted model/API remains necessary for the deployed LP unless architecture changes.

## Next implementation milestone
Create a normalized store-card JSON schema and a generator that can turn verified source data into store profiles consumed by the existing Lite page and reception API.
