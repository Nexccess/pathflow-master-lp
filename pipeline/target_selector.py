#!/usr/bin/env python3
"""Path-Flow lead target selector.

Recovered from the original Claude-era pipeline and rewritten as a small,
auditable utility. It does not send messages and does not scrape websites.
It only classifies rows already present in leads_database.db.

Recovered legacy rule (921 targets in the historical DB):
    (non-HotPepper form_url exists) OR (email exists)

The script additionally exposes obvious data-quality warnings so legacy false
positives (example.com, sentry addresses, etc.) can be reviewed before any
outreach automation is built.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from collections import Counter
from pathlib import Path
from typing import Any

LEGACY_TARGET_SQL = """
(
  (form_url IS NOT NULL AND TRIM(form_url) != '' AND LOWER(form_url) NOT LIKE '%hotpepper.jp%')
  OR
  (email IS NOT NULL AND TRIM(email) != '')
)
""".strip()

SUSPICIOUS_EMAIL_PATTERNS = (
    r"@example\.(com|net|org)$",
    r"@.*sentry.*$",
    r"@.*wixpress\.com$",
)

NON_OUTREACH_FORM_HINTS = (
    "reserve",
    "reservation",
    "booking",
    "yoyaku",
)


def _columns(conn: sqlite3.Connection) -> set[str]:
    return {row[1] for row in conn.execute("PRAGMA table_info(leads)")}


def validate_schema(conn: sqlite3.Connection) -> None:
    required = {"id", "company_name", "category", "form_url", "email"}
    missing = required - _columns(conn)
    if missing:
        raise RuntimeError(
            "leads table is missing required columns: " + ", ".join(sorted(missing))
        )


def suspicious_email(email: str | None) -> bool:
    if not email:
        return False
    value = email.strip().lower()
    return any(re.search(pattern, value) for pattern in SUSPICIOUS_EMAIL_PATTERNS)


def suspicious_form(form_url: str | None) -> bool:
    if not form_url:
        return False
    value = form_url.strip().lower()
    return any(hint in value for hint in NON_OUTREACH_FORM_HINTS)


def classify(row: sqlite3.Row) -> dict[str, Any]:
    form_url = (row["form_url"] or "").strip()
    email = (row["email"] or "").strip()
    form_ok = bool(form_url) and "hotpepper.jp" not in form_url.lower()
    email_ok = bool(email)
    legacy_target = form_ok or email_ok

    warnings: list[str] = []
    if suspicious_email(email):
        warnings.append("suspicious_email")
    if suspicious_form(form_url):
        warnings.append("possible_booking_page_not_contact_form")

    return {
        "id": row["id"],
        "company_name": row["company_name"],
        "category": row["category"],
        "form_url": form_url or None,
        "email": email or None,
        "legacy_target": legacy_target,
        "qa_status": "review" if warnings else ("candidate" if legacy_target else "not_target"),
        "warnings": warnings,
    }


def load_rows(db_path: Path) -> list[dict[str, Any]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        validate_schema(conn)
        rows = conn.execute(
            "SELECT id, company_name, category, form_url, email FROM leads ORDER BY id"
        ).fetchall()
        return [classify(row) for row in rows]
    finally:
        conn.close()


def summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
    targets = [row for row in rows if row["legacy_target"]]
    reviews = [row for row in targets if row["qa_status"] == "review"]
    category_counts = Counter((row["category"] or "未分類") for row in targets)
    return {
        "total_leads": len(rows),
        "legacy_target_count": len(targets),
        "qa_review_count": len(reviews),
        "clean_candidate_count": len(targets) - len(reviews),
        "category_counts": dict(category_counts.most_common()),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit Path-Flow outreach targets")
    parser.add_argument("db", type=Path, help="Path to leads_database.db")
    parser.add_argument("--json", type=Path, help="Optional output JSON path")
    args = parser.parse_args()

    rows = load_rows(args.db)
    result = {"summary": summary(rows), "targets": [r for r in rows if r["legacy_target"]]}
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))

    if args.json:
        args.json.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"wrote: {args.json}")


if __name__ == "__main__":
    main()
