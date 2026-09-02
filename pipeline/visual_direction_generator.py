#!/usr/bin/env python3
"""11A Visual Direction Generator v0.1.

Builds an auditable store-specific Visual Direction from:
- upstream evidence/concept-led base direction
- filtered Design Intelligence output

Rules:
- REJECT candidates never govern Visual Direction.
- MODIFY candidates remain optional/adapted candidates.
- ACCEPT UNIVERSAL_GUARDRAIL candidates become production guardrails.
- Store-specific creative direction must come from upstream evidence/concept input,
  not from generic industry presets.
- This module does not generate LP HTML and does not perform 11B work.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

REQUIRED_BASE_FIELDS = {
    "concept",
    "colorDirection",
    "typographyDirection",
    "visualTone",
    "layoutDensity",
    "photographyDirection",
    "compositionDirection",
    "sectionPrinciples",
}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_base(base: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    missing = sorted(REQUIRED_BASE_FIELDS - set(base))
    if missing:
        errors.append("missing_base_fields:" + ",".join(missing))
    if not str(base.get("storeId") or "").strip():
        errors.append("missing_storeId")
    if not isinstance(base.get("evidenceRefs"), list) or not base.get("evidenceRefs"):
        errors.append("evidenceRefs_must_be_non_empty_list")
    return errors


def build_visual_direction(base: dict[str, Any], filtered: dict[str, Any]) -> dict[str, Any]:
    errors = validate_base(base)
    if errors:
        return {"schemaVersion": "11A-visual-direction-v0.1", "status": "INVALID_INPUT", "errors": errors}

    if filtered.get("storeId") != base.get("storeId"):
        return {
            "schemaVersion": "11A-visual-direction-v0.1",
            "status": "INVALID_INPUT",
            "errors": ["storeId_mismatch"],
        }

    accepted_guardrails: list[dict[str, Any]] = []
    adapted_candidates: list[dict[str, Any]] = []
    rejected_candidates: list[dict[str, Any]] = []
    review_required: list[dict[str, Any]] = []

    for item in filtered.get("candidates") or []:
        disposition = item.get("disposition")
        compact = {
            "candidateId": item.get("candidateId"),
            "category": item.get("category"),
            "candidateScope": item.get("candidateScope"),
            "recommendation": item.get("recommendation"),
            "gateReasons": item.get("gateReasons") or [],
            "revisionInstruction": item.get("revisionInstruction"),
        }
        if disposition == "ACCEPT" and item.get("candidateScope") == "UNIVERSAL_GUARDRAIL":
            accepted_guardrails.append(compact)
        elif disposition == "MODIFY":
            adapted_candidates.append(compact)
        elif disposition == "REJECT":
            rejected_candidates.append(compact)
        elif disposition == "REVIEW_REQUIRED":
            review_required.append(compact)

    status = "READY_FOR_LP_GENERATOR" if not review_required else "REVIEW_REQUIRED"

    return {
        "schemaVersion": "11A-visual-direction-v0.1",
        "storeId": base["storeId"],
        "storeName": base.get("storeName"),
        "status": status,
        "source": {
            "baseDirection": base.get("sourceArtifact"),
            "filteredDesignIntelligence": filtered.get("sourceAdapterArtifact"),
            "evidenceRefs": base["evidenceRefs"],
        },
        "creativeConcept": base["concept"],
        "storeSpecificDirection": {
            "colorDirection": base["colorDirection"],
            "typographyDirection": base["typographyDirection"],
            "visualTone": base["visualTone"],
            "layoutDensity": base["layoutDensity"],
            "photographyDirection": base["photographyDirection"],
            "compositionDirection": base["compositionDirection"],
            "sectionPrinciples": base["sectionPrinciples"],
            "motionDirection": base.get("motionDirection"),
            "decorativeTreatment": base.get("decorativeTreatment"),
        },
        "designIntelligence": {
            "acceptedUniversalGuardrails": accepted_guardrails,
            "adaptedCandidates": adapted_candidates,
            "rejectedCandidates": rejected_candidates,
            "reviewRequired": review_required,
        },
        "generatorRules": [
            "Rejected Design Intelligence candidates do not govern the final Visual Direction.",
            "Universal UX/accessibility guardrails may remain consistent across stores.",
            "Store-sensitive decisions remain evidence/concept-led.",
            "Unknown facts remain unknown and are not creatively promoted into claims.",
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate 11A store-specific Visual Direction")
    parser.add_argument("base_input", type=Path, help="Evidence/concept-led base direction JSON")
    parser.add_argument("filtered_input", type=Path, help="Filtered Design Intelligence JSON")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    result = build_visual_direction(load_json(args.base_input), load_json(args.filtered_input))
    rendered = json.dumps(result, ensure_ascii=False, indent=2)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered, encoding="utf-8")
    print(rendered)
    if result["status"] == "INVALID_INPUT":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
