# -*- coding: utf-8 -*-
"""11A Evidence / Approved LP DB handoff.

Responsibilities:
- create the revisioned lead_11a_evidence table
- store one approved 11A result per lead/revision
- keep the approved customer-facing LP HTML in DB
- expose latest APPROVED_11A row for 11B by lead_id

This module never re-judges 21B READY/HOLD, officiality, identity,
contactability, Sales Ready, or Live Send.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

TABLE = "lead_11a_evidence"

DDL = f"""
CREATE TABLE IF NOT EXISTS {TABLE} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER NOT NULL,
    store_id TEXT NOT NULL,
    store_name TEXT NOT NULL,
    revision INTEGER NOT NULL,

    stage_11a_status TEXT NOT NULL,
    next_stage TEXT NOT NULL,

    evidence_json TEXT NOT NULL,
    customer_voice_summary TEXT,
    service_signals TEXT,
    store_taste TEXT,
    image_color_direction TEXT,
    creative_interpretation TEXT,
    visual_direction_summary TEXT,

    approved_lp_html TEXT NOT NULL,
    approved_lp_sha256 TEXT NOT NULL,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    UNIQUE(lead_id, revision),
    FOREIGN KEY (lead_id) REFERENCES leads(id)
);
CREATE INDEX IF NOT EXISTS idx_lead_11a_evidence_latest
    ON {TABLE}(lead_id, stage_11a_status, revision DESC);
"""


def connect(db_path: str | Path) -> sqlite3.Connection:
    path = Path(db_path).expanduser()
    if not path.exists():
        raise FileNotFoundError(f"DBが見つかりません: {path}")
    con = sqlite3.connect(str(path))
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def ensure_schema(con: sqlite3.Connection) -> None:
    tables = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if "leads" not in tables:
        raise ValueError("正本DBに leads テーブルがありません。11A DB書込を停止します。")
    lead_columns = {r[1] for r in con.execute("PRAGMA table_info(leads)")}
    if "id" not in lead_columns:
        raise ValueError("leads.id がありません。lead_id FKを確定できないため停止します。")
    con.executescript(DDL)


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def html_sha256(html: str) -> str:
    return hashlib.sha256(html.encode("utf-8")).hexdigest()


def next_revision(con: sqlite3.Connection, lead_id: int) -> int:
    row = con.execute(
        f"SELECT COALESCE(MAX(revision), 0) + 1 FROM {TABLE} WHERE lead_id = ?",
        (lead_id,),
    ).fetchone()
    return int(row[0])


def assert_lead_exists(con: sqlite3.Connection, lead_id: int) -> None:
    if con.execute("SELECT 1 FROM leads WHERE id = ?", (lead_id,)).fetchone() is None:
        raise ValueError(f"leads.id={lead_id} が存在しません。11A DB書込を停止します。")


def insert_approved(
    con: sqlite3.Connection,
    *,
    lead_id: int,
    store_id: str,
    store_name: str,
    evidence: Any,
    customer_voice_summary: Any,
    service_signals: Any,
    store_taste: str,
    image_color_direction: Any,
    creative_interpretation: str,
    visual_direction_summary: Any,
    approved_lp_html: str,
    revision: int | None = None,
) -> dict[str, Any]:
    ensure_schema(con)
    assert_lead_exists(con, lead_id)

    if not approved_lp_html.strip():
        raise ValueError("approved_lp_html が空です")
    if not creative_interpretation.strip():
        raise ValueError("creative_interpretation が空です")

    rev = revision if revision is not None else next_revision(con, lead_id)
    now = datetime.now(timezone.utc).isoformat()
    digest = html_sha256(approved_lp_html)

    con.execute(
        f"""
        INSERT INTO {TABLE} (
            lead_id, store_id, store_name, revision,
            stage_11a_status, next_stage,
            evidence_json, customer_voice_summary, service_signals,
            store_taste, image_color_direction, creative_interpretation,
            visual_direction_summary,
            approved_lp_html, approved_lp_sha256,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            lead_id, store_id, store_name, rev,
            "APPROVED_11A", "11B_DIAGNOSIS_INTEGRATION",
            canonical_json(evidence), canonical_json(customer_voice_summary),
            canonical_json(service_signals), store_taste,
            canonical_json(image_color_direction), creative_interpretation,
            canonical_json(visual_direction_summary),
            approved_lp_html, digest, now, now,
        ),
    )
    con.commit()
    return {
        "lead_id": lead_id,
        "store_id": store_id,
        "revision": rev,
        "stage_11a_status": "APPROVED_11A",
        "next_stage": "11B_DIAGNOSIS_INTEGRATION",
        "approved_lp_sha256": digest,
        "sales_ready": "BLOCKED",
        "live_send": "BLOCKED",
    }


def latest_approved(con: sqlite3.Connection, lead_id: int) -> dict[str, Any] | None:
    ensure_schema(con)
    row = con.execute(
        f"""
        SELECT * FROM {TABLE}
        WHERE lead_id = ? AND stage_11a_status = 'APPROVED_11A'
        ORDER BY revision DESC
        LIMIT 1
        """,
        (lead_id,),
    ).fetchone()
    return dict(row) if row else None


def load_payload(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    p = argparse.ArgumentParser(description="11A Evidence DB handoff")
    p.add_argument("--db", required=True)
    p.add_argument("--init", action="store_true")
    p.add_argument("--insert", type=Path, help="11A approved payload JSON")
    p.add_argument("--get", type=int, metavar="LEAD_ID")
    args = p.parse_args()

    with connect(args.db) as con:
        if args.init:
            ensure_schema(con)
            con.commit()
            print(json.dumps({"status": "PASS", "table": TABLE}, ensure_ascii=False))
            return
        if args.insert:
            payload = load_payload(args.insert)
            html_path = Path(payload["approved_lp_html_path"])
            html = html_path.read_text(encoding="utf-8")
            result = insert_approved(
                con,
                lead_id=int(payload["lead_id"]),
                store_id=str(payload["store_id"]),
                store_name=str(payload["store_name"]),
                evidence=payload["evidence"],
                customer_voice_summary=payload.get("customer_voice_summary", []),
                service_signals=payload.get("service_signals", []),
                store_taste=str(payload["store_taste"]),
                image_color_direction=payload.get("image_color_direction", {}),
                creative_interpretation=str(payload["creative_interpretation"]),
                visual_direction_summary=payload.get("visual_direction_summary", {}),
                approved_lp_html=html,
                revision=payload.get("revision"),
            )
            print(json.dumps(result, ensure_ascii=False, indent=2))
            return
        if args.get is not None:
            row = latest_approved(con, args.get)
            if row is None:
                raise SystemExit(4)
            # Avoid dumping full HTML by default.
            row = dict(row)
            row["approved_lp_html"] = f"<HTML {len(row['approved_lp_html'])} chars>"
            print(json.dumps(row, ensure_ascii=False, indent=2))
            return

    p.error("--init / --insert / --get のいずれかが必要です")


if __name__ == "__main__":
    main()
