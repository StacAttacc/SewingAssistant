import math
import os
import uuid

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from .helpers import GENERATED_DIR, SA, MARGIN, TITLE_H, _title_block, _scale_bar


def generate_from_spec(spec: dict) -> dict:
    os.makedirs(GENERATED_DIR, exist_ok=True)
    fname = f"ai_pattern_{uuid.uuid4().hex[:8]}.pdf"
    fpath = os.path.join(GENERATED_DIR, fname)

    title = spec.get("title", "Pattern")
    instructions = spec.get("instructions", [])
    pieces = spec.get("pieces", [])

    c = canvas.Canvas(fpath, pagesize=A4)
    _spec_cover_page(c, title, instructions)
    for piece in pieces:
        c.showPage()
        _spec_piece_page(c, piece)
    c.save()

    return {"title": title, "pdf_url": f"/uploads/generated/{fname}"}


def _spec_cover_page(c, title, instructions):
    PW, PH = A4
    mg = MARGIN * cm

    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.black)
    c.drawString(mg, PH - mg - 20, title)

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
                break


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

    cut_dims = _add_sa(shape, dims)
    pw_cm, ph_cm = _bounding_box(shape, cut_dims)
    scale = min(avail_w / (pw_cm * cm), avail_h / (ph_cm * cm), 1.0)
    pw = pw_cm * cm * scale
    ph = ph_cm * cm * scale

    ox = mg + (avail_w - pw) / 2
    oy = mg + (avail_h - ph) / 2

    fold_note = "  |  Cut on fold" if on_fold else ""
    _title_block(c, PW, PH, mg, name.upper(), f"Cut × {cut_count}{fold_note}  |  SA {SA} cm included")

    c.setStrokeColor(colors.black)
    c.setLineWidth(1.2)
    _draw_spec_shape(c, shape, cut_dims, ox, oy, scale)

    c.setDash(4, 3)
    c.setLineWidth(0.6)
    c.setStrokeColor(colors.Color(0.35, 0.35, 0.35))
    _draw_spec_seam_lines(c, shape, cut_dims, ox, oy, scale)
    c.setDash()
    c.setStrokeColor(colors.black)

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

    _draw_grain_line(c, grain, ox, oy, pw, ph, scale)

    if notes:
        c.setFont("Helvetica-Oblique", 8)
        c.setFillColor(colors.Color(0.4, 0.4, 0.4))
        c.drawCentredString(ox + pw / 2, oy - 0.55 * cm, notes)
        c.setFillColor(colors.black)

    c.setFont("Helvetica", 8)
    dim_str = _dim_label(shape, dims)
    c.drawCentredString(ox + pw / 2, oy - (1.1 * cm if notes else 0.5 * cm), f"Finished: {dim_str}")

    _scale_bar(c, scale, mg, mg / 2)


def _add_sa(shape, dims):
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
        cx, cy = ox + pw * 0.2, oy + ph * 0.2
        ex, ey = ox + pw * 0.8, oy + ph * 0.8
    elif grain == "cross":
        cx, cy = ox + pw * 0.2, oy + ph / 2
        ex, ey = ox + pw * 0.8, oy + ph / 2
    else:
        cx, cy = ox + pw / 2, oy + ph * 0.18
        ex, ey = ox + pw / 2, oy + ph * 0.82

    c.line(cx, cy, ex, ey)

    angle = math.atan2(ey - cy, ex - cx)
    for tip_x, tip_y, direction in ((ex, ey, 1), (cx, cy, -1)):
        for side in (-1, 1):
            ax = tip_x + direction * arr * 1.8 * math.cos(angle) + side * arr * 0.5 * math.sin(angle)
            ay = tip_y + direction * arr * 1.8 * math.sin(angle) - side * arr * 0.5 * math.cos(angle)
            c.line(tip_x, tip_y, ax, ay)

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
