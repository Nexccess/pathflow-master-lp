# Path-Flow Lite — Product Principles

## 1. Purpose

Path-Flow Lite is not an "AI-powered LP" product for its own sake.

Its purpose is to place a simple virtual reception/interview staff member on a business LP: listen first, understand the visitor, organize the situation, suggest an appropriate option, and gently support the next action.

Core principle: **まず聞く。**

Technology is subordinate to the user experience and business objective. AI, static HTML, rules, spreadsheets, APIs, or other tools may be used as appropriate. Internal technical sophistication has no value unless it improves the experience visible to the end user or the economics of delivery.

Path-Flow Lite is also a test bed for reception/diagnosis UX. Improvements proven here may be transferred back into the full Path-Flow product. The full product remains the reference implementation for booking, Google integrations, data storage and analytics; Lite is where reception behavior can be changed quickly and tested at scale.

## 2. Two users, two moments of value

### Business owner
The sales sample should create these reactions:
1. "This is actually our shop."
2. "They understood what customers say about us."
3. "Ah — customers can use this as a receptionist before booking."

The page must therefore be grounded in public facts and reviews rather than generic promotional language.

### End user
The visitor should experience:
1. I am not sure what to choose.
2. The reception flow asks a small number of relevant questions.
3. It explains which option may fit and why.
4. I feel comfortable taking the next step.

The intended response is surprise plus reassurance — not pressure.

## 3. First commercial experiment

Initial market: beauty / healthcare-related businesses collected from Google Maps in Tokyo, Kanagawa, Chiba and Saitama.

Current DM-capable target set: 921 businesses.

LP sale target: **0.5%–0.8% of 921 = approximately 5–7 sales.**

Initial LP product price assumption: JPY 70,000–100,000.

The 921 businesses are not the final scale target. They are the first market validation. If successful, the same production engine should be reusable in other regions and industries.

## 4. Product boundary

### Lite / pre-sales product
- Business-specific LP
- Attractive but reusable design system
- Copy grounded in public business information and reviews
- End-user AI reception / interview flow
- Gentle recommendation or guidance

### After response / paid customization
- Real business photos where permission/use is appropriate
- Copy and design refinements
- Business-specific customization

### Full Path-Flow upsell
Depending on client needs:
- Google Calendar
- Gmail
- Google Sheets
- GA4 / Amplitude
- booking and operational integrations

## 5. Mass-production requirement

A good page that requires manual work for every business is not a successful implementation.

The system must optimize for:
- user impact
- business-owner credibility
- factual safety
- speed
- mass production
- reuse across regions and industries

Human work should occur primarily **after a business responds**, not while creating every pre-sales sample.

Target operating model:

`source data -> business understanding -> business profile -> copy -> reception design -> validation -> page data -> shared template -> publish -> outreach`

Humans review exceptions and responses, not every generated page.

## 6. Data and AI separation

### FACT
Source-controlled information such as:
- business name
- category
- address
- opening hours
- phone
- rating / review count
- menus and prices where available
- payment methods where available
- review text / review-derived evidence

AI must not invent facts.

### INTERPRETATION
AI may derive:
- recurring positive themes
- what appears distinctive
- what can safely be emphasized
- what should not be promoted
- what a receptionist should ask before recommending an option

Interpretation must remain traceable to source facts/evidence.

### EXPERIENCE
Using approved facts and interpretations:
- headline
- lead copy
- features
- usage flow
- reception questions
- recommendation policy

## 7. Safety / credibility rules

1. No unsupported quality claims such as "high quality", "careful", "safe", or similar subjective superiority language without concrete supporting evidence.
2. Negative review content must not be converted into promotional copy, tips, euphemisms, or "balanced" selling language.
3. Different businesses within the same category must not be assumed to have the same positioning, service style, price level, or customer experience.
4. Generated recommendations must not reference menus/services that are not supported by business data.
5. Production output must include automated validation so humans do not need to inspect every page.

## 8. Architecture principle

Do not generate hundreds of independent hand-maintained HTML products.

Prefer:
- a small number of shared presentation templates
- structured business-specific data (JSON or equivalent)
- industry-specific rule/configuration packs
- a common generation and validation engine

A new region should primarily mean new input data.
A new industry should primarily mean a new industry configuration/rule pack.
The core engine should not require a rewrite.

## 9. Reception behavior

The reception AI is not a business consultant and does not score the business.

It should:
1. ask relevant questions first
2. understand the visitor's stated needs
3. organize those needs
4. suggest an appropriate supported option
5. explain the reason briefly
6. gently support booking/contact

It should not use aggressive sales pressure.

## 10. Development decision rule

Before adding a feature, ask:

1. Does the end user notice meaningful value?
2. Does it increase reassurance or useful surprise?
3. Does it increase business-owner credibility?
4. Does it reduce time/cost per generated business?
5. Does it preserve mass-production and cross-industry reuse?

If not, defer it.

## 11. Initial implementation sequence

1. Use store 44 as the first vertical slice.
2. Define the structured business profile / production JSON.
3. Replace business-management diagnosis with end-user reception behavior.
4. Produce one complete experience.
5. Validate it for factuality, owner credibility, reception quality, end-user experience, and generation time.
6. Expand to the existing 10 test businesses.
7. Expand to 50 businesses with exception-only human review.
8. Test real outreach and measure the funnel.
9. Expand to the 921-business first market only after the production line is proven.

## 12. Environment / deployment role

`pathflow-master-lp` is the mutable mass-production and experiment environment. The full Path-Flow implementations are maintained separately.

The mass-production environment may therefore be restructured aggressively when that improves the production model. However, deployment mechanics must still preserve the full project payload when the deployment tool replaces rather than patches the remote project.
