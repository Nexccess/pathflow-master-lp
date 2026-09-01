#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def require(cond: bool, msg: str) -> None:
    if not cond:
        errors.append(msg)


stores = json.loads((ROOT / 'data/reception-stores.json').read_text(encoding='utf-8'))
manifest = json.loads((ROOT / 'reference_cases/violet_01/approved_creative_package.json').read_text(encoding='utf-8'))
vercel = json.loads((ROOT / 'vercel.json').read_text(encoding='utf-8'))
html = (ROOT / 'pages/reception.html').read_text(encoding='utf-8')
flow = (ROOT / 'api/reception-flow.js').read_text(encoding='utf-8')
config_api = (ROOT / 'api/reception-config.js').read_text(encoding='utf-8')

# Approved Creative Package gate
require(manifest.get('creative_status') == 'APPROVED', 'Violet manifest must be APPROVED')
require(manifest.get('approval_type') in {'HUMAN_APPROVED', 'AUTO_APPROVED'}, 'approval_type invalid')
require(manifest.get('creative_owned_fields_locked') is True, 'Creative-owned fields must be locked')

# Store reception contract
store = stores.get('9')
require(isinstance(store, dict), 'store 9 missing')
if isinstance(store, dict):
    questions = store.get('questions') or []
    require(len(questions) == 5, f'Violet must have exactly 5 questions, got {len(questions)}')
    ids = [q.get('id') for q in questions]
    require(len(ids) == len(set(ids)), 'question ids must be unique')
    require(all(q.get('text') and q.get('options') for q in questions), 'each question needs text/options')
    require(str(store.get('contactUrl', '')).startswith('https://violet.tokyo/'), 'contactUrl must use official violet.tokyo domain')
    require(store.get('contactLabel') == 'お店に問い合わせる', 'standard result CTA label mismatch')

# Independent UI and mobile basics
require('name="viewport"' in html and 'viewport-fit=cover' in html, 'mobile viewport missing')
require('5つの質問' in html, '5-question user copy missing')
require("fetch('/api/reception-config" in html, 'UI -> reception-config connection missing')
require("fetch('/api/reception-flow'" in html, 'UI -> reception-flow connection missing')
require("fetch('/api/track'" in html, 'UI -> tracking connection missing')
for event in ['reception_open', 'reception_answer', 'reception_submit', 'reception_result', 'store_contact_click']:
    require(event in html, f'tracking event missing: {event}')
require('target="_blank"' in html and 'rel="noopener"' in html, 'external contact safety attributes missing')

# API safeguards
require("answers.length !== store.questions.length" in flow, 'answer-count validation missing')
require("answers.some" in flow, 'empty-answer validation missing')
require('contactUrl: store.contactUrl' in flow, 'result -> store contact URL handoff missing')
require('GEMINI_API_KEY' in flow and 'fallback(store, answers)' in flow, 'AI fallback path missing')
require('Store not found' in flow and 'Store not found' in config_api, 'unknown-store handling missing')

# Vercel route must carry dynamic store id into independent reception UI
rewrites = vercel.get('rewrites') or []
route = next((r for r in rewrites if r.get('source') == '/p/:id/reception'), None)
require(route is not None, 'reception route missing')
if route:
    require(route.get('destination') == '/pages/reception.html?storeId=:id', 'reception route must pass storeId')

# Explicit scope guard: no booking/calendar/sheet dependency in standard reception flow
for forbidden in ['Calendar', 'Spreadsheet', 'booking', '予約確定']:
    require(forbidden not in flow, f'out-of-scope standard flow dependency detected: {forbidden}')

if errors:
    print('11B INTEGRATION CHECK: FAIL')
    for e in errors:
        print(f'- {e}')
    raise SystemExit(1)

print('11B INTEGRATION CHECK: PASS')
print('- Approved Creative Package gate: PASS')
print('- 5-question contract: PASS')
print('- UI/API/Tracking wiring: PASS')
print('- official contact handoff: PASS')
print('- mobile viewport baseline: PASS')
print('- scope guard: PASS')
