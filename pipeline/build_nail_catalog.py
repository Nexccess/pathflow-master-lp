#!/usr/bin/env python3
"""Build the public Path-Flow nail-store catalog from the historical leads DB.

This is intentionally a facts-only export for LP rendering/runtime reception.
It never exports outreach fields such as email/form_url.

Customer-facing contact fields are kept separate from sales outreach fields:
- websiteUrl: public website/listing URL from source DB (not automatically called official)
- officialWebsiteUrl: only set after separate verification
- bookingUrl/contactUrl: reserved for separately verified customer routes

The builder writes both the full catalog and six regional chunks used by the
production runtime.

Example:
    python pipeline/build_nail_catalog.py "C:\\path\\to\\leads_database(2).db"

Default output:
    data/nail-stores.json
    data/nail-stores/{yokohama,kawasaki,chiba,funabashi,urawa,omiya}.json
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from collections import defaultdict
from pathlib import Path
from typing import Any

CATEGORY = "ネイルサロン"
REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = REPO_ROOT / "data" / "nail-stores.json"
DEFAULT_CHUNK_DIR = REPO_ROOT / "data" / "nail-stores"
SEED_FACTS = REPO_ROOT / "data" / "nail-test-stores.json"

AREA_SLUGS = {
    "横浜駅": "yokohama",
    "川崎駅": "kawasaki",
    "千葉駅": "chiba",
    "船橋駅": "funabashi",
    "浦和駅": "urawa",
    "大宮駅": "omiya",
}

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

EMPTY_PHONE_VALUES = {"", "なし", "無し", "不明", "-", "—"}


def _columns(conn: sqlite3.Connection) -> set[str]:
    return {row[1] for row in conn.execute("PRAGMA table_info(leads)")}


def validate_schema(conn: sqlite3.Connection) -> None:
    missing = PUBLIC_COLUMNS - _columns(conn)
    if missing:
        raise RuntimeError(
            "leads table is missing required columns: " + ", ".join(sorted(missing))
        )


def normalize_phone(value: Any) -> str:
    text = str(value or "").strip()
    return "" if text in EMPTY_PHONE_VALUES else text


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
            "phone": normalize_phone(row["phone"]),
            "websiteUrl": row["website_url"] or "",
            "officialWebsiteUrl": "",
            "bookingUrl": "",
            "contactUrl": "",
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
        if item.get("area") not in AREA_SLUGS:
            errors.append(f"{store_id}: unexpected area {item.get('area')}")
        rating = item.get("rating")
        if rating is not None and not (0 <= float(rating) <= 5):
            errors.append(f"{store_id}: invalid rating {rating}")
        review_count = item.get("reviewCount")
        if review_count is not None and int(review_count) < 0:
            errors.append(f"{store_id}: invalid reviewCount {review_count}")
        for field in ("websiteUrl", "officialWebsiteUrl", "bookingUrl", "contactUrl"):
            value = item.get(field) or ""
            if value and not str(value).lower().startswith(("http://", "https://")):
                errors.append(f"{store_id}: invalid {field}")
    return errors


def write_json(path: Path, data: dict[str, dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def write_chunks(catalog: dict[str, dict[str, Any]], chunk_dir: Path) -> dict[str, int]:
    grouped: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for store_id, item in catalog.items():
        area = item.get("area") or ""
        grouped[area][store_id] = item

    counts: dict[str, int] = {}
    for area, slug in AREA_SLUGS.items():
        items = grouped.get(area, {})
        write_json(chunk_dir / f"{slug}.json", items)
        counts[slug] = len(items)
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Path-Flow nail store catalog")
    parser.add_argument("db", type=Path, help="Path to leads_database(2).db")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--chunk-dir", type=Path, default=DEFAULT_CHUNK_DIR)
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

    write_json(args.output, catalog)
    chunk_counts = write_chunks(catalog, args.chunk_dir)

    print("CATALOG BUILD PASS")
    print(f"stores: {len(catalog)}")
    print(f"output: {args.output}")
    print(f"chunks: {json.dumps(chunk_counts, ensure_ascii=False)}")
    print("outreach fields exported: 0")
    print("customer routes: phone + public website; verified booking/contact/official slots kept separate")


if __name__ == "__main__":
    main()
