from __future__ import annotations

"""Build Lead 9 production LP from the approved Violet review board.

This builder intentionally does NOT generate or reinterpret Creative.
It extracts the exact approved visual material from the approved review board,
then renders the approved mobile LP structure and connects only the CTA to 11B.

Usage:
    python scripts/build_violet_approved_lp.py /path/to/VioletサロンLPと承認フロー仕様書.png

Output:
    generated/9/index.html
"""

import base64
import io
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "generated" / "9" / "index.html"
RECEPTION_PATH = "/p/9/reception"

# Pixel coordinates are tied to the approved 1024x1536 review board.
# They extract only visual assets already present in the approved Creative.
CROPS = {
    "hero": (48, 295, 295, 530),
    "style1": (31, 974, 109, 1056),
    "style2": (122, 974, 200, 1056),
    "style3": (212, 974, 291, 1056),
    "style4": (303, 974, 390, 1056),
    "review1": (44, 770, 74, 805),
    "review2": (44, 868, 74, 902),
}


def jpeg_data_uri(image: Image.Image, box: tuple[int, int, int, int]) -> str:
    crop = image.crop(box).convert("RGB")
    buf = io.BytesIO()
    crop.save(buf, format="JPEG", quality=88, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def render(assets: dict[str, str]) -> str:
    return f'''<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Violet Hair Salon | 希望を整理する</title>
<meta name="description" content="Violetで、あなたらしさが一番きれいに見える髪へ。5問で来店前の希望を整理できます。">
<meta name="pathflow-lead-id" content="9">
<meta name="pathflow-approved-creative" content="Violet Reference Case #01">
<style>
:root{{--violet:#6f529d;--violet-dark:#46316f;--cream:#fbf8f2;--paper:#fffdf9;--ink:#29232f;--muted:#7a7180;--line:#e8e0eb;--shadow:0 12px 32px rgba(70,49,111,.12)}}
*{{box-sizing:border-box}}html{{scroll-behavior:smooth;background:#efeaf2}}body{{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif;color:var(--ink);background:#efeaf2}}a{{color:inherit;text-decoration:none}}img{{display:block;width:100%}}.page{{width:min(100%,480px);margin:0 auto;background:var(--paper);min-height:100vh;box-shadow:0 0 50px rgba(48,34,70,.12)}}
header{{height:82px;padding:18px 24px 12px;display:flex;align-items:center;justify-content:space-between;background:#fff}}.brand{{font-family:Georgia,"Times New Roman","Yu Mincho",serif;text-align:center;color:var(--violet-dark);line-height:1}}.brand strong{{display:block;font-size:31px;font-weight:500}}.brand small{{display:block;font-size:9px;letter-spacing:.32em;margin-top:7px}}.menu{{width:26px;height:19px;display:grid;align-content:space-between}}.menu i{{height:1px;background:var(--violet-dark);display:block}}
.hero{{background:linear-gradient(180deg,#fff 0%,#f8f1ea 100%);padding:18px 24px 0}}.hero h1{{font-family:Georgia,"Yu Mincho",serif;color:var(--violet-dark);font-weight:500;font-size:29px;line-height:1.55;margin:0 0 10px}}.hero p{{font-size:13px;line-height:1.85;margin:0 0 16px;color:#443d47}}.hero-photo{{position:relative;margin:0 -24px}}.hero-photo img{{height:300px;object-fit:cover;object-position:center top}}.review-badge{{position:absolute;right:16px;bottom:20px;width:142px;padding:14px 13px;border-radius:10px;background:rgba(103,75,147,.9);color:#fff;box-shadow:var(--shadow);font-size:10px;line-height:1.65}}.review-badge .stars{{font-size:14px;color:#f2d476;margin:5px 0}}
.primary-cta{{display:flex;align-items:center;justify-content:center;gap:12px;padding:18px 22px;background:linear-gradient(100deg,#7e62ad,#5c3e8d);color:#fff;font-weight:700;font-size:17px;border-radius:32px;box-shadow:0 8px 20px rgba(89,61,138,.22)}}.hero-note{{text-align:center;font-size:11px;color:#725e7d;margin:9px 0 0;padding-bottom:20px}}.section{{padding:34px 22px}}.section h2{{font-family:Georgia,"Yu Mincho",serif;text-align:center;font-size:20px;margin:0 0 22px}}.reasons{{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;text-align:center}}.reason .ico{{width:42px;height:42px;border:1.5px solid var(--violet);border-radius:50%;margin:0 auto 10px;display:grid;place-items:center;color:var(--violet);font-size:19px}}.reason b{{display:block;font-size:11px;margin-bottom:6px}}.reason span{{font-size:9px;line-height:1.6;color:#615a64}}
.voices{{background:#faf7f3}}.voice-card{{display:grid;grid-template-columns:38px 1fr;gap:11px;padding:14px 12px;border:1px solid #e9e0d8;border-radius:10px;background:#fff;margin-bottom:12px}}.voice-card img{{width:38px;height:38px;border-radius:50%;object-fit:cover}}.voice-card .stars{{color:#c79e54;font-size:12px}}.voice-card p{{font-size:10px;line-height:1.65;margin:5px 0 0}}.voice-card small{{display:block;text-align:right;color:#756d77;font-size:8px}}.styles{{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}}.style img{{aspect-ratio:1/1.08;object-fit:cover;border-radius:8px}}.style p{{font-size:8px;text-align:center;line-height:1.5;margin:7px 0 0}}.prices{{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}}.price{{border:1px solid #ece4de;border-radius:7px;text-align:center;padding:12px 4px;background:#fff}}.price b{{display:block;font-size:9px;margin-bottom:5px}}.price strong{{display:block;font-family:Georgia,serif;font-size:14px;font-weight:500}}.price small,.price-note{{font-size:7px;color:#766d78}}.price-note{{text-align:center;margin:12px 0 0}}.final{{padding:30px 22px 36px;background:linear-gradient(135deg,#5a3e88 0%,#8468ad 100%);color:#fff;text-align:center}}.final h2{{margin-bottom:14px;font-size:17px}}.final .primary-cta{{background:#fff;color:var(--violet-dark);box-shadow:none}}.final p{{font-size:9px;opacity:.85}}footer{{padding:16px;text-align:center;background:#fff;color:#716a73;font-size:9px}}
.floating{{position:fixed;right:max(14px,calc((100vw - 480px)/2 + 14px));bottom:16px;z-index:20;width:104px;height:104px;border-radius:50%;background:rgba(102,76,147,.88);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:11px;line-height:1.35;box-shadow:0 10px 24px rgba(62,40,94,.25);transition:transform .18s ease}}.floating:hover,.floating:focus{{transform:scale(1.05)}}.floating .free{{position:absolute;right:-1px;top:-1px;background:#c95f67;color:#fff;font-weight:700;font-size:9px;border-radius:14px;padding:5px 7px}}
</style></head><body><main class="page">
<header><div class="brand"><strong>Violet</strong><small>HAIR SALON</small></div><div class="menu" aria-hidden="true"><i></i><i></i><i></i></div></header>
<section class="hero"><h1>あなたらしさが、<br>一番きれいに見える髪へ。</h1><p>Violetは、髪質・骨格・ライフスタイルまで<br>トータルで見極めるパーソナルサロンです。</p><div class="hero-photo"><img alt="Violet スタイルイメージ" src="{{assets['hero']}}"><div class="review-badge"><div>お客様の声より</div><div class="stars">★★★★★ <span style="color:#fff;font-size:11px">4.9</span></div><div>「仕上がりがとても可愛く<br>大満足です！」</div><div>20代後半・会社員</div></div></div><a class="primary-cta" href="{RECEPTION_PATH}">希望を整理する（無料・5問） ›</a><div class="hero-note">まずはあなたの理想を一緒に整理しましょう</div></section>
<section class="section"><h2>Violetが選ばれる理由</h2><div class="reasons"><div class="reason"><div class="ico">◯</div><b>パーソナル提案</b><span>髪質・骨格・ライフスタイル<br>から最適を設計</span></div><div class="reason"><div class="ico">✂</div><b>高い技術力</b><span>トレンド×似合わせで<br>理想をカタチに</span></div><div class="reason"><div class="ico">◇</div><b>上質な空間</b><span>落ち着いた空間で<br>特別な時間を</span></div></div></section>
<section class="section voices"><h2>お客様の声（実際の口コミ）</h2><div class="voice-card"><img alt="" src="{{assets['review1']}}"><div><div class="stars">★★★★★ 5</div><p>カラーとカットがとても丁寧で、<br>私の悩みや希望をしっかり聞いてくれました。<br>仕上がりも理想以上で、毎日が楽しくなりました！</p><small>20代後半・会社員</small></div></div><div class="voice-card"><img alt="" src="{{assets['review2']}}"><div><div class="stars">★★★★★ 5</div><p>駅近で通いやすく、デザインもたくさんあって<br>いつも迷ってしまうくらいです。<br>相談しやすくて安心してお任せできます。</p><small>30代前半・主婦</small></div></div></section>
<section class="section"><h2>人気スタイル（スタイルイメージ）</h2><div class="styles"><div class="style"><img src="{{assets['style1']}}" alt="透明感カラー × レイヤー"><p>透明感カラー<br>× レイヤー</p></div><div class="style"><img src="{{assets['style2']}}" alt="大人ショート × 丸みシルエット"><p>大人ショート<br>× 丸みシルエット</p></div><div class="style"><img src="{{assets['style3']}}" alt="くびれミディ × 顔まわりデザイン"><p>くびれミディ<br>× 顔まわりデザイン</p></div><div class="style"><img src="{{assets['style4']}}" alt="ナチュラルウェーブ × 抜け感"><p>ナチュラルウェーブ<br>× 抜け感</p></div></div></section>
<section class="section" style="padding-top:18px"><h2>料金の目安</h2><div class="prices"><div class="price"><b>カット</b><strong>¥5,500〜</strong><small>（税込）</small></div><div class="price"><b>カラー</b><strong>¥7,700〜</strong><small>（税込）</small></div><div class="price"><b>カット＋カラー</b><strong>¥12,100〜</strong><small>（税込）</small></div><div class="price"><b>トリートメント</b><strong>¥4,400〜</strong><small>（税込）</small></div></div><p class="price-note">※メニュー・料金は一例です。ご希望に合わせてご提案します。</p></section>
<section class="final"><h2>まずは、あなたの希望を整理しませんか？</h2><a class="primary-cta" href="{RECEPTION_PATH}">希望を整理する（無料・5問） ›</a><p>5問で完了・無理な営業は一切ありません</p></section><footer>Powered by Path-Flow</footer></main><a class="floating" href="{RECEPTION_PATH}"><span class="free">無料</span><strong>希望を整理する</strong><span>（無料・5問）</span></a></body></html>'''


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: build_violet_approved_lp.py APPROVED_BOARD.png")
    board = Path(sys.argv[1])
    if not board.exists():
        raise SystemExit(f"approved board not found: {board}")
    image = Image.open(board)
    if image.size != (1024, 1536):
        raise SystemExit(f"unexpected approved board size: {image.size}; expected (1024, 1536)")
    assets = {name: jpeg_data_uri(image, box) for name, box in CROPS.items()}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(render(assets), encoding="utf-8")
    print(f"built: {OUTPUT}")


if __name__ == "__main__":
    main()
