#!/usr/bin/env python3
"""11A LP Generator v0.4.

Generates a store-specific HTML LP from validated copy, Visual Direction, and a
commercial-usage-aware visual asset manifest. v0.4 keeps store-specific
composition profiles while making them fluid across wide desktop, intermediate,
and mobile widths.

It intentionally does not perform 11B diagnosis logic, tracking, deployment,
Sales Ready, or approval.
"""
from __future__ import annotations
import argparse, html, json, os
from pathlib import Path
from typing import Any

ALLOWED_SECTION_TYPES={"hero","cards","proof","comparison","info","cta"}
ALLOWED_CLAIM_CLASSES={"FACT","REVIEW_EVIDENCE","GENERATED_COPY","INFERENCE"}
ALLOWED_COMPOSITION_PROFILES={"editorial-offset","image-led"}
REQUIRED_VISUAL_SLOTS={"hero"}
QUALITY_VISUAL_SLOTS={"hero","consultation","style_set"}


def load_json(path:Path)->dict[str,Any]: return json.loads(path.read_text(encoding="utf-8"))
def esc(v:Any)->str: return html.escape(str(v or ""),quote=True)

def asset_index(manifest:dict[str,Any])->dict[str,dict[str,Any]]:
    return {str(a.get("slot")):dict(a) for a in manifest.get("assets") or [] if a.get("slot")}

def confirmed_asset(a:dict[str,Any]|None)->bool:
    return bool(a and a.get("commercial_usage_status")=="CONFIRMED" and str(a.get("src") or "").strip())

def validate(lp:dict[str,Any],visual:dict[str,Any],manifest:dict[str,Any])->tuple[list[str],list[str]]:
    errors:list[str]=[]; asset_errors:list[str]=[]
    if visual.get("status")!="READY_FOR_LP_GENERATOR": errors.append("visual_direction_not_ready")
    if str(lp.get("storeId"))!=str(visual.get("storeId")): errors.append("store_id_mismatch")
    if str(lp.get("storeId"))!=str(manifest.get("storeId")): errors.append("asset_manifest_store_id_mismatch")
    if lp.get("compositionProfile") not in ALLOWED_COMPOSITION_PROFILES: errors.append("invalid_composition_profile")
    if not isinstance(lp.get("sections"),list) or not lp["sections"]: errors.append("sections_must_be_non_empty_list")
    theme=lp.get("theme") or {}
    for key in ("background","surface","text","mutedText","primary","accent"):
        if not str(theme.get(key) or "").strip(): errors.append(f"missing_theme_{key}")
    for i,s in enumerate(lp.get("sections") or []):
        if s.get("type") not in ALLOWED_SECTION_TYPES: errors.append(f"section_{i}_invalid_type")
        if s.get("type")=="hero" and s.get("titleLines") is not None:
            if not isinstance(s.get("titleLines"),list) or not all(str(x).strip() for x in s.get("titleLines") or []): errors.append("hero_title_lines_invalid")
        for b in s.get("claimBlocks") or []:
            if b.get("claimClass") not in ALLOWED_CLAIM_CLASSES: errors.append(f"section_{i}_invalid_claim_class")
            if not isinstance(b.get("sourceRefs"),list) or not b.get("sourceRefs"): errors.append(f"section_{i}_claim_without_source_refs")
    assets=asset_index(manifest)
    for slot in REQUIRED_VISUAL_SLOTS:
        if not confirmed_asset(assets.get(slot)): asset_errors.append(f"required_visual_asset_not_confirmed:{slot}")
    confirmed_quality=sum(1 for slot in QUALITY_VISUAL_SLOTS if confirmed_asset(assets.get(slot)))
    if confirmed_quality<2: asset_errors.append("store_specific_visual_assets_below_minimum:2")
    return errors,asset_errors

def img(asset:dict[str,Any]|None,cls:str,position:str|None=None)->str:
    if not confirmed_asset(asset): return ""
    style=f' style="object-position:{esc(position)}"' if position else ""
    return f'<img class="{cls}" src="{esc(asset.get("src"))}" alt="{esc(asset.get("alt"))}" loading="lazy"{style}>'

def headline(s:dict[str,Any],tag:str="h1")->str:
    lines=s.get("titleLines")
    if isinstance(lines,list) and lines:
        inner="".join(f'<span class="title-line">{esc(x)}</span>' for x in lines)
        return f'<{tag} class="controlled-title">{inner}</{tag}>'
    return f'<{tag}>{esc(s.get("title"))}</{tag}>'

def render_hero(s:dict[str,Any],assets:dict[str,dict[str,Any]],lp:dict[str,Any])->str:
    bullets="".join(f"<li>{esc(x)}</li>" for x in s.get("bullets") or [])
    pos=str(lp.get("heroObjectPosition") or "50% 50%")
    return f'''<section class="hero section" id="{esc(s.get('id','hero'))}"><div class="hero-copy"><p class="eyebrow">{esc(s.get('eyebrow'))}</p>{headline(s)}<p class="lead">{esc(s.get('body'))}</p><ul class="hero-points">{bullets}</ul></div><figure class="hero-visual">{img(assets.get('hero'),'hero-image',pos)}</figure></section>'''

def section_media(s:dict[str,Any],assets:dict[str,dict[str,Any]])->str:
    slot=s.get("assetSlot")
    return f'<div class="section-media">{img(assets.get(str(slot)),"section-image")}</div>' if slot else ""

def render_cards(s:dict[str,Any],assets:dict[str,dict[str,Any]],lp:dict[str,Any])->str:
    cards="".join(f'<article class="card"><p class="card-kicker">{esc(x.get("kicker"))}</p><h3>{esc(x.get("title"))}</h3><p>{esc(x.get("body"))}</p></article>' for x in s.get("items") or [])
    return f'<section class="section" id="{esc(s.get("id"))}"><div class="section-head"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2><p>{esc(s.get("body"))}</p></div>{section_media(s,assets)}<div class="card-grid">{cards}</div></section>'

def render_proof(s:dict[str,Any],assets:dict[str,dict[str,Any]],lp:dict[str,Any])->str:
    items="".join(f'<article class="proof-item"><p class="proof-theme">{esc(x.get("theme"))}</p><p>{esc(x.get("summary"))}</p></article>' for x in s.get("items") or [])
    return f'<section class="section proof" id="{esc(s.get("id"))}"><div class="section-head"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2><p>{esc(s.get("body"))}</p></div>{section_media(s,assets)}<div class="proof-list">{items}</div></section>'

def render_comparison(s:dict[str,Any],assets:dict[str,dict[str,Any]],lp:dict[str,Any])->str:
    items="".join(f'<article class="compare-item"><p class="compare-label">{esc(x.get("label"))}</p><h3>{esc(x.get("title"))}</h3><p>{esc(x.get("body"))}</p></article>' for x in s.get("items") or [])
    return f'<section class="section comparison" id="{esc(s.get("id"))}"><div class="section-head"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2><p>{esc(s.get("body"))}</p></div>{section_media(s,assets)}<div class="compare-grid">{items}</div></section>'

def render_info(s:dict[str,Any],assets:dict[str,dict[str,Any]],lp:dict[str,Any])->str:
    rows="".join(f'<div class="info-row"><span>{esc(x.get("label"))}</span><strong>{esc(x.get("value"))}</strong></div>' for x in s.get("items") or [])
    return f'<section class="section info" id="{esc(s.get("id"))}"><div class="section-head"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2></div><div class="info-list">{rows}</div></section>'

def render_cta(s:dict[str,Any],assets:dict[str,dict[str,Any]],lp:dict[str,Any])->str:
    return f'<section class="section cta" id="{esc(s.get("id"))}"><p class="eyebrow">{esc(s.get("eyebrow"))}</p><h2>{esc(s.get("title"))}</h2><p>{esc(s.get("body"))}</p><button type="button" disabled aria-disabled="true">{esc(s.get("label"))}</button></section>'

RENDERERS={"hero":render_hero,"cards":render_cards,"proof":render_proof,"comparison":render_comparison,"info":render_info,"cta":render_cta}

def render_document(lp:dict[str,Any],visual:dict[str,Any],manifest:dict[str,Any],output_path:Path)->str:
    t=lp["theme"]; mode=esc(lp.get("layoutMode","organic")); profile=esc(lp.get("compositionProfile")); density=esc((visual.get("storeSpecificDirection") or {}).get("layoutDensity","medium")); assets=asset_index(manifest)
    for asset in assets.values():
        src=str(asset.get("src") or "").strip()
        if src: asset["src"]=os.path.relpath(Path(src),start=output_path.parent).replace("\\","/")
    sections="\n".join(RENDERERS[s["type"]](s,assets,lp) for s in lp["sections"])
    store=esc(lp.get("storeName")); meta=esc(lp.get("metaDescription")); fh=esc(t.get("headingFont","Georgia, serif")); fb=esc(t.get("bodyFont","Arial, sans-serif"))
    return f'''<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{meta}"><title>{store}</title><style>
:root{{--bg:{esc(t['background'])};--surface:{esc(t['surface'])};--text:{esc(t['text'])};--muted:{esc(t['mutedText'])};--primary:{esc(t['primary'])};--accent:{esc(t['accent'])};--border:{esc(t.get('border','#d7d7d7'))};--radius:{esc(t.get('radius','24px'))};--shadow:{esc(t.get('shadow','0 18px 50px rgba(0,0,0,.08)'))}}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--text);font-family:{fb};line-height:1.75}}
main{{overflow:hidden}}
.section{{width:min(1280px,calc(100% - 64px));margin:auto;padding:88px 0}}
.eyebrow{{font-size:.76rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700}}
h1,h2,h3{{font-family:{fh};line-height:1.12;margin:0 0 20px}}
h1{{font-size:clamp(2.7rem,4.3vw,4.9rem)}}
h2{{font-size:clamp(2rem,3.4vw,3.7rem);max-width:16ch}}
.controlled-title{{max-width:none}}
.title-line{{display:block;white-space:normal;overflow-wrap:normal;word-break:keep-all}}
p{{margin:0 0 18px}}
.lead{{font-size:clamp(1.02rem,1.3vw,1.25rem);max-width:42rem;color:var(--muted)}}
.hero-points{{padding-left:1.2rem;color:var(--muted)}}
.hero-copy{{min-width:0}}
.hero-visual{{min-width:0;margin:0;overflow:hidden}}
.hero-image,.section-image{{width:100%;height:100%;object-fit:cover;display:block}}
.section-head{{max-width:760px;margin-bottom:38px}}
.section-media{{height:min(46vw,560px);overflow:hidden;border-radius:var(--radius);margin:0 0 34px}}
.card-grid,.compare-grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}}
.card,.compare-item,.proof-item{{min-width:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:28px;box-shadow:var(--shadow)}}
.card-kicker,.compare-label,.proof-theme{{font-size:.78rem;color:var(--accent);font-weight:700;letter-spacing:.08em}}
.proof-list{{display:grid;gap:14px;max-width:920px}}
.proof-item{{display:grid;grid-template-columns:220px minmax(0,1fr);gap:28px}}
.info-list{{border-top:1px solid var(--border);max-width:820px}}
.info-row{{display:grid;grid-template-columns:180px minmax(0,1fr);gap:24px;padding:18px 0;border-bottom:1px solid var(--border)}}
.cta{{text-align:center;background:var(--primary);color:white;border-radius:var(--radius);padding-inline:32px;margin-bottom:72px}}
.cta h2,.cta p{{margin-inline:auto}}
button{{margin-top:16px;border:0;border-radius:999px;padding:16px 28px;background:var(--surface);color:var(--text);font-weight:700}}

body[data-composition="editorial-offset"] .hero{{min-height:82vh;display:grid;grid-template-columns:minmax(0,1.12fr) minmax(420px,.88fr);align-items:center;gap:clamp(40px,5vw,84px)}}
body[data-composition="editorial-offset"] .hero-copy{{padding-left:clamp(0px,1vw,18px)}}
body[data-composition="editorial-offset"] .hero-visual{{height:min(68vh,680px);border-radius:var(--radius)}}
body[data-composition="editorial-offset"] .hero h1{{color:var(--primary);max-width:10.5em}}

body[data-composition="image-led"] .hero{{display:grid;grid-template-columns:1fr;gap:42px;padding-top:52px}}
body[data-composition="image-led"] .hero-visual{{order:-1;width:min(1100px,100%);height:min(58vh,620px);margin-inline:auto;border-radius:8px}}
body[data-composition="image-led"] .hero-copy{{width:min(980px,100%);margin-inline:auto;display:block}}
body[data-composition="image-led"] .hero-copy h1{{max-width:12em}}
body[data-composition="image-led"] .hero-copy .lead{{max-width:48rem}}
body[data-composition="image-led"] .hero-points{{max-width:48rem}}

body[data-layout="structured"] .card,body[data-layout="structured"] .compare-item{{border-radius:8px;box-shadow:none}}
body[data-layout="structured"] .section-media{{border-radius:8px}}

@media(max-width:1100px){{
  .section{{width:min(100% - 40px,860px);padding:72px 0}}
  body[data-composition="editorial-offset"] .hero{{min-height:auto;grid-template-columns:1fr;gap:34px;padding-top:60px}}
  body[data-composition="editorial-offset"] .hero-copy{{padding-left:0}}
  body[data-composition="editorial-offset"] .hero-visual{{height:min(68vh,620px)}}
  body[data-composition="image-led"] .hero{{gap:30px;padding-top:34px}}
  body[data-composition="image-led"] .hero-visual{{height:min(54vh,540px)}}
  h1{{font-size:clamp(2.35rem,6.8vw,4.25rem)}}
  .card-grid,.compare-grid{{grid-template-columns:1fr}}
  .proof-item,.info-row{{grid-template-columns:1fr;gap:6px}}
}}

@media(max-width:560px){{
  .section{{width:min(100% - 24px,520px);padding:54px 0}}
  h1{{font-size:clamp(2.05rem,10.5vw,3.5rem)}}
  .hero-visual,.section-media{{height:58vh}}
}}

@media(prefers-reduced-motion:reduce){{*{{animation:none!important;transition:none!important}}}}
</style></head><body data-layout="{mode}" data-density="{density}" data-composition="{profile}"><main>{sections}</main></body></html>'''

def main()->None:
    p=argparse.ArgumentParser(description="Generate one 11A store-specific LP draft with photography and fluid composition gates")
    p.add_argument("lp_input",type=Path); p.add_argument("visual_direction",type=Path); p.add_argument("asset_manifest",type=Path); p.add_argument("--output",type=Path,required=True); p.add_argument("--report",type=Path)
    a=p.parse_args(); lp=load_json(a.lp_input); visual=load_json(a.visual_direction); manifest=load_json(a.asset_manifest); errors,asset_errors=validate(lp,visual,manifest)
    status="INVALID_INPUT" if errors else ("BLOCKED_ASSET_REQUIREMENTS" if asset_errors else "PASS")
    report={"schemaVersion":"11A-lp-generator-report-v0.4","storeId":lp.get("storeId"),"status":status,"errors":errors,"assetErrors":asset_errors,"compositionProfile":lp.get("compositionProfile"),"output":str(a.output),"creativeStatus":"DRAFT" if status=="PASS" else "NOT_GENERATED","pathFlowStatus":"NOT_APPLICABLE_11A"}
    if a.report:
        a.report.parent.mkdir(parents=True,exist_ok=True); a.report.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if status!="PASS": raise SystemExit(3 if asset_errors and not errors else 2)
    a.output.parent.mkdir(parents=True,exist_ok=True); a.output.write_text(render_document(lp,visual,manifest,a.output),encoding="utf-8")
if __name__=="__main__": main()
