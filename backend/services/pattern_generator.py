"""Skirt pattern generator — produces a printable PDF via reportlab."""

import math
import os
import uuid

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
GENERATED_DIR = os.path.join(UPLOADS_DIR, "generated")

SA = 1.5  # seam allowance (cm)
HA = 3.0  # hem allowance (cm)
MARGIN = 1.5  # page margin (cm)
TITLE_H = 2.8  # space reserved at top for title block (cm)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def generate_skirt(measurements: dict, style_params: dict) -> dict:
    waist = float(measurements.get("waist") or 70)
    hips = float(measurements.get("hips") or 92)
    length = float(style_params.get("length") or 60)
    flare = float(style_params.get("flare") or 0.3)
    num_panels = int(style_params.get("num_panels") or 4)
    wb_width = float(style_params.get("waistband_width") or 4)

    # --- Panel geometry ---
    waist_pp = waist / num_panels          # waist per panel (finished)
    hips_pp = hips / num_panels            # hips per panel (finished)

    # Circle-skirt hem width per panel at this length
    r_inner = waist / (2 * math.pi)
    circle_hem_pp = 2 * math.pi * (r_inner + length) / num_panels

    # Interpolate: flare=0 → hip-width hem, flare=1 → circle hem
    hem_pp = hips_pp + flare * (circle_hem_pp - hips_pp)

    # Cut dimensions (seam/hem allowances added)
    panel_top = waist_pp + 2 * SA
    panel_bot = hem_pp + 2 * SA
    panel_h = length + SA + HA

    # Waistband: folded in half, extra 3 cm for overlap/button band
    wb_cut_w = waist + 2 * SA + 3.0
    wb_cut_h = wb_width * 2 + 2 * SA

    # --- Build PDF ---
    os.makedirs(GENERATED_DIR, exist_ok=True)
    fname = f"skirt_{uuid.uuid4().hex[:8]}.pdf"
    fpath = os.path.join(GENERATED_DIR, fname)

    c = canvas.Canvas(fpath, pagesize=A4)

    _page_panel(c, panel_top, panel_bot, panel_h, waist_pp, hem_pp, length, num_panels)
    c.showPage()
    _page_waistband(c, wb_cut_w, wb_cut_h, wb_width)
    c.save()

    style_label = (
        "Straight" if flare < 0.15 else
        "A-line" if flare < 0.45 else
        "Full" if flare < 0.75 else
        "Circle"
    )
    title = f"{style_label} skirt — {num_panels} panels"
    return {"title": title, "pdf_url": f"/uploads/generated/{fname}"}


# ---------------------------------------------------------------------------
# Page renderers
# ---------------------------------------------------------------------------

def _page_panel(c, cut_top, cut_bot, cut_h, fin_top, fin_bot, fin_h, num_panels):
    PW, PH = A4
    mg = MARGIN * cm
    title_h = TITLE_H * cm

    # Available drawing area (below title block)
    avail_w = PW - 2 * mg
    avail_h = PH - 2 * mg - title_h

    # Scale so piece fits
    scale = min(avail_w / (cut_bot * cm), avail_h / (cut_h * cm), 1.0)

    pw = cut_bot * cm * scale   # piece width in pts
    ph = cut_h * cm * scale     # piece height in pts

    # Origin: horizontally centred, placed above bottom margin
    ox = mg + (avail_w - pw) / 2
    oy = mg

    # --- Title block ---
    _title_block(c, PW, PH, mg,
                 "SKIRT PANEL",
                 f"Cut × {num_panels}  |  SA {SA} cm included on all sides  |  Hem allowance {HA} cm included")

    # --- Panel trapezoid (cut line) ---
    # Bottom edge is wider (hem).  Top edge is narrower (waist).
    # Centred horizontally: left offset of top edge relative to bottom-left = dx
    dx = (cut_bot - cut_top) / 2  # cm

    def p(x_cm, y_cm):
        return ox + x_cm * cm * scale, oy + y_cm * cm * scale

    bl, br = p(0, 0), p(cut_bot, 0)
    tl, tr = p(dx, cut_h), p(dx + cut_top, cut_h)

    c.setStrokeColor(colors.black)
    c.setLineWidth(1.2)
    path = c.beginPath()
    path.moveTo(*bl); path.lineTo(*br)
    path.lineTo(*tr); path.lineTo(*tl)
    path.close()
    c.drawPath(path)

    # --- Seam / hem stitch lines (dashed) ---
    # Side seam lines (SA inset horizontally — good enough approximation)
    c.setDash(4, 3)
    c.setLineWidth(0.6)
    c.setStrokeColor(colors.Color(0.35, 0.35, 0.35))

    # waist seam line
    wl = p(dx + SA, cut_h - SA)
    wr = p(dx + cut_top - SA, cut_h - SA)
    c.line(*wl, *wr)

    # hem fold line
    hl = p(SA, HA)
    hr = p(cut_bot - SA, HA)
    c.line(*hl, *hr)

    # side seam lines connecting hem to waist
    c.line(*hl, *wl)
    c.line(*hr, *wr)

    c.setDash()
    c.setStrokeColor(colors.black)

    # --- Grain line (centred, vertical) ---
    gx = cut_bot / 2
    g1 = p(gx, cut_h * 0.18)
    g2 = p(gx, cut_h * 0.82)
    c.setLineWidth(0.8)
    c.line(*g1, *g2)
    arr = 0.22 * cm * scale
    for tip, direction in ((g2, -1), (g1, 1)):
        tx, ty = tip
        c.line(tx, ty, tx - arr * 0.5, ty + direction * arr * 1.8)
        c.line(tx, ty, tx + arr * 0.5, ty + direction * arr * 1.8)

    # --- Text labels ---
    c.setFillColor(colors.black)

    # "GRAIN" text
    c.setFont("Helvetica", 7)
    gx_pts, _ = p(gx, cut_h / 2)
    c.drawCentredString(gx_pts, p(gx, cut_h / 2)[1], "GRAIN")

    # Waist edge label (above piece)
    c.setFont("Helvetica", 8)
    c.drawCentredString(*p(dx + cut_top / 2, cut_h + 0.35),
                        f"WAIST  {fin_top:.1f} cm")

    # Hem edge label (below piece)
    c.drawCentredString(*p(cut_bot / 2, -0.5),
                        f"HEM  {fin_bot:.1f} cm")

    # Side label
    c.setFont("Helvetica", 7)
    sx, sy = p(-0.15, cut_h / 2)
    c.saveState()
    c.translate(sx, sy)
    c.rotate(90)
    c.drawCentredString(0, 0, "SIDE SEAM")
    c.restoreState()

    # --- Info box (right of piece if room, else bottom-right) ---
    info_x = ox + pw + 0.6 * cm
    if info_x + 4 * cm < PW - mg:
        info_y = oy + ph
        for line in [
            f"Length: {fin_h:.0f} cm",
            f"Waist/panel: {fin_top:.1f} cm",
            f"Hem/panel:  {fin_bot:.1f} cm",
            "",
            f"Seam allowance: {SA} cm",
            f"Hem allowance: {HA} cm",
        ]:
            info_y -= 0.45 * cm
            c.setFont("Helvetica", 8)
            c.drawString(info_x, info_y, line)

    # --- Scale bar ---
    _scale_bar(c, scale, mg, mg / 2)


def _page_waistband(c, cut_w, cut_h, fin_h):
    PW, PH = A4
    mg = MARGIN * cm
    title_h = TITLE_H * cm

    avail_w = PW - 2 * mg
    avail_h = PH - 2 * mg - title_h

    scale = min(avail_w / (cut_w * cm), avail_h / (cut_h * cm), 1.0)
    pw = cut_w * cm * scale
    ph = cut_h * cm * scale

    ox = mg + (avail_w - pw) / 2
    oy = mg + (avail_h - ph) / 2

    _title_block(c, PW, PH, mg,
                 "WAISTBAND",
                 f"Cut × 1  |  Fold along centre line  |  SA {SA} cm included")

    # Outer rectangle (cut line)
    c.setStrokeColor(colors.black)
    c.setLineWidth(1.2)
    c.rect(ox, oy, pw, ph)

    # Fold line (centre)
    fold_y = oy + ph / 2
    c.setDash(6, 3)
    c.setLineWidth(0.6)
    c.setStrokeColor(colors.Color(0.35, 0.35, 0.35))
    c.line(ox, fold_y, ox + pw, fold_y)
    c.setDash()

    # Seam lines (SA inset)
    c.setDash(4, 3)
    sa_pts = SA * cm * scale
    c.line(ox + sa_pts, oy, ox + sa_pts, oy + ph)
    c.line(ox + pw - sa_pts, oy, ox + pw - sa_pts, oy + ph)
    c.line(ox, oy + sa_pts, ox + pw, oy + sa_pts)
    c.line(ox, oy + ph - sa_pts, ox + pw, oy + ph - sa_pts)
    c.setDash()
    c.setStrokeColor(colors.black)

    # Labels
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.black)
    c.drawCentredString(ox + pw / 2, fold_y + 0.22 * cm, "FOLD")
    c.drawCentredString(ox + pw / 2, oy + ph + 0.35 * cm,
                        f"Cut: {cut_w:.1f} cm × {cut_h:.1f} cm")
    c.drawCentredString(ox + pw / 2, oy - 0.45 * cm,
                        f"Finished waistband width: {fin_h:.1f} cm")

    _scale_bar(c, scale, mg, oy - 1.2 * cm)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _title_block(c, PW, PH, mg, title, subtitle):
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(colors.black)
    c.drawString(mg, PH - mg - 13, title)
    c.setFont("Helvetica", 9)
    c.drawString(mg, PH - mg - 26, subtitle)
    # Thin rule below title block
    c.setStrokeColor(colors.Color(0.7, 0.7, 0.7))
    c.setLineWidth(0.5)
    c.line(mg, PH - mg - TITLE_H * cm, PW - mg, PH - mg - TITLE_H * cm)
    c.setStrokeColor(colors.black)


def _scale_bar(c, scale, x, y):
    """Draw a 10 cm reference bar."""
    bar = 10 * cm * scale
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.6)
    c.line(x, y, x + bar, y)
    for tick_x in (x, x + bar / 2, x + bar):
        c.line(tick_x, y - 2, tick_x, y + 2)
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.black)
    c.drawCentredString(x + bar / 2, y - 11, "10 cm (reference)")
    if scale < 0.99:
        pct = round(100 / scale)
        c.setFont("Helvetica-Oblique", 7)
        c.drawCentredString(x + bar / 2, y - 21, f"Print at {pct}% for full size")


# ---------------------------------------------------------------------------
# AI spec renderer
# ---------------------------------------------------------------------------

def generate_from_spec(spec: dict) -> dict:
    """Render a Haiku-generated pattern spec into a PDF."""
    os.makedirs(GENERATED_DIR, exist_ok=True)
    fname = f"ai_pattern_{uuid.uuid4().hex[:8]}.pdf"
    fpath = os.path.join(GENERATED_DIR, fname)

    title = spec.get("title", "Pattern")
    instructions = spec.get("instructions", [])
    pieces = spec.get("pieces", [])

    c = canvas.Canvas(fpath, pagesize=A4)

    # Cover page
    _spec_cover_page(c, title, instructions)

    # One page per piece
    for piece in pieces:
        c.showPage()
        _spec_piece_page(c, piece)

    c.save()
    return {"title": title, "pdf_url": f"/uploads/generated/{fname}"}


def _spec_cover_page(c, title, instructions):
    PW, PH = A4
    mg = MARGIN * cm

    # Title
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.black)
    c.drawString(mg, PH - mg - 20, title)

    # Rule
    c.setStrokeColor(colors.Color(0.7, 0.7, 0.7))
    c.setLineWidth(0.5)
    c.line(mg, PH - mg - 32, PW - mg, PH - mg - 32)

    if instructions:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.black)
        c.drawString(mg, PH - mg - 50, "Sewing Instructions")
        y = PH - mg - 68
        for i, step in enumerate(instructions, 1):
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(colors.black)
            c.drawString(mg, y, f"{i}.")
            c.setFont("Helvetica", 9)
            # Wrap long lines
            words = step.split()
            line, lines = [], []
            for w in words:
                test = " ".join(line + [w])
                if c.stringWidth(test, "Helvetica", 9) > PW - 2 * mg - 18:
                    lines.append(" ".join(line))
                    line = [w]
                else:
                    line.append(w)
            if line:
                lines.append(" ".join(line))
            for j, ln in enumerate(lines):
                c.drawString(mg + 18, y - j * 13, ln)
            y -= max(len(lines), 1) * 13 + 6
            if y < mg + 30:
                break  # truncate if too many steps


def _spec_piece_page(c, piece):
    PW, PH = A4
    mg = MARGIN * cm
    title_h = TITLE_H * cm
    avail_w = PW - 2 * mg
    avail_h = PH - 2 * mg - title_h

    name = piece.get("name", "Piece")
    shape = piece.get("shape", "rectangle")
    dims = piece.get("dimensions", {})
    cut_count = piece.get("cut_count", 1)
    on_fold = piece.get("on_fold", False)
    grain = piece.get("grain", "straight")
    notes = piece.get("notes") or ""

    # Add SA to finished dimensions to get cut dimensions
    cut_dims = _add_sa(shape, dims)

    # Piece bounding box in cm
    pw_cm, ph_cm = _bounding_box(shape, cut_dims)
    scale = min(avail_w / (pw_cm * cm), avail_h / (ph_cm * cm), 1.0)
    pw = pw_cm * cm * scale
    ph = ph_cm * cm * scale

    ox = mg + (avail_w - pw) / 2
    oy = mg + (avail_h - ph) / 2

    # Title block
    fold_note = "  |  Cut on fold" if on_fold else ""
    subtitle = f"Cut × {cut_count}{fold_note}  |  SA {SA} cm included"
    _title_block(c, PW, PH, mg, name.upper(), subtitle)

    # Draw shape
    c.setStrokeColor(colors.black)
    c.setLineWidth(1.2)
    _draw_spec_shape(c, shape, cut_dims, ox, oy, scale)

    # Seam lines (dashed, SA inset)
    c.setDash(4, 3)
    c.setLineWidth(0.6)
    c.setStrokeColor(colors.Color(0.35, 0.35, 0.35))
    _draw_spec_seam_lines(c, shape, cut_dims, ox, oy, scale)
    c.setDash()
    c.setStrokeColor(colors.black)

    # On-fold centre line
    if on_fold:
        c.setDash(8, 4)
        c.setLineWidth(0.8)
        c.setStrokeColor(colors.Color(0.2, 0.4, 0.8))
        fold_x = ox + pw / 2
        c.line(fold_x, oy, fold_x, oy + ph)
        c.setDash()
        c.setStrokeColor(colors.black)
        c.setFont("Helvetica", 7)
        c.setFillColor(colors.Color(0.2, 0.4, 0.8))
        c.drawCentredString(fold_x, oy + ph + 0.3 * cm, "FOLD")
        c.setFillColor(colors.black)

    # Grain line
    _draw_grain_line(c, grain, ox, oy, pw, ph, scale)

    # Notes
    if notes:
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColor(colors.Color(0.4, 0.4, 0.4))
        c.drawCentredString(ox + pw / 2, oy - 0.55 * cm, notes)
        c.setFillColor(colors.black)

    # Dimensions label
    c.setFont("Helvetica", 8)
    dim_str = _dim_label(shape, dims)
    c.drawCentredString(ox + pw / 2, oy - (1.1 * cm if notes else 0.5 * cm), f"Finished: {dim_str}")

    _scale_bar(c, scale, mg, mg / 2)


def _add_sa(shape, dims):
    """Return cut dimensions by adding SA to all finished dimensions."""
    d = dict(dims)
    if shape == "rectangle":
        d["width_cm"] = d.get("width_cm", 20) + 2 * SA
        d["height_cm"] = d.get("height_cm", 30) + 2 * SA
    elif shape == "trapezoid":
        d["top_cm"] = d.get("top_cm", 20) + 2 * SA
        d["bottom_cm"] = d.get("bottom_cm", 30) + 2 * SA
        d["height_cm"] = d.get("height_cm", 40) + 2 * SA
    elif shape == "right_triangle":
        d["leg1_cm"] = d.get("leg1_cm", 20) + 2 * SA
        d["leg2_cm"] = d.get("leg2_cm", 30) + 2 * SA
    return d


def _bounding_box(shape, cut_dims):
    """Return (width_cm, height_cm) of the bounding box."""
    if shape == "rectangle":
        return cut_dims.get("width_cm", 20), cut_dims.get("height_cm", 30)
    elif shape == "trapezoid":
        return max(cut_dims.get("top_cm", 20), cut_dims.get("bottom_cm", 30)), cut_dims.get("height_cm", 40)
    elif shape == "right_triangle":
        return cut_dims.get("leg1_cm", 20), cut_dims.get("leg2_cm", 30)
    return 20, 30


def _draw_spec_shape(c, shape, cut_dims, ox, oy, scale):
    def p(x_cm, y_cm):
        return ox + x_cm * cm * scale, oy + y_cm * cm * scale

    if shape == "rectangle":
        w = cut_dims.get("width_cm", 20)
        h = cut_dims.get("height_cm", 30)
        c.rect(*p(0, 0), w * cm * scale, h * cm * scale)

    elif shape == "trapezoid":
        top = cut_dims.get("top_cm", 20)
        bot = cut_dims.get("bottom_cm", 30)
        h = cut_dims.get("height_cm", 40)
        # Wider edge at bottom, centred
        dx = (bot - top) / 2
        path = c.beginPath()
        path.moveTo(*p(0, 0))
        path.lineTo(*p(bot, 0))
        path.lineTo(*p(dx + top, h))
        path.lineTo(*p(dx, h))
        path.close()
        c.drawPath(path)

    elif shape == "right_triangle":
        l1 = cut_dims.get("leg1_cm", 20)
        l2 = cut_dims.get("leg2_cm", 30)
        path = c.beginPath()
        path.moveTo(*p(0, 0))
        path.lineTo(*p(l1, 0))
        path.lineTo(*p(0, l2))
        path.close()
        c.drawPath(path)


def _draw_spec_seam_lines(c, shape, cut_dims, ox, oy, scale):
    sa_pts = SA * cm * scale

    def p(x_cm, y_cm):
        return ox + x_cm * cm * scale, oy + y_cm * cm * scale

    if shape == "rectangle":
        w = cut_dims.get("width_cm", 20) * cm * scale
        h = cut_dims.get("height_cm", 30) * cm * scale
        c.rect(ox + sa_pts, oy + sa_pts, w - 2 * sa_pts, h - 2 * sa_pts)

    elif shape == "trapezoid":
        top = cut_dims.get("top_cm", 20)
        bot = cut_dims.get("bottom_cm", 30)
        h = cut_dims.get("height_cm", 40)
        dx = (bot - top) / 2
        # Approximate: inset SA horizontally on sides, SA vertically top/bottom
        path = c.beginPath()
        path.moveTo(*p(SA, SA))
        path.lineTo(*p(bot - SA, SA))
        path.lineTo(*p(dx + top - SA, h - SA))
        path.lineTo(*p(dx + SA, h - SA))
        path.close()
        c.drawPath(path)

    elif shape == "right_triangle":
        l1 = cut_dims.get("leg1_cm", 20)
        l2 = cut_dims.get("leg2_cm", 30)
        path = c.beginPath()
        path.moveTo(*p(SA, SA))
        path.lineTo(*p(l1 - SA, SA))
        path.lineTo(*p(SA, l2 - SA))
        path.close()
        c.drawPath(path)


def _draw_grain_line(c, grain, ox, oy, pw, ph, scale):
    c.setStrokeColor(colors.black)
    c.setLineWidth(0.8)
    arr = 0.22 * cm * scale

    if grain == "bias":
        # 45° diagonal
        cx, cy = ox + pw * 0.2, oy + ph * 0.2
        ex, ey = ox + pw * 0.8, oy + ph * 0.8
    elif grain == "cross":
        # Horizontal
        cx, cy = ox + pw * 0.2, oy + ph / 2
        ex, ey = ox + pw * 0.8, oy + ph / 2
    else:
        # Straight (vertical, default)
        cx, cy = ox + pw / 2, oy + ph * 0.18
        ex, ey = ox + pw / 2, oy + ph * 0.82

    c.line(cx, cy, ex, ey)

    # Arrows at both ends
    import math as _math
    angle = _math.atan2(ey - cy, ex - cx)
    for tip_x, tip_y, direction in ((ex, ey, 1), (cx, cy, -1)):
        for side in (-1, 1):
            ax = tip_x + direction * arr * 1.8 * _math.cos(angle) + side * arr * 0.5 * _math.sin(angle)
            ay = tip_y + direction * arr * 1.8 * _math.sin(angle) - side * arr * 0.5 * _math.cos(angle)
            c.line(tip_x, tip_y, ax, ay)

    # Label
    mid_x, mid_y = (cx + ex) / 2, (cy + ey) / 2
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.black)
    label = "GRAIN" if grain == "straight" else f"{grain.upper()} GRAIN"
    c.drawCentredString(mid_x, mid_y + 5, label)


def _dim_label(shape, dims):
    if shape == "rectangle":
        return f"{dims.get('width_cm', '?')} × {dims.get('height_cm', '?')} cm"
    elif shape == "trapezoid":
        return f"top {dims.get('top_cm', '?')} cm / bottom {dims.get('bottom_cm', '?')} cm / h {dims.get('height_cm', '?')} cm"
    elif shape == "right_triangle":
        return f"{dims.get('leg1_cm', '?')} × {dims.get('leg2_cm', '?')} cm"
    return ""
