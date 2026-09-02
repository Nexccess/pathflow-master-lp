#!/usr/bin/env python3
"""Create an 11A Approved LP package for 11B handoff.

This formalizes an already human-reviewed LP. It does not implement diagnosis,
deployment, Sales Ready, or Live Send.
"""
from __future__ import annotations
import argparse, hashlib, json, shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    p = argparse.ArgumentParser(description="Package one human-approved 11A LP for 11B handoff")
    p.add_argument("lp_input", type=Path)
    p.add_argument("asset_manifest", type=Path)
    p.add_argument("generator_report", type=Path)
    p.add_argument("visual_evidence_report", type=Path)
    p.add_argument("approved_html", type=Path)
    p.add_argument("--approved-by", required=True)
    p.add_argument("--design-qa", choices=["PASS"], required=True)
    p.add_argument("--commercial-qa", choices=["PASS"], required=True)
    p.add_argument("--output-dir", type=Path, required=True)
    args = p.parse_args()

    lp = load_json(args.lp_input)
    manifest = load_json(args.asset_manifest)
    gen = load_json(args.generator_report)
    veg = load_json(args.visual_evidence_report)
    errors: list[str] = []

    store_id = str(lp.get("storeId"))
    if not store_id:
        errors.append("missing_store_id")
    if manifest.get("storeId") != store_id:
        errors.append("asset_manifest_store_id_mismatch")
    if gen.get("storeId") != store_id or gen.get("status") != "PASS":
        errors.append("generator_report_not_pass")
    if veg.get("storeId") != store_id or veg.get("status") != "PASS":
        errors.append("visual_evidence_report_not_pass")
    if manifest.get("status") != "READY_FOR_LP_GENERATOR":
        errors.append("asset_manifest_not_ready")
    if not args.approved_html.exists():
        errors.append("approved_html_missing")

    for a in manifest.get("assets") or []:
        if a.get("source_type") == "GENERATED":
            slot = str(a.get("slot") or "unknown")
            if a.get("evidence_role") != "ILLUSTRATIVE":
                errors.append(f"generated_asset_not_illustrative:{slot}")
            if a.get("store_evidence_status") != "NOT_STORE_EVIDENCE":
                errors.append(f"generated_asset_store_evidence_not_blocked:{slot}")

    if errors:
        print(json.dumps({"status":"BLOCKED","storeId":store_id,"errors":errors}, ensure_ascii=False, indent=2))
        raise SystemExit(5)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    out_html = args.output_dir / "index.html"
    shutil.copy2(args.approved_html, out_html)
    html_hash = sha256(out_html)
    now = datetime.now(timezone.utc).isoformat()

    approval = {
        "schemaVersion": "11A-approved-lp-v0.1",
        "storeId": store_id,
        "storeName": lp.get("storeName"),
        "status": "APPROVED_11A",
        "approvedAt": now,
        "approvedBy": args.approved_by,
        "qa": {
            "hardGate": "PASS",
            "assetGate": "PASS",
            "designQa": args.design_qa,
            "visualEvidenceGuard": "PASS",
            "commercialQa": args.commercial_qa,
        },
        "artifact": {"path": str(out_html), "sha256": html_hash},
        "salesReady": "BLOCKED",
        "liveSend": "BLOCKED",
        "nextStage": "11B_DIAGNOSIS_INTEGRATION",
    }

    handoff = {
        "schemaVersion": "11A-to-11B-handoff-v0.1",
        "storeId": store_id,
        "sourceStage": "11A_APPROVED_LP",
        "approvedLp": {"path": str(out_html), "sha256": html_hash},
        "diagnosisIntegration": {
            "status": "NOT_IMPLEMENTED_11A",
            "owner": "11B",
            "requiredFlow": ["LP", "5-question diagnosis", "response processing", "result", "inquiry", "tracking"],
        },
        "visualEvidencePolicy": "11A-visual-evidence-role-v0.1",
        "salesReady": "BLOCKED",
        "liveSend": "BLOCKED",
        "releaseGate": "Kei must personally verify LP -> diagnosis -> result -> inquiry E2E before Sales Ready / Live Send approval.",
    }

    (args.output_dir / "approved-lp.json").write_text(json.dumps(approval, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output_dir / "11b-handoff.json").write_text(json.dumps(handoff, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status":"APPROVED_11A","storeId":store_id,"outputDir":str(args.output_dir),"sha256":html_hash,"salesReady":"BLOCKED","liveSend":"BLOCKED"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
