"""
Parametric sewing pattern generator.
Uses svgwrite for 2D panel rendering and cairosvg for PDF export.
All measurements in cm; SVG uses 1px = 1mm (so multiply cm by 10).
"""

import math
import os
import uuid

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
GENERATED_DIR = os.path.join(UPLOADS_DIR, "generated")

MM = 10  # 1 cm = 10 px (1px = 1mm)
SEAM_ALLOWANCE = 10  # 10mm seam allowance
PADDING = 20  # internal SVG padding in px


def _ensure_dir():
    os.makedirs(GENERATED_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Skirt
# ---------------------------------------------------------------------------


def generate_skirt(measurements: dict, style_params: dict) -> dict:
    """
    Generate a skirt pattern.

    measurements: { waist, hips }  (cm)
    style_params: { length, flare, num_panels, waistband_width }
                  flare: 0=straight, 1=full circle

    Returns:
        {
          "pdf_url": "/uploads/generated/xxx_pattern.pdf",
          "panel_svgs": ["/uploads/generated/xxx_panel0.svg", ...]
        }
    """
    _ensure_dir()
    uid = uuid.uuid4().hex[:12]

    waist = float(measurements.get("waist", 70))
    hips = float(measurements.get("hips", 92))
    length = float(style_params.get("length", 60))
    flare = float(style_params.get("flare", 0.3))
    num_panels = int(style_params.get("num_panels", 4))
    waistband_width = float(style_params.get("waistband_width", 4))

    # Panel geometry (cm → mm for SVG)
    top_circ = waist + 2  # tiny ease
    hem_circ = top_circ + flare * (2 * math.pi * length)
    top_w = (top_circ / num_panels) * MM
    hem_w = (hem_circ / num_panels) * MM
    h = length * MM
    wb_h = waistband_width * MM

    panel_svgs = []

    # Skirt panels
    for i in range(num_panels):
        label = _panel_label(i, num_panels)
        path = _make_trapezoid_svg(
            uid=uid,
            index=i,
            label=f"Skirt {label}",
            top_w=top_w,
            bottom_w=hem_w,
            height=h,
            note=f"Cut {num_panels}  •  Seam allowance included",
        )
        panel_svgs.append(path)

    # Waistband (rectangle: waist circumference × waistband_width × 2 layers)
    wb_path = _make_rectangle_svg(
        uid=uid,
        index=num_panels,
        label="Waistband",
        width=(top_circ * MM),
        height=(wb_h * 2),
        note="Cut 1 on fold  •  Seam allowance included",
    )
    panel_svgs.append(wb_path)

    # Combined PDF
    pdf_path = _panels_to_pdf(uid, panel_svgs)

    return {
        "pdf_url": "/uploads/" + os.path.relpath(pdf_path, start=UPLOADS_DIR),
        "panel_svgs": [
            "/uploads/" + os.path.relpath(p, start=UPLOADS_DIR) for p in panel_svgs
        ],
        "title": f"Skirt — {num_panels} panels, {length}cm",
    }


def _panel_label(i: int, total: int) -> str:
    names = [
        "Front",
        "Back",
        "Side Left",
        "Side Right",
        "Front Left",
        "Front Right",
        "Back Left",
        "Back Right",
    ]
    if i < len(names):
        return names[i]
    return f"Panel {i + 1}"


def _make_trapezoid_svg(uid, index, label, top_w, bottom_w, height, note=""):
    """Draw a trapezoid panel (wider at hem) with seam allowance lines."""
    import svgwrite  # type: ignore[import-untyped]  # noqa: PLC0415

    sa = SEAM_ALLOWANCE
    pad = PADDING

    # Outer dimensions including seam allowance
    max_w = max(top_w, bottom_w) + 2 * sa
    total_h = height + 2 * sa

    canvas_w = max_w + 2 * pad
    canvas_h = total_h + 2 * pad

    dwg = svgwrite.Drawing(size=(f"{canvas_w}px", f"{canvas_h}px"))
    dwg.add(dwg.rect((0, 0), (canvas_w, canvas_h), fill="white"))

    ox = pad  # origin x
    oy = pad  # origin y

    # --- Seam allowance outline (dashed) ---
    # top-left, top-right, bottom-right, bottom-left of outer trapezoid
    tl_sa = (ox + (max_w - top_w) / 2 - sa + sa, oy)
    tr_sa = (ox + (max_w + top_w) / 2 + sa - sa, oy)
    br_sa = (ox + max_w, oy + total_h)
    bl_sa = (ox, oy + total_h)

    outer_points = [
        (ox + (max_w - top_w) / 2, oy),
        (ox + (max_w + top_w) / 2, oy),
        (ox + max_w, oy + total_h),
        (ox, oy + total_h),
    ]
    dwg.add(
        dwg.polygon(
            outer_points,
            fill="none",
            stroke="#aaa",
            stroke_width=1,
            stroke_dasharray="5,3",
        )
    )

    # --- Cut line (solid) ---
    inner_points = [
        (ox + (max_w - top_w) / 2 + sa, oy + sa),
        (ox + (max_w + top_w) / 2 - sa, oy + sa),
        (ox + max_w - sa, oy + total_h - sa),
        (ox + sa, oy + total_h - sa),
    ]
    dwg.add(dwg.polygon(inner_points, fill="#f0f4ff", stroke="#333", stroke_width=1.5))

    # --- Grain line (vertical, centered) ---
    cx = ox + max_w / 2
    grain_top = oy + sa + 10
    grain_bot = oy + total_h - sa - 10
    dwg.add(dwg.line((cx, grain_top), (cx, grain_bot), stroke="#333", stroke_width=1))
    dwg.add(
        dwg.polygon(  # arrowhead top
            [(cx, grain_top), (cx - 4, grain_top + 8), (cx + 4, grain_top + 8)],
            fill="#333",
        )
    )
    dwg.add(
        dwg.polygon(  # arrowhead bottom
            [(cx, grain_bot), (cx - 4, grain_bot - 8), (cx + 4, grain_bot - 8)],
            fill="#333",
        )
    )

    # --- Labels ---
    text_y = oy + sa + height / 2
    dwg.add(
        dwg.text(
            label,
            insert=(cx, text_y - 10),
            text_anchor="middle",
            font_size="14px",
            font_family="sans-serif",
            font_weight="bold",
            fill="#222",
        )
    )
    if note:
        dwg.add(
            dwg.text(
                note,
                insert=(cx, text_y + 10),
                text_anchor="middle",
                font_size="10px",
                font_family="sans-serif",
                fill="#666",
            )
        )

    # --- Dimension annotations ---
    dwg.add(
        dwg.text(
            f"Top: {top_w / MM:.1f}cm",
            insert=(cx, oy + sa - 4),
            text_anchor="middle",
            font_size="9px",
            font_family="sans-serif",
            fill="#888",
        )
    )
    dwg.add(
        dwg.text(
            f"Hem: {bottom_w / MM:.1f}cm",
            insert=(cx, oy + total_h + 12),
            text_anchor="middle",
            font_size="9px",
            font_family="sans-serif",
            fill="#888",
        )
    )
    dwg.add(
        dwg.text(
            f"Length: {height / MM:.1f}cm",
            insert=(ox - 4, oy + total_h / 2),
            text_anchor="end",
            font_size="9px",
            font_family="sans-serif",
            fill="#888",
        )
    )

    path = os.path.join(GENERATED_DIR, f"{uid}_panel{index}.svg")
    dwg.saveas(path)
    return path


def _make_rectangle_svg(uid, index, label, width, height, note=""):
    """Draw a rectangular panel (waistband, facings, etc.)."""
    import svgwrite  # type: ignore[import-untyped]  # noqa: PLC0415

    sa = SEAM_ALLOWANCE
    pad = PADDING

    total_w = width + 2 * sa
    total_h = height + 2 * sa
    canvas_w = total_w + 2 * pad
    canvas_h = total_h + 2 * pad

    dwg = svgwrite.Drawing(size=(f"{canvas_w}px", f"{canvas_h}px"))
    dwg.add(dwg.rect((0, 0), (canvas_w, canvas_h), fill="white"))

    ox, oy = pad, pad

    # Outer seam allowance (dashed)
    dwg.add(
        dwg.rect(
            (ox, oy),
            (total_w, total_h),
            fill="none",
            stroke="#aaa",
            stroke_width=1,
            stroke_dasharray="5,3",
        )
    )

    # Cut line (solid)
    dwg.add(
        dwg.rect(
            (ox + sa, oy + sa),
            (width, height),
            fill="#f0f4ff",
            stroke="#333",
            stroke_width=1.5,
        )
    )

    # Fold line (center horizontal)
    fold_y = oy + sa + height / 2
    dwg.add(
        dwg.line(
            (ox + sa, fold_y),
            (ox + sa + width, fold_y),
            stroke="#888",
            stroke_width=1,
            stroke_dasharray="8,4",
        )
    )
    dwg.add(
        dwg.text(
            "FOLD",
            insert=(ox + sa + width / 2, fold_y - 4),
            text_anchor="middle",
            font_size="9px",
            font_family="sans-serif",
            fill="#888",
        )
    )

    cx = ox + sa + width / 2
    cy = oy + sa + height / 2
    dwg.add(
        dwg.text(
            label,
            insert=(cx, cy - 8),
            text_anchor="middle",
            font_size="14px",
            font_family="sans-serif",
            font_weight="bold",
            fill="#222",
        )
    )
    if note:
        dwg.add(
            dwg.text(
                note,
                insert=(cx, cy + 10),
                text_anchor="middle",
                font_size="10px",
                font_family="sans-serif",
                fill="#666",
            )
        )

    path = os.path.join(GENERATED_DIR, f"{uid}_panel{index}.svg")
    dwg.saveas(path)
    return path


def _panels_to_pdf(uid: str, svg_paths: list[str]) -> str:
    """Combine all panel SVGs into a single tiled PDF (2 columns)."""
    import base64
    import re
    import cairosvg  # type: ignore[import-untyped]  # noqa: PLC0415
    import svgwrite  # type: ignore[import-untyped]  # noqa: PLC0415

    # Convert each SVG to PNG and encode as base64 data URI
    panels = []
    for p in svg_paths:
        with open(p) as f:
            content = f.read()
        w_match = re.search(r'width="([\d.]+)', content)
        h_match = re.search(r'height="([\d.]+)', content)
        if not w_match or not h_match:
            raise ValueError(f"Could not parse dimensions from SVG: {p}")
        w = float(w_match.group(1))
        h = float(h_match.group(1))
        png_bytes = cairosvg.svg2png(url=p)
        data_uri = "data:image/png;base64," + base64.b64encode(png_bytes).decode()
        panels.append((data_uri, w, h))

    cols = 2
    rows = math.ceil(len(panels) / cols)
    gap = 30

    col_widths = [0.0] * cols
    row_heights = [0.0] * rows
    for idx, (_, w, h) in enumerate(panels):
        c, r = idx % cols, idx // cols
        col_widths[c] = max(col_widths[c], w)
        row_heights[r] = max(row_heights[r], h)

    total_w = sum(col_widths) + gap * (cols + 1)
    total_h = sum(row_heights) + gap * (rows + 1)

    # Build composite SVG with embedded PNG images
    composite = svgwrite.Drawing(
        size=(f"{total_w}px", f"{total_h}px"),
        viewBox=f"0 0 {total_w} {total_h}",
    )
    composite.add(composite.rect((0, 0), (total_w, total_h), fill="white"))

    y_cursor = gap
    for r in range(rows):
        x_cursor = gap
        for c in range(cols):
            idx = r * cols + c
            if idx >= len(panels):
                break
            data_uri, pw, ph = panels[idx]
            composite.add(
                composite.image(
                    href=data_uri,
                    insert=(x_cursor, y_cursor),
                    size=(pw, ph),
                )
            )
            x_cursor += col_widths[c] + gap
        y_cursor += row_heights[r] + gap

    composite_svg = composite.tostring()

    pdf_path = os.path.join(GENERATED_DIR, f"{uid}_pattern.pdf")
    cairosvg.svg2pdf(bytestring=composite_svg.encode(), write_to=pdf_path)

    for p in svg_paths:
        try:
            os.remove(p)
        except OSError:
            pass

    return pdf_path
