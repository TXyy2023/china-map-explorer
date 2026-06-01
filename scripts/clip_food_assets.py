from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps


def build_mask(contour: Image.Image) -> Image.Image:
    rgba = contour.convert("RGBA")
    bg = rgba.getpixel((0, 0))[:3]
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


def zoom_center(image: Image.Image, factor: float = 1.12) -> Image.Image:
    rgba = image.convert("RGBA")
    if factor <= 1:
        return rgba
    crop_w = int(rgba.width / factor)
    crop_h = int(rgba.height / factor)
    left = max(0, (rgba.width - crop_w) // 2)
    top = max(0, (rgba.height - crop_h) // 2)
    return rgba.crop((left, top, left + crop_w, top + crop_h))


def cover_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(zoom_center(image), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def build_content_mask(source: Image.Image) -> Image.Image:
    rgba = source.convert("RGBA")
    bg = rgba.getpixel((0, 0))[:3]
    mask = Image.new("L", rgba.size, 0)
    pix = rgba.load()
    out = mask.load()

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pix[x, y]
            distance = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            is_plain_light_bg = r > 218 and g > 210 and b > 196 and max(r, g, b) - min(r, g, b) < 34
            if a > 0 and distance > 46 and not is_plain_light_bg:
                out[x, y] = 255

    return mask.filter(ImageFilter.MedianFilter(3))


def trim_background(image: Image.Image, padding_ratio: float = 0.02) -> Image.Image:
    rgba = image.convert("RGBA")
    bg = rgba.getpixel((0, 0))[:3]
    rgb = rgba.convert("RGB")
    mask = Image.new("L", rgba.size, 0)
    src = rgb.load()
    dst = mask.load()

    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b = src[x, y]
            distance = abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2])
            if distance > 36:
                dst[x, y] = 255

    bbox = mask.filter(ImageFilter.MaxFilter(15)).getbbox()
    if not bbox:
        return rgba

    pad = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * padding_ratio)
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(rgba.width, bbox[2] + pad)
    bottom = min(rgba.height, bbox[3] + pad)
    return rgba.crop((left, top, right, bottom))


def render(source_path: Path, contour_path: Path, out_path: Path) -> None:
    contour = Image.open(contour_path)
    source = cover_resize(trim_background(Image.open(source_path)), contour.size)
    mask = build_mask(contour)
    content_mask = ImageChops.multiply(mask, build_content_mask(source))

    clipped = Image.new("RGBA", contour.size, (0, 0, 0, 0))
    clipped.paste(source, (0, 0), content_mask)

    fill_alpha = content_mask.filter(ImageFilter.MaxFilter(101)).filter(ImageFilter.GaussianBlur(16))
    fill_alpha = ImageChops.multiply(fill_alpha, mask)
    soft_fill = clipped.filter(ImageFilter.GaussianBlur(18))
    soft_fill.putalpha(fill_alpha)

    edge = mask.filter(ImageFilter.MaxFilter(7))
    inner = mask.filter(ImageFilter.MinFilter(3))
    stroke_mask = ImageChops.subtract(edge, inner).filter(ImageFilter.GaussianBlur(0.35))

    shadow = Image.new("RGBA", contour.size, (0, 0, 0, 0))
    shadow_alpha = mask.filter(ImageFilter.GaussianBlur(7)).point(lambda value: int(value * 0.28))
    shadow.paste((5, 18, 13, 180), (0, 0), shadow_alpha)

    stroke = Image.new("RGBA", contour.size, (0, 0, 0, 0))
    stroke.paste((28, 70, 48, 255), (0, 0), stroke_mask)

    result = Image.alpha_composite(shadow, soft_fill)
    result = Image.alpha_composite(result, clipped)
    result = Image.alpha_composite(result, stroke)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(out_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--contour", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    render(args.source, args.contour, args.out)


if __name__ == "__main__":
    main()
