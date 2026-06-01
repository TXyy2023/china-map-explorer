from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

from clip_food_assets import render


def split_sheet(sheet_path: Path, cols: int, rows: int, names: list[str], out_dir: Path) -> list[Path]:
    sheet = Image.open(sheet_path).convert("RGBA")
    cell_w = sheet.width // cols
    cell_h = sheet.height // rows
    out_dir.mkdir(parents=True, exist_ok=True)
    sources: list[Path] = []

    for index, name in enumerate(names):
        col = index % cols
        row = index // cols
        crop = sheet.crop((col * cell_w, row * cell_h, (col + 1) * cell_w, (row + 1) * cell_h))
        out_path = out_dir / f"{name}-food-ai-source.png"
        crop.save(out_path)
        sources.append(out_path)

    return sources


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet", required=True, type=Path)
    parser.add_argument("--cols", required=True, type=int)
    parser.add_argument("--rows", required=True, type=int)
    parser.add_argument("--names", required=True, help="Comma-separated output stems, in grid order")
    parser.add_argument("--source-dir", default=Path("public/assets/food/generated-sources"), type=Path)
    parser.add_argument("--contour-dir", default=Path("public/assets/food"), type=Path)
    parser.add_argument("--out-dir", default=Path("public/assets/food"), type=Path)
    args = parser.parse_args()

    names = [name.strip() for name in args.names.split(",") if name.strip()]
    if len(names) > args.cols * args.rows:
        raise ValueError("More names than grid cells")

    sources = split_sheet(args.sheet, args.cols, args.rows, names, args.source_dir)
    for name, source in zip(names, sources):
        render(
            source,
            args.contour_dir / f"{name}_contour.png",
            args.out_dir / f"{name}-food-ai.png",
        )


if __name__ == "__main__":
    main()
