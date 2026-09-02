#!/usr/bin/env python3
"""Register one 11A visual asset into a store manifest.

This tool never infers commercial usage rights. The caller must explicitly pass
commercial usage status. CONFIRMED is therefore a human/legal/business input,
not an automated conclusion.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ALLOWED_SLOTS = {"hero", "consultation", "style_set"}
ALLOWED_SOURCE_TYPES = {"GENERATED", "OWNED", "LICENSED_STOCK", "STORE_SUPPLIED", "UNKNOWN"}
ALLOWED_COMMERCIAL = {"CONFIRMED", "NOT_CONFIRMED", "RESTRICTED", "UNKNOWN"}
ALLOWED_GENERATION = {"GENERATED", "ACQUIRED", "NOT_GENERATED"}


def main() -> None:
    p = argparse.ArgumentParser(description="Register one visual asset in an 11A manifest")
    p.add_argument("manifest", type=Path)
    p.add_argument("--slot", required=True, choices=sorted(ALLOWED_SLOTS))
    p.add_argument("--src", required=True)
    p.add_argument("--alt", required=True)
    p.add_argument("--source-type", required=True, choices=sorted(ALLOWED_SOURCE_TYPES))
    p.add_argument("--commercial-usage-status", required=True, choices=sorted(ALLOWED_COMMERCIAL))
    p.add_argument("--generation-status", required=True, choices=sorted(ALLOWED_GENERATION))
    args = p.parse_args()

    data = json.loads(args.manifest.read_text(encoding="utf-8"))
    assets = data.get("assets") or []
    match = next((a for a in assets if a.get("slot") == args.slot), None)
    if not match:
        raise SystemExit(f"slot_not_found:{args.slot}")

    match["src"] = args.src
    match["alt"] = args.alt
    match["source_type"] = args.source_type
    match["commercial_usage_status"] = args.commercial_usage_status
    match["generation_status"] = args.generation_status

    confirmed = [a for a in assets if a.get("commercial_usage_status") == "CONFIRMED" and str(a.get("src") or "").strip()]
    hero_ok = any(a.get("slot") == "hero" for a in confirmed)
    data["status"] = "READY_FOR_LP_GENERATOR" if hero_ok and len(confirmed) >= 2 else "ASSETS_REQUIRED"

    args.manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "manifest": str(args.manifest),
        "slot": args.slot,
        "registered": True,
        "commercial_usage_status": args.commercial_usage_status,
        "confirmed_asset_count": len(confirmed),
        "hero_confirmed": hero_ok,
        "manifest_status": data["status"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
