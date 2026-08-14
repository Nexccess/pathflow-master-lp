# -*- coding: utf-8 -*-
"""Path-Flow mass-production lead DB adapter.

This module models the *actual* current leads_database.db schema recovered from
Kei's local project. It deliberately does NOT guess the 921-target rule because
the supplied DB has no is_dm_target column.

Examples:
    python pipeline/lead_db.py --db "C:\\...\\leads_database.db" --inspect
    python pipeline/lead_db.py --db "C:\\...\\leads_database.db" --store-id 44
    python pipeline/lead_db.py --db "C:\\...\\leads_database.db" --existing-pathflow
    python pipeline/lead_db.py --db "C:\\...\\leads_database.db" --contactable
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any

TABLE = "leads"
EXPECTED_COLUMNS = {
    "id", "place_id", "company_name", "category", "area", "address", "phone",
    "website_url", "rating", "user_ratings_total", "status", "created_at",
    "form_url", "email", "pathflow_url", "processed_at", "error_message",
}


def connect(db_path: str | Path) -> sqlite3.Connection:
    path = Path(db_path).expanduser()
    if not path.exists():
        raise FileNotFoundError(f"DBが見つかりません: {path}")
    con = sqlite3.connect(str(path))
    con.row_factory = sqlite3.Row
    return con


def get_columns(con: sqlite3.Connection) -> list[str]:
    return [r[1] for r in con.execute(f"PRAGMA table_info({TABLE})").fetchall()]


def inspect(db_path: str | Path) -> dict[str, Any]:
    with connect(db_path) as con:
        tables = [r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")]
        if TABLE not in tables:
            raise ValueError(f"必要テーブル '{TABLE}' がありません。tables={tables}")
        columns = get_columns(con)
        missing = sorted(EXPECTED_COLUMNS - set(columns))
        extra = sorted(set(columns) - EXPECTED_COLUMNS)
        total = con.execute(f"SELECT COUNT(*) FROM {TABLE}").fetchone()[0]
        status_counts = {
            (r[0] or "(NULL)"): r[1]
            for r in con.execute(f"SELECT status, COUNT(*) FROM {TABLE} GROUP BY status")
        }
        category_counts = {
            (r[0] or "(NULL)"): r[1]
            for r in con.execute(f"SELECT category, COUNT(*) FROM {TABLE} GROUP BY category ORDER BY COUNT(*) DESC")
        }
        counts = {}
        for col in ["place_id", "phone", "website_url", "form_url", "email", "pathflow_url"]:
            counts[col] = con.execute(
                f"SELECT COUNT(*) FROM {TABLE} WHERE {col} IS NOT NULL AND TRIM(CAST({col} AS TEXT)) <> ''"
            ).fetchone()[0]
        counts["rating"] = con.execute(f"SELECT COUNT(*) FROM {TABLE} WHERE rating IS NOT NULL").fetchone()[0]
        counts["user_ratings_total"] = con.execute(
            f"SELECT COUNT(*) FROM {TABLE} WHERE user_ratings_total IS NOT NULL"
        ).fetchone()[0]
        contactable = con.execute(
            f"""SELECT COUNT(*) FROM {TABLE}
                WHERE (form_url IS NOT NULL AND TRIM(form_url) <> '')
                   OR (email IS NOT NULL AND TRIM(email) <> '')"""
        ).fetchone()[0]
        return {
            "db": str(Path(db_path)),
            "table": TABLE,
            "total": total,
            "columns": columns,
            "missing_expected_columns": missing,
            "extra_columns": extra,
            "nonempty_counts": counts,
            "contactable_by_form_or_email": contactable,
            "status_counts": status_counts,
            "category_counts": category_counts,
            "dm_target_rule": None,
            "dm_target_note": "このDBには is_dm_target 等の921件判定カラムがないため、921件の抽出条件は別資料/旧スクリプトから復元が必要。",
        }


def fetch_store(db_path: str | Path, store_id: int) -> dict[str, Any]:
    with connect(db_path) as con:
        row = con.execute(f"SELECT * FROM {TABLE} WHERE id = ?", (store_id,)).fetchone()
        if row is None:
            raise ValueError(f"store_id={store_id} は存在しません")
        return dict(row)


def fetch_ids(db_path: str | Path, *, existing_pathflow: bool = False, contactable: bool = False) -> list[int]:
    where = []
    if existing_pathflow:
        where.append("pathflow_url IS NOT NULL AND TRIM(pathflow_url) <> ''")
    if contactable:
        where.append("((form_url IS NOT NULL AND TRIM(form_url) <> '') OR (email IS NOT NULL AND TRIM(email) <> ''))")
    sql = f"SELECT id FROM {TABLE}"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY id"
    with connect(db_path) as con:
        return [int(r[0]) for r in con.execute(sql).fetchall()]


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--db", required=True, help="leads_database.db のパス")
    p.add_argument("--inspect", action="store_true")
    p.add_argument("--store-id", type=int)
    p.add_argument("--existing-pathflow", action="store_true")
    p.add_argument("--contactable", action="store_true")
    args = p.parse_args()

    if args.inspect:
        print(json.dumps(inspect(args.db), ensure_ascii=False, indent=2))
    elif args.store_id is not None:
        print(json.dumps(fetch_store(args.db, args.store_id), ensure_ascii=False, indent=2))
    else:
        ids = fetch_ids(args.db, existing_pathflow=args.existing_pathflow, contactable=args.contactable)
        print(f"件数: {len(ids)}")
        print(json.dumps(ids, ensure_ascii=False))


if __name__ == "__main__":
    main()
