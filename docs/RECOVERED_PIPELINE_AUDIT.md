# Recovered Claude Pipeline Audit

## Conclusion

The recovered Claude files are useful, but they must not be executed unchanged.
They contain a sound *shape* for batch generation, while several assumptions do not match the actual recovered database or the current Path-Flow Lite product direction.

## What was recovered

The prior design already contemplated:

`lead DB -> extract store -> AI copy -> template -> per-store output -> AI diagnosis -> Git push -> Vercel`

It also supported single-store dry runs, limited batch tests, full batches, and automatic Git push.

These ideas remain reusable.

## Actual recovered database (verified from leads_database.db)

Table: `leads`

Columns:

- id
- place_id
- company_name
- category
- area
- address
- phone
- website_url
- rating
- user_ratings_total
- status
- created_at
- form_url
- email
- pathflow_url
- processed_at
- error_message

Verified counts in the recovered DB:

- total: 1,560
- place_id: 1,560
- phone: 1,560
- rating: 1,560
- user_ratings_total: 1,560
- website_url: 1,492
- form_url: 1,156
- email: 341
- existing pathflow_url: 10
- status: UNPROCESSED 1,540 / PROCESSED 10 / FAILED 10

The 10 existing Path-Flow IDs are:

`37, 38, 40, 43, 44, 45, 46, 48, 50, 51`

## Critical mismatches in the recovered scripts

### 1. Wrong table / target assumptions

The old guide assumes:

- `TABLE_NAME=stores`
- `TARGET_FLAG_COLUMN=is_dm_target`

The actual database has table `leads` and does **not** contain an `is_dm_target` column.
Therefore the old `--target-only` implementation cannot reproduce the claimed 921 targets from this DB as supplied.

**Action:** do not invent a 921 rule. Recover the exact target-selection logic from the former collector/list-generation code or historical data.

### 2. Missing source fields

The recovered `db_extractor.py` expects or attempts to discover:

- review text
- menu
- tags
- opening hours
- photos
- LINE URL
- reservation URL

Those fields are not present in the recovered `leads` table.
Therefore Step 2 enrichment is a real required stage; it is not already contained in this DB.

### 3. Import mismatch

The recovered `generate_lps.py` imports `db_extractor_v2`, while the supplied recovered file is `db_extractor.py`.
It will not run unchanged unless another missing file exists locally.

### 4. Copy prompt is too assumption-heavy

The old prompt starts from an "overseas high-end salon branding" persona and asks for poetic/brand copy.
That conflicts with the confirmed rule that each business must be understood from evidence first.
It is specifically unsafe for businesses such as a low-price/speed haircut shop.

**New principle:** FACT -> INTERPRETATION -> EXPERIENCE. Never ask one prompt to jump directly from a few reviews into polished selling copy.

### 5. Old diagnosis concept is obsolete

The recovered material alternates between Claude/Gemini and 3/5-question diagnosis implementations. The current product definition is clearer:

- the AI is a receptionist/interviewer for the business's end user
- it listens first
- it organizes the visitor's needs
- it provides a gentle supported suggestion
- it does not score the business or provide management consulting

The current `api/reception.js` / shared Lite template are the direction to preserve.

## Google Maps content caution

Before implementing automatic review ingestion, verify the source/usage route against the current Google Maps Platform terms.
Current Google Maps Platform terms restrict scraping, storing Maps content, and creating new content from Google Maps Content. Google's current Maps Grounding Lite terms provide a specific generative-AI exception with their own conditions.

Therefore the production pipeline should separate:

1. durable first-party / independently sourced facts that we may store and transform;
2. Google Place IDs (durable identifier);
3. any Google Maps content whose display, caching, attribution, or generative use requires Google-specific handling.

Do not permanently bake raw Google review text into the repository until this usage route is confirmed.

## Reusable parts from the old implementation

Keep the ideas of:

- CLI single-store test
- limited batch (`--limit`)
- batch failure isolation
- structured JSON between generation and presentation
- shared template rather than hand-editing every store
- a separate online reception API
- Git/Vercel deployment after generation

Discard or replace:

- `stores` / `is_dm_target` assumptions
- direct review->luxury-copy prompt
- per-store hand-maintained HTML as the primary architecture
- business-management diagnosis
- any unverified menu/quality claims

## New implementation sequence

1. Use `pipeline/lead_db.py` to read the real DB exactly.
2. Recover the exact 921-target rule; do not infer it.
3. Define compliant enrichment sources for facts/reviews/menu data.
4. Generate a structured store profile, not HTML first.
5. Run deterministic + AI validation.
6. Feed passing profiles into the shared `pages/lite.html` experience.
7. Validate the 10 known stores.
8. Run 50-store batch test with exception-only human review.
9. Run the first commercial target set.

## Commercial test remains

The first 921-store cohort is a market validation, not the final scale target.
Target LP sales: 0.5%-0.8%, approximately 5-7 sales.
The production engine must remain reusable by region and industry.
