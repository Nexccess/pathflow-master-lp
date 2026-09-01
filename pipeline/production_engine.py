#!/usr/bin/env python3
"""Path-Flow 11A-Production handoff assembler.

Takes one store production workspace, verifies required stage artifacts, applies
QA/approval gates, and emits an Approved Creative Package only when the store is
eligible for 11B-Integration.

This deliberately does not template a design. It orchestrates artifacts and
quality gates; creative generation remains replaceable behind the stage files.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

from creative_package import validate_package

STAGE_FILES = {
    "store_intelligence": "store_intelligence.json",
    "customer_voice": "customer_voice.json",
    "message_strategy": "message_strategy.json",
    "information_priority": "information_priority.json",
    "visual_direction": "visual_direction.json",
    "creative_assets": "creative_assets.json",
    "evidence_map": "evidence_map.json",
    "cta_placement": "cta_placement.json",
    "diagnosis_entry_point": "diagnosis_entry_point.json",
    "qa_result": "qa_result.json",
    "approval": "approval.json",
}

LP_CANDIDATES = ("lp_design.html", "lp_design.json", "lp_design.png")


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def normalize_decision(qa: Any) -> str:
    if isinstance(qa, str):
        return qa.strip().upper()
    if isinstance(qa, dict):
        return str(qa.get("decision") or qa.get("status") or "").strip().upper()
    return ""


def assemble(workspace: Path) -> tuple[dict[str, Any] | None, dict[str, Any]]:
    errors: list[str] = []
    stages: dict[str, Any] = {}

    for key, filename in STAGE_FILES.items():
        path = workspace / filename
        if not path.exists():
            errors.append(f"missing stage artifact: {filename}")
            continue
        try:
            stages[key] = load_json(path)
        except Exception as exc:
            errors.append(f"invalid JSON {filename}: {exc}")

    lp_path = next((workspace / name for name in LP_CANDIDATES if (workspace / name).exists()), None)
    if not lp_path:
        errors.append("missing LP design artifact (lp_design.html/json/png)")

    if errors:
        return None, {"status": "INCOMPLETE", "errors": errors}

    qa = stages["qa_result"]
    decision = normalize_decision(qa)
    approval = stages["approval"] if isinstance(stages["approval"], dict) else {}
    approval_type = str(approval.get("approval_type") or "").strip().upper()
    creative_status = str(approval.get("creative_status") or "").strip().upper()

    if decision == "REJECTED":
        return None, {"status": "REJECTED", "errors": ["QA decision is REJECTED"]}
    if decision == "REVIEW_REQUIRED" and approval_type != "HUMAN_APPROVED":
        return None, {"status": "REVIEW_REQUIRED", "errors": ["Human approval required before 11B handoff"]}
    if creative_status != "APPROVED":
        return None, {"status": "NOT_APPROVED", "errors": ["creative_status must be APPROVED"]}
    if approval_type not in {"HUMAN_APPROVED", "AUTO_APPROVED"}:
        return None, {"status": "NOT_APPROVED", "errors": ["approval_type is invalid"]}

    package = {
        "reference_case_id": approval.get("reference_case_id"),
        "store_id": approval.get("store_id"),
        "store_name": approval.get("store_name"),
        "creative_status": creative_status,
        "creative_version": approval.get("creative_version"),
        "approval_type": approval_type,
        "approved_by": approval.get("approved_by"),
        "lp_design": {
            "artifact_name": lp_path.name,
            "artifact_sha256": sha256(lp_path),
            "artifact_bytes": lp_path.stat().st_size,
        },
        "message_strategy": stages["message_strategy"],
        "information_priority": stages["information_priority"],
        "visual_direction": stages["visual_direction"],
        "creative_assets": stages["creative_assets"],
        "evidence_map": stages["evidence_map"],
        "cta_placement": stages["cta_placement"],
        "diagnosis_entry_point": stages["diagnosis_entry_point"],
        "qa_result": qa,
        "source_trace": {
            "store_intelligence": STAGE_FILES["store_intelligence"],
            "customer_voice": STAGE_FILES["customer_voice"],
        },
        "handoff_target": "11B-Integration",
        "creative_owned_fields_locked": True,
    }

    validation_errors, warnings = validate_package(package)
    if validation_errors:
        return None, {"status": "PACKAGE_INVALID", "errors": validation_errors, "warnings": warnings}

    return package, {"status": "APPROVED_PACKAGE_READY", "errors": [], "warnings": warnings}


def main() -> None:
    parser = argparse.ArgumentParser(description="Assemble one 11A Approved Creative Package")
    parser.add_argument("workspace", type=Path)
    parser.add_argument("--output", type=Path, default=None)
    args = parser.parse_args()

    package, report = assemble(args.workspace)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if package is None:
        raise SystemExit(1)

    output = args.output or args.workspace / "approved_creative_package.json"
    output.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote: {output}")


if __name__ == "__main__":
    main()
