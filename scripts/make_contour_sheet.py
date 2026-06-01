from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--names", required=True, help="Comma-separated contour stems")
    parser.add_argument("--cols", required=True, type=int)
    parser.add_argument("--rows", required=True, type=int)
    parser.add_argument("--contour-dir", default=Path("public/assets/food"), type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()

    names = [name.strip() for name in args.names.split(",") if name.strip()]
    cell_w, cell_h = 800, 600
    sheet = Image.new("RGB", (args.cols * cell_w, args.rows * cell_h), "#f6f1e8")
    draw = ImageDraw.Draw(sheet)

    for index, name in enumerate(names):
        col = index % args.cols
        row = index // args.cols
        contour_path = args.contour_dir / f"{name}_contour.png"
        contour = Image.open(contour_path).convert("RGB")
        contour = ImageOps.contain(contour, (cell_w - 72, cell_h - 96), method=Image.Resampling.LANCZOS)
        x = col * cell_w + (cell_w - contour.width) // 2
        y = row * cell_h + (cell_h - contour.height) // 2 + 12
        sheet.paste(contour, (x, y))
        draw.text((col * cell_w + 28, row * cell_h + 24), name, fill="#1b4332")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(args.out)


if __name__ == "__main__":
    main()
