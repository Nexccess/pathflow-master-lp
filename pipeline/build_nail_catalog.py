#!/usr/bin/env python3
"""Build the public Path-Flow nail-store catalog from the historical leads DB.

This is intentionally a facts-only export for LP rendering/runtime reception.
It never exports outreach fields such as email/form_url.

Example:
    python pipeline/build_nail_catalog.py "C:\\path\\to\\leads_database(2).db"

Default output:
    data/nail-stores.json
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path
from typing import Any

CATEGORY = "ネイルサロン"
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = REPO_ROOT / "data" / "nail-stores.json"
SEED_FACTS = REPO_ROOT / "data" / "nail-test-stores.json"

PUBLIC_COLUMNS = {
    "id",
    "place_id",
    "company_name",
    "category",
    "area",
    "address",
    "phone",
    "website_url",
    "rating",
    "user_ratings_total",
}


def _columns(conn: sqlite3.Connection) -> set[str]:
    return {row[1] for row in conn.execute("PRAGMA table_info(leads)")}


def validate_schema(conn: sqlite3.Connection) -> None:
    missing = PUBLIC_COLUMNS - _columns(conn)
    if missing:
        raise RuntimeError(
            "leads table is missing required columns: " + ", ".join(sorted(missing))
        )


def load_seed_verified_facts() -> dict[str, list[str]]:
    if not SEED_FACTS.exists():
        return {}
    data = json.loads(SEED_FACTS.read_text(encoding="utf-8"))
    result: dict[str, list[str]] = {}
    for store_id, item in data.items():
        facts = item.get("verifiedFacts") or []
        if facts:
            result[str(store_id)] = [str(x) for x in facts]
    return result


def build_catalog(db_path: Path) -> dict[str, dict[str, Any]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        validate_schema(conn)
        rows = conn.execute(
            """
            SELECT
              id, place_id, company_name, category, area, address, phone,
              website_url, rating, user_ratings_total
            FROM leads
            WHERE category = ?
            ORDER BY id
            """,
            (CATEGORY,),
        ).fetchall()
    finally:
        conn.close()

    seed_facts = load_seed_verified_facts()
    catalog: dict[str, dict[str, Any]] = {}
    for row in rows:
        store_id = str(row["id"])
        catalog[store_id] = {
            "storeId": store_id,
            "storeName": row["company_name"] or "",
            "category": row["category"] or CATEGORY,
            "area": row["area"] or "",
            "address": row["address"] or "",
            "phone": row["phone"] or "",
            "websiteUrl": row["website_url"] or "",
            "rating": row["rating"],
            "reviewCount": row["user_ratings_total"],
            "placeId": row["place_id"] or "",
            "verifiedFacts": seed_facts.get(store_id, []),
        }
    return catalog


def validate_catalog(catalog: dict[str, dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    for store_id, item in catalog.items():
        if item.get("storeId") != store_id:
            errors.append(f"{store_id}: storeId mismatch")
        if not item.get("storeName"):
            errors.append(f"{store_id}: missing storeName")
        if item.get("category") != CATEGORY:
            errors.append(f"{store_id}: category mismatch")
        rating = item.get("rating")
        if rating is not None and not (0 <= float(rating) <= 5):
            errors.append(f"{store_id}: invalid rating {rating}")
        review_count = item.get("reviewCount")
        if review_count is not None and int(review_count) < 0:
            errors.append(f"{store_id}: invalid reviewCount {review_count}")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Path-Flow nail store catalog")
    parser.add_argument("db", type=Path, help="Path to leads_database(2).db")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--expected-count",
        type=int,
        default=113,
        help="Fail if nail-store count differs from this value (default: 113)",
    )
    args = parser.parse_args()

    if not args.db.exists():
        raise SystemExit(f"DB not found: {args.db}")

    catalog = build_catalog(args.db)
    errors = validate_catalog(catalog)

    if len(catalog) != args.expected_count:
        errors.append(
            f"expected {args.expected_count} nail stores, found {len(catalog)}"
        )

    if errors:
        print("CATALOG BUILD FAILED")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print("CATALOG BUILD PASS")
    print(f"stores: {len(catalog)}")
    print(f"output: {args.output}")
    print("outreach fields exported: 0")


if __name__ == "__main__":
    main()
