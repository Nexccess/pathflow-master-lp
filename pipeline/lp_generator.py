#!/usr/bin/env python3
"""11A LP Generator v0.1.

Generates a store-specific HTML LP from:
- validated LP content input
- READY_FOR_LP_GENERATOR visual direction

This generator deliberately does not perform 11B diagnosis logic, tracking,
deployment, Sales Ready, or approval. It emits a DRAFT LP artifact for Creative QA.
"""

from __future__ import annotations

import argparse
import html
import json
from pathlib import Path
from typing import Any

ALLOWED_SECTION_TYPES = {"hero", "cards", "proof", "comparison", "info", "cta"}
ALLOWED_CLAIM_CLASSES = {"FACT", "REVIEW_EVIDENCE", "GENERATED_COPY", "INFERENCE"}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def esc(value: Any) -> str:
    return html.escape(str(value or ""), quote=True)


def validate(lp: dict[str, Any], visual: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if visual.get("status") != "READY_FOR_LP_GENERATOR":
        errors.append("visual_direction_not_ready")
    if str(lp.get("storeId")) != str(visual.get("storeId")):
        errors.append("store_id_mismatch")
    if not isinstance(lp.get("sections"), list) or not lp["sections"]:
        errors.append("sections_must_be_non_empty_list")
    theme = lp.get("theme") or {}
    for key in ("background", "surface", "text", "mutedText", "primary", "accent"):
        if not str(theme.get(key) or "").strip():
            errors.append(f"missing_theme_{key}")
    for i, section in enumerate(lp.get("sections") or []):
        if section.get("type") not in ALLOWED_SECTION_TYPES:
            errors.append(f"section_{i}_invalid_type")
        for block in section.get("claimBlocks") or []:
            if block.get("claimClass") not in ALLOWED_CLAIM_CLASSES:
                errors.append(f"section_{i}_invalid_claim_class")
            if not isinstance(block.get("sourceRefs"), list) or not block.get("sourceRefs"):
                errors.append(f"section_{i}_claim_without_source_refs")
    return errors


def claim_badges(section: dict[str, Any]) -> str:
    badges: list[str] = []
    for block in section.get("claimBlocks") or []:
        cls = esc(block.get("claimClass"))
        badges.append(f'<span class="claim-badge">{cls}</span>')
    return "".join(badges)


def render_hero(section: dict[str, Any]) -> str:
    bullets = "".join(f"<li>{esc(x)}</li>" for x in section.get("bullets") or [])
    return f'''<section class="hero section" id="{esc(section.get('id','hero'))}">
      <div class="hero-copy">
        <p class="eyebrow">{esc(section.get('eyebrow'))}</p>
        <h1>{esc(section.get('title'))}</h1>
        <p class="lead">{esc(section.get('body'))}</p>
        <ul class="hero-points">{bullets}</ul>
        {claim_badges(section)}
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="visual-orb"></div><div class="visual-line"></div><div class="visual-panel"></div>
      </div>
    </section>'''


def render_cards(section: dict[str, Any]) -> str:
    cards = []
    for item in section.get("items") or []:
        cards.append(f'''<article class="card"><p class="card-kicker">{esc(item.get('kicker'))}</p><h3>{esc(item.get('title'))}</h3><p>{esc(item.get('body'))}</p></article>''')
    return f'''<section class="section" id="{esc(section.get('id'))}"><div class="section-head"><p class="eyebrow">{esc(section.get('eyebrow'))}</p><h2>{esc(section.get('title'))}</h2><p>{esc(section.get('body'))}</p></div><div class="card-grid">{''.join(cards)}</div>{claim_badges(section)}</section>'''


def render_proof(section: dict[str, Any]) -> str:
    items = []
    for item in section.get("items") or []:
        items.append(f'''<article class="proof-item"><p class="proof-theme">{esc(item.get('theme'))}</p><p>{esc(item.get('summary'))}</p></article>''')
    return f'''<section class="section proof" id="{esc(section.get('id'))}"><div class="section-head"><p class="eyebrow">{esc(section.get('eyebrow'))}</p><h2>{esc(section.get('title'))}</h2><p>{esc(section.get('body'))}</p></div><div class="proof-list">{''.join(items)}</div>{claim_badges(section)}</section>'''


def render_comparison(section: dict[str, Any]) -> str:
    items = []
    for item in section.get("items") or []:
        items.append(f'''<article class="compare-item"><p class="compare-label">{esc(item.get('label'))}</p><h3>{esc(item.get('title'))}</h3><p>{esc(item.get('body'))}</p></article>''')
    return f'''<section class="section comparison" id="{esc(section.get('id'))}"><div class="section-head"><p class="eyebrow">{esc(section.get('eyebrow'))}</p><h2>{esc(section.get('title'))}</h2><p>{esc(section.get('body'))}</p></div><div class="compare-grid">{''.join(items)}</div>{claim_badges(section)}</section>'''


def render_info(section: dict[str, Any]) -> str:
    rows = "".join(f'''<div class="info-row"><span>{esc(x.get('label'))}</span><strong>{esc(x.get('value'))}</strong></div>''' for x in section.get("items") or [])
    return f'''<section class="section info" id="{esc(section.get('id'))}"><div class="section-head"><p class="eyebrow">{esc(section.get('eyebrow'))}</p><h2>{esc(section.get('title'))}</h2></div><div class="info-list">{rows}</div>{claim_badges(section)}</section>'''


def render_cta(section: dict[str, Any]) -> str:
    return f'''<section class="section cta" id="{esc(section.get('id'))}"><p class="eyebrow">{esc(section.get('eyebrow'))}</p><h2>{esc(section.get('title'))}</h2><p>{esc(section.get('body'))}</p><button type="button" disabled aria-disabled="true">{esc(section.get('label'))}</button><p class="cta-note">11A preview — diagnosis function is not implemented in this phase.</p>{claim_badges(section)}</section>'''


RENDERERS = {
    "hero": render_hero,
    "cards": render_cards,
    "proof": render_proof,
    "comparison": render_comparison,
    "info": render_info,
    "cta": render_cta,
}


def render_document(lp: dict[str, Any], visual: dict[str, Any]) -> str:
    theme = lp["theme"]
    mode = esc(lp.get("layoutMode", "organic"))
    density = esc((visual.get("storeSpecificDirection") or {}).get("layoutDensity", "medium"))
    sections = "\n".join(RENDERERS[s["type"]](s) for s in lp["sections"])
    store = esc(lp.get("storeName"))
    meta = esc(lp.get("metaDescription"))
    font_heading = esc(theme.get("headingFont", "Georgia, serif"))
    font_body = esc(theme.get("bodyFont", "Arial, sans-serif"))
    return f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{meta}"><title>{store}</title>
<style>
:root{{--bg:{esc(theme['background'])};--surface:{esc(theme['surface'])};--text:{esc(theme['text'])};--muted:{esc(theme['mutedText'])};--primary:{esc(theme['primary'])};--accent:{esc(theme['accent'])};--border:{esc(theme.get('border','#d7d7d7'))};--radius:{esc(theme.get('radius','24px'))};--shadow:{esc(theme.get('shadow','0 18px 50px rgba(0,0,0,.08)'))};}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth}}body{{margin:0;background:var(--bg);color:var(--text);font-family:{font_body};line-height:1.75}}main{{overflow:hidden}}.section{{width:min(1120px,calc(100% - 40px));margin:0 auto;padding:96px 0}}.eyebrow{{font-size:.76rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}}h1,h2,h3{{font-family:{font_heading};line-height:1.15;margin:0 0 20px}}h1{{font-size:clamp(2.7rem,7vw,6.2rem);max-width:11ch}}h2{{font-size:clamp(2rem,4vw,4rem);max-width:16ch}}h3{{font-size:1.25rem}}p{{margin:0 0 18px}}.lead{{font-size:clamp(1.05rem,2vw,1.35rem);max-width:42rem;color:var(--muted)}}.hero{{min-height:90vh;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:48px}}.hero-points{{padding-left:1.2rem;color:var(--muted)}}.hero-visual{{position:relative;min-height:520px}}.visual-orb{{position:absolute;width:72%;aspect-ratio:1;border-radius:50%;background:var(--primary);opacity:.14;right:-6%;top:4%}}.visual-line{{position:absolute;width:3px;height:68%;background:var(--accent);left:22%;top:10%;opacity:.65}}.visual-panel{{position:absolute;inset:24% 4% 4% 18%;border:1px solid var(--border);border-radius:var(--radius);background:linear-gradient(145deg,var(--surface),transparent);box-shadow:var(--shadow)}}.section-head{{max-width:760px;margin-bottom:44px}}.section-head>p:last-child{{color:var(--muted)}}.card-grid,.compare-grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}}.card,.compare-item,.proof-item{{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;box-shadow:var(--shadow)}}.card-kicker,.compare-label,.proof-theme{{font-size:.78rem;color:var(--accent);font-weight:700;letter-spacing:.08em}}.proof-list{{display:grid;gap:14px;max-width:920px}}.proof-item{{display:grid;grid-template-columns:220px 1fr;gap:28px}}.info-list{{border-top:1px solid var(--border);max-width:820px}}.info-row{{display:grid;grid-template-columns:180px 1fr;gap:24px;padding:18px 0;border-bottom:1px solid var(--border)}}.cta{{text-align:center;background:var(--primary);color:white;border-radius:calc(var(--radius) * 1.2);padding-inline:32px;margin-bottom:72px}}.cta h2{{margin-inline:auto}}.cta p{{max-width:680px;margin-inline:auto}}button{{margin-top:16px;border:0;border-radius:999px;padding:16px 28px;background:var(--surface);color:var(--text);font-weight:700;opacity:.72}}.cta-note{{font-size:.78rem;opacity:.75;margin-top:12px!important}}.claim-badge{{display:inline-block;font-size:.62rem;letter-spacing:.08em;margin:10px 6px 0 0;padding:4px 8px;border:1px solid var(--border);border-radius:999px;color:var(--muted)}}body[data-layout="structured"] .section{{padding-block:76px}}body[data-layout="structured"] .card,body[data-layout="structured"] .compare-item{{border-radius:10px;box-shadow:none}}body[data-density="medium"] .section-head{{margin-bottom:32px}}
@media(max-width:760px){{.section{{width:min(100% - 28px,680px);padding:68px 0}}.hero{{min-height:auto;grid-template-columns:1fr;padding-top:72px}}.hero-visual{{min-height:320px}}.card-grid,.compare-grid{{grid-template-columns:1fr}}.proof-item{{grid-template-columns:1fr;gap:8px}}.info-row{{grid-template-columns:1fr;gap:4px}}h1{{font-size:clamp(2.45rem,14vw,4.5rem)}}}}
@media(prefers-reduced-motion:reduce){{html{{scroll-behavior:auto}}*{{animation:none!important;transition:none!important}}}}
</style></head><body data-layout="{mode}" data-density="{density}"><main>{sections}</main></body></html>'''


def main() -> None:
    p = argparse.ArgumentParser(description="Generate one 11A store-specific LP draft")
    p.add_argument("lp_input", type=Path)
    p.add_argument("visual_direction", type=Path)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--report", type=Path)
    args = p.parse_args()
    lp = load_json(args.lp_input)
    visual = load_json(args.visual_direction)
    errors = validate(lp, visual)
    report = {
        "schemaVersion": "11A-lp-generator-report-v0.1",
        "storeId": lp.get("storeId"),
        "status": "PASS" if not errors else "INVALID_INPUT",
        "errors": errors,
        "output": str(args.output),
        "creativeStatus": "DRAFT",
        "pathFlowStatus": "NOT_APPLICABLE_11A",
    }
    if errors:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        raise SystemExit(2)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_document(lp, visual), encoding="utf-8")
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
