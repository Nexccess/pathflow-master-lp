#!/usr/bin/env python3
"""Create an 11A Approved LP package and optionally persist it for 11B.

This formalizes an already human-reviewed LP. It does not implement diagnosis,
deployment, Sales Ready, or Live Send.
"""
from __future__ import annotations
import argparse, hashlib, json, shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from lead_11a_evidence import connect as connect_11a_db, insert_approved


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
    p.add_argument("--db", type=Path, help="正本SQLite DB。指定時はApproved LP実体とEvidenceをlead_11a_evidenceへ格納")
    p.add_argument("--evidence-payload", type=Path, help="lead_id/Evidence/Creativeを含む11A handoff payload JSON")
    args = p.parse_args()

    if bool(args.db) != bool(args.evidence_payload):
        p.error("--db と --evidence-payload は同時指定してください")

    lp = load_json(args.lp_input)
    manifest = load_json(args.asset_manifest)
    gen = load_json(args.generator_report)
    veg = load_json(args.visual_evidence_report)
    errors: list[str] = []

    store_id = str(lp.get("storeId") or "").strip()
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

    payload: dict[str, Any] | None = None
    if args.evidence_payload:
        payload = load_json(args.evidence_payload)
        if str(payload.get("store_id") or "") != store_id:
            errors.append("evidence_payload_store_id_mismatch")
        if not payload.get("lead_id"):
            errors.append("evidence_payload_missing_lead_id")
        if not payload.get("evidence"):
            errors.append("evidence_payload_missing_evidence")
        if not str(payload.get("creative_interpretation") or "").strip():
            errors.append("evidence_payload_missing_creative_interpretation")
        if not str(payload.get("store_taste") or "").strip():
            errors.append("evidence_payload_missing_store_taste")
        if not payload.get("image_color_direction"):
            errors.append("evidence_payload_missing_image_color_direction")
        if not payload.get("visual_direction_summary"):
            errors.append("evidence_payload_missing_visual_direction_summary")

    if errors:
        print(json.dumps({"status":"BLOCKED","storeId":store_id,"errors":errors}, ensure_ascii=False, indent=2))
        raise SystemExit(5)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    out_html = args.output_dir / "index.html"
    shutil.copy2(args.approved_html, out_html)
    html_text = out_html.read_text(encoding="utf-8")
    html_hash = sha256(out_html)
    now = datetime.now(timezone.utc).isoformat()

    approval = {
        "schemaVersion": "11A-approved-lp-v0.2",
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
        "schemaVersion": "11A-to-11B-handoff-v0.2",
        "storeId": store_id,
        "leadId": payload.get("lead_id") if payload else None,
        "sourceStage": "11A_APPROVED_LP",
        "approvedLp": {"path": str(out_html), "sha256": html_hash},
        "dbHandoff": {
            "table": "lead_11a_evidence" if payload else None,
            "key": "lead_id" if payload else None,
            "status": "PERSISTED" if payload else "NOT_REQUESTED",
        },
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

    db_result = None
    if payload is not None and args.db is not None:
        with connect_11a_db(args.db) as con:
            db_result = insert_approved(
                con,
                lead_id=int(payload["lead_id"]),
                store_id=store_id,
                store_name=str(payload.get("store_name") or lp.get("storeName") or ""),
                evidence=payload["evidence"],
                customer_voice_summary=payload.get("customer_voice_summary", []),
                service_signals=payload.get("service_signals", []),
                store_taste=str(payload["store_taste"]),
                image_color_direction=payload["image_color_direction"],
                creative_interpretation=str(payload["creative_interpretation"]),
                visual_direction_summary=payload["visual_direction_summary"],
                approved_lp_html=html_text,
                revision=payload.get("revision"),
            )
        handoff["dbHandoff"]["revision"] = db_result["revision"]
        handoff["dbHandoff"]["approvedLpSha256"] = db_result["approved_lp_sha256"]

    (args.output_dir / "approved-lp.json").write_text(json.dumps(approval, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (args.output_dir / "11b-handoff.json").write_text(json.dumps(handoff, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if payload is not None:
        (args.output_dir / "evidence-map.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    result = {
        "status":"APPROVED_11A",
        "storeId":store_id,
        "outputDir":str(args.output_dir),
        "sha256":html_hash,
        "db":db_result,
        "salesReady":"BLOCKED",
        "liveSend":"BLOCKED",
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
