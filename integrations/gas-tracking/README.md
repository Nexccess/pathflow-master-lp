# Path-Flow Tracking Receiver (Google Apps Script)

This receiver is the persistence target used by `api/track.js` through the Vercel environment variable `GAS_WEBHOOK_URL`.

## 1. Create the Google Sheet
Create one Google Spreadsheet dedicated to Path-Flow tracking. Copy its spreadsheet ID from the URL.

The Apps Script automatically creates a sheet named `pathflow_tracking` with these columns:

1. `received_at`
2. `event`
3. `store_id`
4. `path`
5. `question_id`
6. `question_index`
7. `handoff_text`
8. `message`
9. `client_timestamp`
10. `payload_json`

## 2. Create Apps Script
Open Apps Script from the spreadsheet (Extensions → Apps Script), replace `Code.gs` with this repository's `integrations/gas-tracking/Code.gs`.

In Apps Script Project Settings → Script Properties, add:

- Key: `PATHFLOW_TRACKING_SPREADSHEET_ID`
- Value: the spreadsheet ID created above

Do not hard-code the spreadsheet ID or webhook URL in GitHub.

## 3. Deploy Web App
Deploy → New deployment → Web app.

- Execute as: Me
- Who has access: Anyone

Copy the generated `/exec` URL. This is the value for Vercel `GAS_WEBHOOK_URL`.

## 4. Configure Vercel
Project: `pathflow-master-lp`

Environment variable:

- Name: `GAS_WEBHOOK_URL`
- Value: Apps Script `/exec` URL
- Environment: Preview first

Redeploy the `11b-integration` Preview after adding the variable.

## 5. Confirmation criteria
`TRACKING_CONFIRMED` can be marked PASS only when all of the following are true:

- Vercel `/api/track` returns HTTP 200.
- Response contains `persisted: true`.
- A matching row is visible in `pathflow_tracking`.
- The row has `store_id = 9` for Violet Reference Case #01.
- `event` matches the event sent.
- `received_at` is populated.

Recommended final test event: `store_contact_click` because it confirms the full Path-Flow handoff flow reached the store inquiry action.

## 6. Expected event set

- `reception_open`
- `reception_answer`
- `reception_submit`
- `reception_result`
- `reception_error`
- `store_contact_click`

## 7. Failure behavior
`api/track.js` intentionally does not hide persistence failures:

- `503` = `GAS_WEBHOOK_URL` not configured.
- `502` = upstream webhook failed or did not confirm persistence.
- `200` + `persisted: true` = upstream persistence confirmed.

Do not mark `PRODUCT_COMPLETE` unless `TRACKING_CONFIRMED` passes against the actual Vercel environment.
