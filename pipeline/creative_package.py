#!/usr/bin/env python3
"""Approved Creative Package contract for Path-Flow 11A -> 11B handoff.

This module does not generate creative. It validates the output contract that
11A-Production must satisfy before a package is eligible for 11B-Integration.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

REQUIRED_FIELDS = (
    "lp_design",
    "message_strategy",
    "information_priority",
    "visual_direction",
    "creative_assets",
    "evidence_map",
    "cta_placement",
    "diagnosis_entry_point",
    "creative_status",
    "creative_version",
    "qa_result",
    "approval_type",
)

APPROVED_STATUSES = {"APPROVED"}
APPROVAL_TYPES = {"HUMAN_APPROVED", "AUTO_APPROVED"}
QA_DECISIONS = {"AUTO_PASS", "REVIEW_REQUIRED", "REJECTED", "PASS"}


def _non_empty(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple, dict, set)):
        return bool(value)
    return True


def validate_package(package: dict[str, Any]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    for field in REQUIRED_FIELDS:
        if field not in package:
            errors.append(f"missing required field: {field}")
        elif not _non_empty(package[field]):
            errors.append(f"empty required field: {field}")

    status = str(package.get("creative_status", "")).strip().upper()
    if status and status not in APPROVED_STATUSES:
        errors.append(f"creative_status must be APPROVED for 11B handoff: {status}")

    approval_type = str(package.get("approval_type", "")).strip().upper()
    if approval_type and approval_type not in APPROVAL_TYPES:
        errors.append(f"invalid approval_type: {approval_type}")

    qa_result = package.get("qa_result")
    if isinstance(qa_result, str):
        decision = qa_result.strip().upper()
    elif isinstance(qa_result, dict):
        decision = str(qa_result.get("decision") or qa_result.get("status") or "").strip().upper()
    else:
        decision = ""

    if decision and decision not in QA_DECISIONS:
        warnings.append(f"unrecognized qa_result decision/status: {decision}")

    if decision in {"REJECTED", "REVIEW_REQUIRED"} and approval_type == "AUTO_APPROVED":
        errors.append(f"{decision} package cannot be AUTO_APPROVED")

    version = str(package.get("creative_version", "")).strip()
    if version and len(version) > 128:
        warnings.append("creative_version is unusually long")

    return errors, warnings


def is_handoff_ready(package: dict[str, Any]) -> bool:
    errors, _ = validate_package(package)
    return not errors


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate an Approved Creative Package for 11B handoff")
    parser.add_argument("package", type=Path, help="Path to Approved Creative Package JSON")
    args = parser.parse_args()

    data = json.loads(args.package.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise SystemExit("package root must be a JSON object")

    errors, warnings = validate_package(data)
    result = {
        "handoff_ready": not errors,
        "errors": errors,
        "warnings": warnings,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
