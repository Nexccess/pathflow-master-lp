from __future__ import annotations

"""Production-safe wrapper for the Violet Approved Creative builder.

It reuses the deterministic crop map and approved layout from
build_violet_approved_lp.py, then resolves the asset placeholders into
embedded data URIs before writing generated/9/index.html.
"""

import sys
from pathlib import Path

from PIL import Image

from build_violet_approved_lp import CROPS, OUTPUT, jpeg_data_uri, render


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: finalize_violet_approved_lp.py APPROVED_BOARD.png")

    board = Path(sys.argv[1])
    if not board.exists():
        raise SystemExit(f"approved board not found: {board}")

    image = Image.open(board)
    if image.size != (1024, 1536):
        raise SystemExit(f"unexpected approved board size: {image.size}; expected (1024, 1536)")

    assets = {name: jpeg_data_uri(image, box) for name, box in CROPS.items()}
    html = render(assets)
    for name, uri in assets.items():
        html = html.replace("{assets['" + name + "']}", uri)

    unresolved = [name for name in assets if "{assets['" + name + "']}" in html]
    if unresolved:
        raise SystemExit(f"unresolved approved assets: {unresolved}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(html, encoding="utf-8")
    print(f"built approved Violet LP: {OUTPUT}")


if __name__ == "__main__":
    main()
