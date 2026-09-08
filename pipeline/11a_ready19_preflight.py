# -*- coding: utf-8 -*-
"""Preflight the 19 formal 21B READY leads before 11A production.

No 21B re-judgement is performed. This checks only that the handed-off lead_ids
exist in the canonical leads table, and initializes lead_11a_evidence.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path

from lead_11a_evidence import ensure_schema


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--db", required=True, type=Path)
    p.add_argument("--manifest", required=True, type=Path)
    args = p.parse_args()

    if not args.db.exists():
        raise FileNotFoundError(f"DB not found: {args.db}")
    if not args.manifest.exists():
        raise FileNotFoundError(f"manifest not found: {args.manifest}")

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    stores = manifest.get("stores") or []
    if len(stores) != 19:
        raise ValueError(f"READY manifest must contain exactly 19 stores: {len(stores)}")

    ids = [int(x["lead_id"]) for x in stores]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate lead_id in READY manifest")

    with sqlite3.connect(str(args.db)) as con:
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA foreign_keys = ON")
        tables = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        if "leads" not in tables:
            raise ValueError("leads table missing")
        placeholders = ",".join("?" for _ in ids)
        rows = con.execute(
            f"SELECT id, company_name FROM leads WHERE id IN ({placeholders}) ORDER BY id",
            ids,
        ).fetchall()
        found = {int(r["id"]): str(r["company_name"] or "") for r in rows}
        missing = [lead_id for lead_id in ids if lead_id not in found]
        if missing:
            print(json.dumps({"status":"BLOCKED","reason":"READY_LEAD_ID_MISSING","missing":missing}, ensure_ascii=False, indent=2))
            raise SystemExit(5)

        ensure_schema(con)
        con.commit()

        result = []
        for item in stores:
            lead_id = int(item["lead_id"])
            result.append({
                "lead_id": lead_id,
                "handoff_store_name": item["store_name"],
                "db_company_name": found[lead_id],
                "store_id": item["store_id"],
            })

    print(json.dumps({
        "status":"PASS",
        "campaignId":manifest.get("campaignId"),
        "ready_count":len(result),
        "lead_11a_evidence":"INITIALIZED",
        "stores":result,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
