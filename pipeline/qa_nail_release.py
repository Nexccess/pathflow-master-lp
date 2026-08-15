#!/usr/bin/env python3
"""Release QA for Path-Flow Lite nail catalog.

Checks the public production data before mass release. This does not fetch the
web and does not validate whether a third-party page is still live; it validates
the data and route structure we are about to publish.

Usage (production chunks):
    python pipeline/qa_nail_release.py data/nail-stores --expected-count 113

A single JSON catalog file is also accepted.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

FORBIDDEN_PUBLIC_FIELDS = {
    "email",
    "form_url",
    "formUrl",
    "outreachEmail",
    "outreachFormUrl",
}

ROUTE_FIELDS = ("bookingUrl", "contactUrl", "officialWebsiteUrl", "websiteUrl")
EXPECTED_CHUNKS = {"yokohama", "kawasaki", "chiba", "funabashi", "urawa", "omiya"}


def is_http_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)
    except Exception:
        return False


def phone_is_plausible(value: str) -> bool:
    digits = re.sub(r"\D", "", value or "")
    return not digits or 9 <= len(digits) <= 12


def load_catalog(path: Path) -> tuple[dict, list[str]]:
    errors: list[str] = []
    if path.is_file():
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise SystemExit("catalog root must be an object keyed by storeId")
        return data, errors

    if not path.is_dir():
        raise SystemExit(f"catalog not found: {path}")

    files = sorted(path.glob("*.json"))
    slugs = {p.stem for p in files}
    missing = EXPECTED_CHUNKS - slugs
    if missing:
        errors.append("missing regional chunks: " + ", ".join(sorted(missing)))

    catalog: dict = {}
    for file in files:
        chunk = json.loads(file.read_text(encoding="utf-8"))
        if not isinstance(chunk, dict):
            errors.append(f"{file.name}: root must be an object")
            continue
        overlap = set(catalog).intersection(chunk)
        if overlap:
            errors.append(f"{file.name}: duplicate storeIds {sorted(overlap)[:10]}")
        catalog.update(chunk)
    return catalog, errors


def audit(catalog: dict, expected_count: int, initial_errors: list[str] | None = None) -> tuple[list[str], dict]:
    errors: list[str] = list(initial_errors or [])
    warnings: list[str] = []
    route_counts = Counter()
    area_counts = Counter()

    if len(catalog) != expected_count:
        errors.append(f"expected {expected_count} stores, found {len(catalog)}")

    for store_id, item in catalog.items():
        if str(item.get("storeId", "")) != str(store_id):
            errors.append(f"{store_id}: storeId mismatch")
        if item.get("category") != "ネイルサロン":
            errors.append(f"{store_id}: category is not ネイルサロン")
        if not str(item.get("storeName", "")).strip():
            errors.append(f"{store_id}: missing storeName")

        area_counts[str(item.get("area") or "未設定")] += 1

        leaked = FORBIDDEN_PUBLIC_FIELDS.intersection(item.keys())
        if leaked:
            errors.append(f"{store_id}: outreach/private fields exported: {sorted(leaked)}")

        rating = item.get("rating")
        if rating is not None:
            try:
                if not 0 <= float(rating) <= 5:
                    errors.append(f"{store_id}: invalid rating {rating}")
            except (TypeError, ValueError):
                errors.append(f"{store_id}: non-numeric rating {rating}")

        review_count = item.get("reviewCount")
        if review_count is not None:
            try:
                if int(review_count) < 0:
                    errors.append(f"{store_id}: negative reviewCount")
            except (TypeError, ValueError):
                errors.append(f"{store_id}: invalid reviewCount {review_count}")

        phone = str(item.get("phone", "") or "").strip()
        if phone:
            route_counts["phone"] += 1
            if not phone_is_plausible(phone):
                warnings.append(f"{store_id}: unusual phone format: {phone}")

        for field in ROUTE_FIELDS:
            value = str(item.get(field, "") or "").strip()
            if not value:
                continue
            route_counts[field] += 1
            if not is_http_url(value):
                errors.append(f"{store_id}: invalid {field}: {value}")

        has_route = phone or any(str(item.get(f, "") or "").strip() for f in ROUTE_FIELDS)
        if has_route:
            route_counts["stores_with_any_customer_route"] += 1
        else:
            warnings.append(f"{store_id}: no customer contact route")

    summary = {
        "stores": len(catalog),
        "errors": len(errors),
        "warnings": len(warnings),
        "area_counts": dict(area_counts),
        "route_counts": dict(route_counts),
        "warning_examples": warnings[:20],
    }
    return errors, summary


def main() -> None:
    parser = argparse.ArgumentParser(description="QA Path-Flow nail release catalog")
    parser.add_argument("catalog", type=Path, help="JSON file or regional chunk directory")
    parser.add_argument("--expected-count", type=int, default=113)
    args = parser.parse_args()

    catalog, load_errors = load_catalog(args.catalog)
    errors, summary = audit(catalog, args.expected_count, load_errors)
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    if errors:
        print("\nNAIL RELEASE QA FAILED")
        for error in errors[:100]:
            print(f"- {error}")
        raise SystemExit(1)

    print("\nNAIL RELEASE QA PASS")
    if summary["warnings"]:
        print("Warnings remain; review warning_examples before outreach/release.")


if __name__ == "__main__":
    main()
