# Path-Flow Lite — Nail V1 Release Checklist

This is the freeze gate for the first mass-production vertical. Fix the shared template here before generating/publishing the full nail catalog.

## 1. Shared product promise
- End-customer reception, not owner diagnosis.
- Ask first -> organize -> gently guide -> hand off to the store.
- Never invent menu names, prices, duration, effects, qualifications, facilities, review themes, or popularity.
- Negative review content is never converted into promotional copy.
- Google rating is neutral public information, not a positive-feature claim.

## 2. Standard customer routes
Path-Flow Lite must expose every verified customer-facing route that exists:
1. Web reservation (`bookingUrl`)
2. Web inquiry (`contactUrl`)
3. Telephone (`phone`)
4. Official website (`websiteUrl`)

Hero, mobile fixed CTA, and AI result use the best single route in that priority order. The STORE CONTACT section lists all verified routes.

Outreach-only email/form fields must never be exported into the public store catalog.

## 3. AI reception
- Five questions come from the nail industry pack.
- Selection state is visually clear and exposed with `aria-pressed`.
- Progress/remaining questions are visible.
- Completion hides the questionnaire and prioritizes the result.
- Result includes a store hand-off CTA and a copyable consultation summary.
- The store resolver must support every generated nail store.

## 4. Responsive foundation
Manual visual QA widths:
- 360px Android compact
- 375px iPhone compact
- 390px current iPhone baseline
- 430px large phone
- 768px tablet boundary
- desktop >= 1024px

Check at every width:
- no horizontal body overflow
- hero headline remains readable
- CTA tap targets remain >= about 48px high
- store name/address wrap without clipping
- AI options remain easy to tap
- selected answer is obvious
- mobile fixed bar does not cover content
- safe-area inset works at the bottom
- mood images scroll horizontally on mobile instead of creating a long vertical gallery
- external store links open correctly

## 5. Data release gate
Generate the catalog:

```powershell
python .\pipeline\build_nail_catalog.py "C:\path\to\leads_database(2).db"
```

Expected result:

```text
CATALOG BUILD PASS
stores: 113
outreach fields exported: 0
```

Run release QA:

```powershell
python .\pipeline\qa_nail_release.py .\data\nail-stores.json --expected-count 113
```

Release requires `NAIL RELEASE QA PASS`. Warnings about missing customer routes must be reviewed before outreach; they are not permission to invent a route.

## 6. Human sample gate
Before freezing Nail V1, manually inspect at least:
- high rating / high review count store
- low rating store
- store with verified facts
- store with no verified facts
- store with long Japanese name/address
- store with Web reservation route
- store with phone-only route

Once this gate passes, freeze the shared foundation and treat future regions as new input data. New industries should change the industry pack, imagery/copy rules, and industry-specific QA rather than rebuilding the core LP.
