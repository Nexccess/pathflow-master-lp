#!/usr/bin/env python3
"""11A Visual Evidence Guard v0.3.

Validates that GENERATED visuals are explicitly classified as ILLUSTRATIVE and
adds visitor-facing disclosure text to an already generated LP HTML.
v0.3 keeps disclosures visibly attached to the relevant image and makes the
Hero figure a deliberate image+caption stack so the disclosure cannot drift
into the copy grid.

This script does not approve Commercial QA; it prepares the draft for human review.
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
from typing import Any

LIGHT_DISCLOSURE = "※掲載ビジュアルはイメージです。"
FULL_DISCLOSURE = "※掲載ビジュアルはAI生成のイメージです。実際の施術例・スタッフ・お客様の写真ではありません。"


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def classify_errors(manifest: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for asset in manifest.get("assets") or []:
        if asset.get("source_type") != "GENERATED":
            continue
        slot = str(asset.get("slot") or "unknown")
        if asset.get("evidence_role") != "ILLUSTRATIVE":
            errors.append(f"generated_asset_not_illustrative:{slot}")
        if asset.get("store_evidence_status") != "NOT_STORE_EVIDENCE":
            errors.append(f"generated_asset_store_evidence_not_blocked:{slot}")
        expected = "LIGHT" if slot == "hero" else "FULL"
        if asset.get("disclosure_level") != expected:
            errors.append(f"invalid_disclosure_level:{slot}:{expected}")
    return errors


def inject_hero_disclosure(html: str) -> tuple[str, bool]:
    start = html.find('<figure class="hero-visual">')
    if start < 0:
        return html, False
    end = html.find('</figure>', start)
    if end < 0:
        return html, False

    figure_html = html[start:end + len('</figure>')]
    marker = f'<figcaption class="visual-disclosure visual-disclosure--hero">{LIGHT_DISCLOSURE}</figcaption>'
    if marker not in figure_html:
        img_end = figure_html.find('>')
        img_start = figure_html.find('<img ', img_end + 1)
        if img_start < 0:
            return html, False
        img_close = figure_html.find('>', img_start)
        if img_close < 0:
            return html, False
        figure_html = figure_html[:img_close + 1] + marker + figure_html[img_close + 1:]
        html = html[:start] + figure_html + html[end + len('</figure>'):]
    return html, True


def inject_section_disclosures(html: str, lp: dict[str, Any], manifest: dict[str, Any]) -> tuple[str, list[str]]:
    assets = {str(a.get("slot")): a for a in manifest.get("assets") or [] if a.get("slot")}
    injected: list[str] = []

    hero = assets.get("hero")
    if hero and hero.get("source_type") == "GENERATED" and hero.get("disclosure_level") == "LIGHT":
        html, ok = inject_hero_disclosure(html)
        if ok:
            injected.append("hero")

    cursor = 0
    for section in lp.get("sections") or []:
        slot = section.get("assetSlot")
        if not slot:
            continue
        asset = assets.get(str(slot))
        if not asset or asset.get("source_type") != "GENERATED":
            continue
        if asset.get("disclosure_level") != "FULL":
            continue
        marker = '<div class="section-media">'
        start = html.find(marker, cursor)
        if start < 0:
            continue
        end = html.find('</div>', start)
        if end < 0:
            continue
        end += len('</div>')
        disclosure_html = (
            f'<p class="visual-disclosure visual-disclosure--full" role="note">'
            f'{FULL_DISCLOSURE}</p>'
        )
        nearby = html[end:end + len(disclosure_html) + 40]
        if disclosure_html not in nearby:
            html = html[:end] + disclosure_html + html[end:]
        cursor = end + len(disclosure_html)
        injected.append(str(slot))

    css = """
.visual-disclosure{
  box-sizing:border-box;
  color:var(--muted);
  font-size:clamp(.78rem,.74rem + .12vw,.86rem);
  line-height:1.55;
}
.hero-visual{
  overflow:visible !important;
  display:flex !important;
  flex-direction:column;
  height:auto !important;
}
.hero-visual .hero-image{
  width:100%;
  height:auto !important;
  aspect-ratio:4 / 5;
  object-fit:cover;
  flex:none;
}
body[data-composition="image-led"] .hero-visual .hero-image{
  aspect-ratio:16 / 9;
}
.visual-disclosure--hero{
  display:block;
  margin:.65rem .1rem 0;
  color:var(--muted);
  opacity:1;
}
.visual-disclosure--full{
  width:fit-content;
  max-width:52rem;
  margin:.7rem 0 1.35rem;
  padding:.58rem .78rem;
  border:1px solid var(--border);
  border-radius:8px;
  background:var(--surface);
  color:var(--text);
  opacity:.82;
}
@media(max-width:1100px){
  .hero-visual .hero-image{aspect-ratio:4 / 3}
  body[data-composition="image-led"] .hero-visual .hero-image{aspect-ratio:16 / 10}
}
@media(max-width:560px){
  .visual-disclosure{font-size:.78rem}
  .visual-disclosure--full{width:100%;padding:.55rem .65rem}
  .hero-visual .hero-image,
  body[data-composition="image-led"] .hero-visual .hero-image{aspect-ratio:4 / 5}
}
"""
    if ".hero-visual .hero-image{" not in html:
        html = html.replace("</style>", css + "</style>", 1)
    return html, injected


def main() -> None:
    p = argparse.ArgumentParser(description="Validate and disclose ILLUSTRATIVE visuals in an 11A LP draft")
    p.add_argument("lp_input", type=Path)
    p.add_argument("asset_manifest", type=Path)
    p.add_argument("input_html", type=Path)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--report", type=Path, required=True)
    args = p.parse_args()

    lp = load_json(args.lp_input)
    manifest = load_json(args.asset_manifest)
    errors = classify_errors(manifest)
    html = args.input_html.read_text(encoding="utf-8")

    injected: list[str] = []
    if not errors:
        html, injected = inject_section_disclosures(html, lp, manifest)
        required = [str(a.get("slot")) for a in manifest.get("assets") or [] if a.get("source_type") == "GENERATED"]
        missing = [slot for slot in required if slot not in injected]
        if missing:
            errors.extend(f"disclosure_not_injected:{slot}" for slot in missing)

    status = "PASS" if not errors else "REVIEW_REQUIRED"
    report = {
        "schemaVersion": "11A-visual-evidence-guard-v0.3",
        "storeId": lp.get("storeId"),
        "status": status,
        "errors": errors,
        "injectedDisclosures": injected,
        "commercialQaStatus": "READY_FOR_HUMAN_REVIEW" if status == "PASS" else "BLOCKED",
        "salesReady": "BLOCKED",
        "liveSend": "BLOCKED",
    }

    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))

    if status != "PASS":
        raise SystemExit(4)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
