#!/usr/bin/env python3
"""Deterministic policy gate for 11A Design Intelligence candidates.

This module does not invent semantic assessments. A preceding assessment step
must compare each UI/UX Pro Max candidate against Store Intelligence,
Interpretation, Creative Concept, and existing brand evidence.

This gate converts those explicit assessments into an auditable disposition:
ACCEPT / MODIFY / REJECT / REVIEW_REQUIRED.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ALLOWED = {
    "evidenceAlignment": {"PASS", "PARTIAL", "CONFLICT", "UNKNOWN"},
    "creativeConceptAlignment": {"PASS", "PARTIAL", "CONFLICT", "UNKNOWN"},
    "storeSpecificity": {"HIGH", "MEDIUM", "LOW", "UNKNOWN"},
    "genericnessRisk": {"LOW", "MEDIUM", "HIGH", "UNKNOWN"},
    "claimSafety": {"PASS", "RISK", "FAIL", "UNKNOWN"},
    "existingBrandAlignment": {"PASS", "PARTIAL", "CONFLICT", "NOT_APPLICABLE", "UNKNOWN"},
}


def validate_candidate(candidate: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for field, allowed in ALLOWED.items():
        value = candidate.get(field)
        if value not in allowed:
            errors.append(f"invalid_{field}:{value}")
    if not str(candidate.get("candidateId") or "").strip():
        errors.append("missing_candidateId")
    if not str(candidate.get("recommendation") or "").strip():
        errors.append("missing_recommendation")
    if not isinstance(candidate.get("reasons"), list):
        errors.append("reasons_must_be_list")
    return errors


def disposition(candidate: dict[str, Any]) -> tuple[str, list[str]]:
    reasons: list[str] = []

    evidence = candidate["evidenceAlignment"]
    concept = candidate["creativeConceptAlignment"]
    specificity = candidate["storeSpecificity"]
    genericness = candidate["genericnessRisk"]
    claim = candidate["claimSafety"]
    brand = candidate["existingBrandAlignment"]

    # Hard reject conditions: unsafe claims or direct conflict with authoritative inputs.
    if claim == "FAIL":
        reasons.append("claim_safety_fail")
    if evidence == "CONFLICT":
        reasons.append("store_evidence_conflict")
    if concept == "CONFLICT":
        reasons.append("creative_concept_conflict")
    if brand == "CONFLICT":
        reasons.append("existing_brand_conflict")
    if specificity == "LOW" and genericness == "HIGH":
        reasons.append("generic_industry_preset_risk")

    if reasons:
        return "REJECT", reasons

    # Review conditions: insufficient certainty must not be silently resolved.
    unknown_fields = [
        name
        for name in (
            "evidenceAlignment",
            "creativeConceptAlignment",
            "storeSpecificity",
            "genericnessRisk",
            "claimSafety",
            "existingBrandAlignment",
        )
        if candidate[name] == "UNKNOWN"
    ]
    if unknown_fields:
        return "REVIEW_REQUIRED", ["unknown:" + ",".join(unknown_fields)]

    if claim == "RISK":
        return "REVIEW_REQUIRED", ["claim_safety_risk"]

    # Modify when useful but not safe/strong enough to adopt unchanged.
    modify_reasons: list[str] = []
    if evidence == "PARTIAL":
        modify_reasons.append("partial_evidence_alignment")
    if concept == "PARTIAL":
        modify_reasons.append("partial_creative_concept_alignment")
    if brand == "PARTIAL":
        modify_reasons.append("partial_existing_brand_alignment")
    if specificity == "LOW":
        modify_reasons.append("low_store_specificity")
    if genericness == "HIGH":
        modify_reasons.append("high_genericness_risk")
    if genericness == "MEDIUM" and specificity != "HIGH":
        modify_reasons.append("genericness_requires_store_specific_adaptation")

    if modify_reasons:
        return "MODIFY", modify_reasons

    return "ACCEPT", ["all_mandatory_filters_passed"]


def filter_document(document: dict[str, Any]) -> dict[str, Any]:
    output: dict[str, Any] = {
        "schemaVersion": "11A-design-intelligence-filter-v0.1",
        "storeId": document.get("storeId"),
        "sourceAdapterArtifact": document.get("sourceAdapterArtifact"),
        "status": "PASS",
        "candidates": [],
        "summary": {"ACCEPT": 0, "MODIFY": 0, "REJECT": 0, "REVIEW_REQUIRED": 0},
    }

    candidates = document.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        output["status"] = "INVALID_INPUT"
        output["errors"] = ["candidates_must_be_non_empty_list"]
        return output

    for candidate in candidates:
        errors = validate_candidate(candidate)
        if errors:
            output["status"] = "INVALID_INPUT"
            output["candidates"].append(
                {
                    "candidateId": candidate.get("candidateId"),
                    "disposition": "REVIEW_REQUIRED",
                    "gateReasons": errors,
                    "original": candidate,
                }
            )
            output["summary"]["REVIEW_REQUIRED"] += 1
            continue

        result, gate_reasons = disposition(candidate)
        output["candidates"].append(
            {
                "candidateId": candidate["candidateId"],
                "category": candidate.get("category"),
                "recommendation": candidate["recommendation"],
                "disposition": result,
                "gateReasons": gate_reasons,
                "assessmentReasons": candidate.get("reasons") or [],
                "revisionInstruction": candidate.get("revisionInstruction"),
                "originalAssessment": {
                    key: candidate[key] for key in ALLOWED
                },
            }
        )
        output["summary"][result] += 1

    if output["status"] == "PASS" and output["summary"]["REVIEW_REQUIRED"]:
        output["status"] = "REVIEW_REQUIRED"
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply the 11A Design Intelligence Filter gate")
    parser.add_argument("input", type=Path, help="Structured candidate assessment JSON")
    parser.add_argument("--output", type=Path, help="Filtered output JSON path")
    args = parser.parse_args()

    document = json.loads(args.input.read_text(encoding="utf-8"))
    result = filter_document(document)

    rendered = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    print(rendered)

    if result["status"] == "INVALID_INPUT":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
