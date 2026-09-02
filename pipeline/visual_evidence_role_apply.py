#!/usr/bin/env python3
"""Apply 11A Visual Evidence Role metadata to an existing asset manifest.

This script does not change commercial usage rights. It classifies GENERATED
visuals as ILLUSTRATIVE so they cannot be silently treated as real store evidence.
"""
from __future__ import annotations
import argparse, json
from pathlib import Path

ILLUSTRATIVE_SLOTS = {"hero", "consultation", "style_set"}


def main() -> None:
    p = argparse.ArgumentParser(description="Apply Visual Evidence Role metadata to an 11A asset manifest")
    p.add_argument("manifest", type=Path)
    args = p.parse_args()

    data = json.loads(args.manifest.read_text(encoding="utf-8"))
    changed = []
    for asset in data.get("assets") or []:
        slot = str(asset.get("slot") or "")
        source_type = str(asset.get("source_type") or "UNKNOWN")
        if source_type == "GENERATED" and slot in ILLUSTRATIVE_SLOTS:
            asset["evidence_role"] = "ILLUSTRATIVE"
            asset["store_evidence_status"] = "NOT_STORE_EVIDENCE"
            asset["disclosure_level"] = "LIGHT" if slot == "hero" else "FULL"
            changed.append(slot)
        else:
            asset.setdefault("evidence_role", "UNCLASSIFIED")
            asset.setdefault("store_evidence_status", "UNKNOWN")
            asset.setdefault("disclosure_level", "NONE")

    data["visualEvidencePolicy"] = {
        "schemaVersion": "11A-visual-evidence-role-v0.1",
        "generatedVisualPolicy": "GENERATED visuals must be treated as ILLUSTRATIVE and never as store evidence",
        "heroDisclosure": "LIGHT",
        "evidenceSectionDisclosure": "FULL",
    }
    args.manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({
        "manifest": str(args.manifest),
        "status": "UPDATED",
        "classifiedSlots": changed,
        "policy": "11A-visual-evidence-role-v0.1",
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
