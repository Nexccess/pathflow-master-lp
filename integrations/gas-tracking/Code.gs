const SHEET_NAME = 'pathflow_tracking';
const HEADERS = [
  'received_at',
  'event',
  'store_id',
  'path',
  'question_id',
  'question_index',
  'handoff_text',
  'message',
  'client_timestamp',
  'payload_json'
];

/**
 * Path-Flow Tracking Webhook
 * Deploy as a Google Apps Script Web App.
 * Execute as: Me
 * Who has access: Anyone
 */
function doPost(e) {
  try {
    const payload = parsePayload_(e);
    validatePayload_(payload);

    const sheet = getOrCreateSheet_();
    ensureHeader_(sheet);

    const receivedAt = new Date();
    sheet.appendRow([
      receivedAt,
      String(payload.event || ''),
      String(payload.storeId || ''),
      String(payload.path || ''),
      String(payload.questionId || ''),
      payload.questionIndex == null ? '' : Number(payload.questionIndex),
      String(payload.handoffText || ''),
      String(payload.message || ''),
      String(payload.timestamp || ''),
      JSON.stringify(payload)
    ]);

    return json_({
      ok: true,
      persisted: true,
      event: String(payload.event),
      storeId: String(payload.storeId),
      receivedAt: receivedAt.toISOString()
    });
  } catch (err) {
    return json_({
      ok: false,
      persisted: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

function doGet() {
  return json_({
    ok: true,
    service: 'pathflow-tracking-webhook',
    status: 'ready'
  });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing POST body');
  }
  let payload;
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (_) {
    throw new Error('Invalid JSON');
  }
  return payload;
}

function validatePayload_(payload) {
  const allowedEvents = [
    'reception_open',
    'reception_answer',
    'reception_submit',
    'reception_result',
    'reception_error',
    'store_contact_click'
  ];

  if (!payload || typeof payload !== 'object') throw new Error('Payload must be an object');
  if (!payload.event || !allowedEvents.includes(String(payload.event))) {
    throw new Error('Invalid event');
  }
  if (!payload.storeId) throw new Error('storeId is required');
}

function getOrCreateSheet_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = props.getProperty('PATHFLOW_TRACKING_SPREADSHEET_ID');
  if (!spreadsheetId) {
    throw new Error('PATHFLOW_TRACKING_SPREADSHEET_ID is not configured');
  }

  const ss = SpreadsheetApp.openById(spreadsheetId);
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return;
  }

  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const mismatch = HEADERS.some((header, index) => current[index] !== header);
  if (mismatch) throw new Error('Tracking sheet header mismatch');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
