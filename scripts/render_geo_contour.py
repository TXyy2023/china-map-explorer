from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw


def iter_rings(geometry: dict):
    kind = geometry.get("type")
    coords = geometry.get("coordinates") or []
    if kind == "Polygon":
        for polygon in [coords]:
            yield polygon
    elif kind == "MultiPolygon":
        for polygon in coords:
            yield polygon


def collect_points(features: list[dict]) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for feature in features:
        for polygon in iter_rings(feature.get("geometry") or {}):
            for ring in polygon:
                points.extend((float(x), float(y)) for x, y in ring)
    return points


def build_projector(points: list[tuple[float, float]], width: int, height: int, padding: int):
    min_x = min(x for x, _ in points)
    max_x = max(x for x, _ in points)
    min_y = min(y for _, y in points)
    max_y = max(y for _, y in points)
    scale = min((width - padding * 2) / (max_x - min_x), (height - padding * 2) / (max_y - min_y))
    offset_x = (width - (max_x - min_x) * scale) / 2 - min_x * scale
    offset_y = (height + (max_y - min_y) * scale) / 2 + min_y * scale

    def project(point: tuple[float, float]) -> tuple[float, float]:
        x, y = point
        return x * scale + offset_x, -y * scale + offset_y

    return project


def render_contour(
    geo_path: Path,
    out_path: Path,
    width: int,
    height: int,
    padding: int,
    adcodes: set[str] | None = None,
) -> None:
    payload = json.loads(geo_path.read_text(encoding="utf-8"))
    features = [
        feature for feature in payload.get("features", [])
        if feature.get("properties", {}).get("name") and feature.get("properties", {}).get("adcode")
    ]
    if adcodes:
        features = [
            feature for feature in features
            if str(feature.get("properties", {}).get("adcode")) in adcodes
        ]
    points = collect_points(features)
    if not points:
        raise ValueError(f"No geography points found for {sorted(adcodes) if adcodes else 'all features'}")
    project = build_projector(points, width, height, padding)

    image = Image.new("RGB", (width, height), (248, 252, 249))
    draw = ImageDraw.Draw(image)
    fill = (205, 243, 218)
    stroke = (58, 154, 91)

    for feature in features:
        for polygon in iter_rings(feature.get("geometry") or {}):
            if not polygon:
                continue
            exterior = [project((float(x), float(y))) for x, y in polygon[0]]
            draw.polygon(exterior, fill=fill)
            for hole in polygon[1:]:
                draw.polygon([project((float(x), float(y))) for x, y in hole], fill=(248, 252, 249))

    for feature in features:
        for polygon in iter_rings(feature.get("geometry") or {}):
            for ring in polygon:
                projected = [project((float(x), float(y))) for x, y in ring]
                if len(projected) > 1:
                    draw.line(projected, fill=stroke, width=2, joint="curve")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(out_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--geo", default=Path("public/geo/china.json"), type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--width", default=800, type=int)
    parser.add_argument("--height", default=600, type=int)
    parser.add_argument("--padding", default=38, type=int)
    parser.add_argument("--adcodes", default="", help="Comma-separated adcodes to render")
    args = parser.parse_args()
    adcodes = {item.strip() for item in args.adcodes.split(",") if item.strip()} or None
    render_contour(args.geo, args.out, args.width, args.height, args.padding, adcodes)


if __name__ == "__main__":
    main()
