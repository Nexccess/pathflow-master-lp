from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "reference_cases" / "violet_01" / "approved_creative_package.json"
LP = ROOT / "generated" / "9" / "index.html"
VERCEL = ROOT / "vercel.json"

RECEPTION_PATH = "/p/9/reception"
LEGACY_ANCHOR = 'href="#customer-voice"'


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def main() -> None:
    if not MANIFEST.exists():
        fail("Approved Creative manifest missing")
    if not LP.exists():
        fail("Violet production LP missing")
    if not VERCEL.exists():
        fail("vercel.json missing")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("creative_status") != "APPROVED":
        fail("creative_status is not APPROVED")
    if manifest.get("approval_type") not in {"HUMAN_APPROVED", "AUTO_APPROVED"}:
        fail("approval_type is not accepted")
    if manifest.get("creative_owned_fields_locked") is not True:
        fail("creative-owned fields are not locked")

    html = LP.read_text(encoding="utf-8")
    if RECEPTION_PATH not in html:
        fail(f"Approved LP does not link to {RECEPTION_PATH}")
    if LEGACY_ANCHOR in html:
        fail("legacy #customer-voice CTA remains in production LP")

    vercel = json.loads(VERCEL.read_text(encoding="utf-8"))
    rewrites = vercel.get("rewrites", [])
    expected = {
        "source": "/p/:id/reception",
        "destination": "/pages/reception.html?storeId=:id",
    }
    if expected not in rewrites:
        fail("11B reception rewrite is missing")

    print("PASS: Violet Approved Creative integration contract is Sales Ready compatible")


if __name__ == "__main__":
    main()
