from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps


def build_mask(contour: Image.Image) -> Image.Image:
    rgba = contour.convert("RGBA")
    corners = [
        rgba.getpixel((0, 0))[:3],
        rgba.getpixel((rgba.width - 1, 0))[:3],
        rgba.getpixel((0, rgba.height - 1))[:3],
        rgba.getpixel((rgba.width - 1, rgba.height - 1))[:3],
    ]
    bg = tuple(sorted(channel)[len(channel) // 2] for channel in zip(*corners))
    rgb = rgba.convert("RGB")
    mask = Image.new("L", rgba.size, 0)
    pix = rgb.load()
    out = mask.load()

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b = pix[x, y]
            distance = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            green_bias = g - max(r, b)
            if distance > 10 or green_bias > 5:
                out[x, y] = 255

    mask = mask.filter(ImageFilter.MedianFilter(3))
    mask = mask.filter(ImageFilter.GaussianBlur(0.35))
    return mask.point(lambda value: 255 if value > 24 else 0)


def cover_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image.convert("RGBA"), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def render(source_path: Path, contour_path: Path, out_path: Path) -> None:
    contour = Image.open(contour_path)
    source = cover_resize(Image.open(source_path), contour.size)
    mask = build_mask(contour)

    clipped = source.copy()
    clipped.putalpha(ImageChops.multiply(source.getchannel("A"), mask))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    clipped.save(out_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--contour", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    render(args.source, args.contour, args.out)


if __name__ == "__main__":
    main()
