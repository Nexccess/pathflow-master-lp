#!/usr/bin/env python3
"""11A LP Generator v0.2.

Generates a store-specific HTML LP from validated copy, Visual Direction, and a
commercial-usage-aware visual asset manifest. It intentionally does not perform
11B diagnosis logic, tracking, deployment, Sales Ready, or approval.
"""
from __future__ import annotations
import argparse, html, json, os
from pathlib import Path
from typing import Any

ALLOWED_SECTION_TYPES={"hero","cards","proof","comparison","info","cta"}
ALLOWED_CLAIM_CLASSES={"FACT","REVIEW_EVIDENCE","GENERATED_COPY","INFERENCE"}
REQUIRED_VISUAL_SLOTS={"hero"}
QUALITY_VISUAL_SLOTS={"hero","consultation","style_set"}


def load_json(path:Path)->dict[str,Any]: return json.loads(path.read_text(encoding="utf-8"))
def esc(v:Any)->str: return html.escape(str(v or ""),quote=True)

def asset_index(manifest:dict[str,Any])->dict[str,dict[str,Any]]:
    return {str(a.get("slot")):a for a in manifest.get("assets") or [] if a.get("slot")}

def confirmed_asset(a:dict[str,Any]|None)->bool:
    return bool(a and a.get("commercial_usage_status")=="CONFIRMED" and str(a.get("src") or "").strip())

def validate(lp:dict[str,Any],visual:dict[str,Any],manifest:dict[str,Any])->tuple[list[str],list[str]]:
    errors:list[str]=[]; asset_errors:list[str]=[]
    if visual.get("status")!="READY_FOR_LP_GENERATOR": errors.append("visual_direction_not_ready")
    if str(lp.get("storeId"))!=str(visual.get("storeId")): errors.append("store_id_mismatch")
    if str(lp.get("storeId"))!=str(manifest.get("storeId")): errors.append("asset_manifest_store_id_mismatch")
    if not isinstance(lp.get("sections"),list) or not lp["sections"]: errors.append("sections_must_be_non_empty_list")
    theme=lp.get("theme") or {}
    for key in ("background","surface","text","mutedText","primary","accent"):
        if not str(theme.get(key) or "").strip(): errors.append(f"missing_theme_{key}")
    for i,s in enumerate(lp.get("sections") or []):
        if s.get("type") not in ALLOWED_SECTION_TYPES: errors.append(f"section_{i}_invalid_type")
        for b in s.get("claimBlocks") or []:
            if b.get("claimClass") not in ALLOWED_CLAIM_CLASSES: errors.append(f"section_{i}_invalid_claim_class")
            if not isinstance(b.get("sourceRefs"),list) or not b.get("sourceRefs"): errors.append(f"section_{i}_claim_without_source_refs")
    assets=asset_index(manifest)
    for slot in REQUIRED_VISUAL_SLOTS:
        if not confirmed_asset(assets.get(slot)): asset_errors.append(f"required_visual_asset_not_confirmed:{slot}")
    confirmed_quality=sum(1 for slot in QUALITY_VISUAL_SLOTS if confirmed_asset(assets.get(slot)))
    if confirmed_quality<2: asset_errors.append("store_specific_visual_assets_below_minimum:2")
    return errors,asset_errors

def img(asset:dict[str,Any]|None,cls:str)->str:
    if not confirmed_asset(asset): return ""
    return f'<img class="{cls}" src="{esc(asset.get("src"))}" alt="{esc(asset.get("alt"))}" loading="lazy">'

def render_hero(s:dict[str,Any],assets:dict[str,dict[str,Any]])->str:
    bullets="".join(f"<li>{esc(x)}</li>" for x in s.get("bullets") or [])
    return f'''<section class="hero section" id="{esc(s.get('id','hero'))}"><div class="hero-copy"><p class="eyebrow">{esc(s.get('eyebrow'))}</p><h1>{esc(s.get('title'))}</h1><p class="lead">{esc(s.get('body'))}</p><ul class="hero-points">{bullets}</ul></div><figure class="hero-visual">{img(assets.get('hero'),'hero-image')}</figure></section>'''

def section_media(s:dict[str,Any],assets:dict[str,dict[str,Any]])->str:
    slot=s.get("assetSlot")
    return f'<div class="section-media">{img(assets.get(str(slot)),"section-image")}</div>' if slot else ""

def render_cards(s:dict[str,Any],assets:dict[str,dict[str,Any]])->str:
    cards="".join(f'<article class="card"><p class="card-kicker">{esc(x.get("kicker"))}</p><h3>{esc(x.get("title"))}</h3><p>{esc(x.get("body"))}</p></article>' for x in s.get("items") or [])
    return f'<section class="section" id="{esc(s.get("id"))}"><div class="section-head"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2><p>{esc(s.get("body"))}</p></div>{section_media(s,assets)}<div class="card-grid">{cards}</div></section>'

def render_proof(s:dict[str,Any],assets:dict[str,dict[str,Any]])->str:
    items="".join(f'<article class="proof-item"><p class="proof-theme">{esc(x.get("theme"))}</p><p>{esc(x.get("summary"))}</p></article>' for x in s.get("items") or [])
    return f'<section class="section proof" id="{esc(s.get("id"))}"><div class="section-head"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2><p>{esc(s.get("body"))}</p></div>{section_media(s,assets)}<div class="proof-list">{items}</div></section>'

def render_comparison(s:dict[str,Any],assets:dict[str,dict[str,Any]])->str:
    items="".join(f'<article class="compare-item"><p class="compare-label">{esc(x.get("label"))}</p><h3>{esc(x.get("title"))}</h3><p>{esc(x.get("body"))}</p></article>' for x in s.get("items") or [])
    return f'<section class="section comparison" id="{esc(s.get("id"))}"><div class="section-head"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2><p>{esc(s.get("body"))}</p></div>{section_media(s,assets)}<div class="compare-grid">{items}</div></section>'

def render_info(s:dict[str,Any],assets:dict[str,dict[str,Any]])->str:
    rows="".join(f'<div class="info-row"><span>{esc(x.get("label"))}</span><strong>{esc(x.get("value"))}</strong></div>' for x in s.get("items") or [])
    return f'<section class="section info" id="{esc(s.get("id"))}"><div class="section-head"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2></div><div class="info-list">{rows}</div></section>'

def render_cta(s:dict[str,Any],assets:dict[str,dict[str,Any]])->str:
    return f'<section class="section cta" id="{esc(s.get("id"))}"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2><p>{esc(s.get("body"))}</p><button type="button" disabled aria-disabled="true">{esc(s.get("label"))}</button></section>'

RENDERERS={"hero":render_hero,"cards":render_cards,"proof":render_proof,"comparison":render_comparison,"info":render_info,"cta":render_cta}

def render_document(lp:dict[str,Any],visual:dict[str,Any],manifest:dict[str,Any],output_path:Path)->str:
    t=lp["theme"]; mode=esc(lp.get("layoutMode","organic")); density=esc((visual.get("storeSpecificDirection") or {}).get("layoutDensity","medium")); assets=asset_index(manifest)
    for asset in assets.values():
        src=str(asset.get("src") or "").strip()
        if src:
            asset["src"]=os.path.relpath(Path(src),start=output_path.parent).replace("\\","/")
    sections="\n".join(RENDERERS[s["type"]](s,assets) for s in lp["sections"])
    store=esc(lp.get("storeName")); meta=esc(lp.get("metaDescription")); fh=esc(t.get("headingFont","Georgia, serif")); fb=esc(t.get("bodyFont","Arial, sans-serif"))
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{meta}"><title>{store}</title><style>
:root{{--bg:{esc(t['background'])};--surface:{esc(t['surface'])};--text:{esc(t['text'])};--muted:{esc(t['mutedText'])};--primary:{esc(t['primary'])};--accent:{esc(t['accent'])};--border:{esc(t.get('border','#d7d7d7'))};--radius:{esc(t.get('radius','24px'))};--shadow:{esc(t.get('shadow','0 18px 50px rgba(0,0,0,.08)'))}}}*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font-family:{fb};line-height:1.75}}main{{overflow:hidden}}.section{{width:min(1120px,calc(100% - 40px));margin:auto;padding:92px 0}}.eyebrow{{font-size:.76rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}}h1,h2,h3{{font-family:{fh};line-height:1.12;margin:0 0 20px}}h1{{font-size:clamp(2.7rem,7vw,6.1rem);max-width:11ch}}h2{{font-size:clamp(2rem,4vw,4rem);max-width:16ch}}p{{margin:0 0 18px}}.lead{{font-size:clamp(1.05rem,2vw,1.35rem);max-width:42rem;color:var(--muted)}}.hero{{min-height:88vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:56px}}.hero-visual{{height:min(74vh,720px);margin:0;overflow:hidden;border-radius:var(--radius)}}.hero-image,.section-image{{width:100%;height:100%;object-fit:cover;display:block}}.hero-points{{padding-left:1.2rem;color:var(--muted)}}.section-head{{max-width:760px;margin-bottom:38px}}.section-media{{height:min(56vw,540px);overflow:hidden;border-radius:var(--radius);margin:0 0 34px}}.card-grid,.compare-grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}}.card,.compare-item,.proof-item{{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;box-shadow:var(--shadow)}}.card-kicker,.compare-label,.proof-theme{{font-size:.78rem;color:var(--accent);font-weight:700;letter-spacing:.08em}}.proof-list{{display:grid;gap:14px;max-width:920px}}.proof-item{{display:grid;grid-template-columns:220px 1fr;gap:28px}}.info-list{{border-top:1px solid var(--border);max-width:820px}}.info-row{{display:grid;grid-template-columns:180px 1fr;gap:24px;padding:18px 0;border-bottom:1px solid var(--border)}}.cta{{text-align:center;background:var(--primary);color:white;border-radius:var(--radius);padding-inline:32px;margin-bottom:72px}}.cta h2,.cta p{{margin-inline:auto}}button{{margin-top:16px;border:0;border-radius:999px;padding:16px 28px;background:var(--surface);color:var(--text);font-weight:700}}body[data-layout="structured"] .card,body[data-layout="structured"] .compare-item{{border-radius:8px;box-shadow:none}}body[data-layout="structured"] .section-media{{border-radius:8px}}
@media(max-width:760px){{.section{{width:min(100% - 28px,680px);padding:64px 0}}.hero{{min-height:auto;grid-template-columns:1fr;padding-top:64px}}.hero-visual{{height:58vh}}.card-grid,.compare-grid{{grid-template-columns:1fr}}.proof-item,.info-row{{grid-template-columns:1fr;gap:6px}}h1{{font-size:clamp(2.45rem,14vw,4.5rem)}}}}@media(prefers-reduced-motion:reduce){{*{{animation:none!important;transition:none!important}}}}
</style></head><body data-layout="{mode}" data-density="{density}"><main>{sections}</main></body></html>'''

def main()->None:
    p=argparse.ArgumentParser(description="Generate one 11A store-specific LP draft with photography gate")
    p.add_argument("lp_input",type=Path); p.add_argument("visual_direction",type=Path); p.add_argument("asset_manifest",type=Path); p.add_argument("--output",type=Path,required=True); p.add_argument("--report",type=Path)
    a=p.parse_args(); lp=load_json(a.lp_input); visual=load_json(a.visual_direction); manifest=load_json(a.asset_manifest); errors,asset_errors=validate(lp,visual,manifest)
    status="INVALID_INPUT" if errors else ("BLOCKED_ASSET_REQUIREMENTS" if asset_errors else "PASS")
    report={"schemaVersion":"11A-lp-generator-report-v0.2","storeId":lp.get("storeId"),"status":status,"errors":errors,"assetErrors":asset_errors,"output":str(a.output),"creativeStatus":"DRAFT" if status=="PASS" else "NOT_GENERATED","pathFlowStatus":"NOT_APPLICABLE_11A"}
    if a.report:
        a.report.parent.mkdir(parents=True,exist_ok=True); a.report.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if status!="PASS": raise SystemExit(3 if asset_errors and not errors else 2)
    a.output.parent.mkdir(parents=True,exist_ok=True); a.output.write_text(render_document(lp,visual,manifest,a.output),encoding="utf-8")
if __name__=="__main__": main()
