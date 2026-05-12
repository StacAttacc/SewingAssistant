import math
import os
import uuid

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from .helpers import GENERATED_DIR, SA, HA, MARGIN, TITLE_H, _title_block, _scale_bar


def generate_skirt(measurements: dict, style_params: dict) -> dict:
    waist = float(measurements.get("waist") or 70)
    hips = float(measurements.get("hips") or 92)
    length = float(style_params.get("length") or 60)
    flare = float(style_params.get("flare") or 0.3)
    num_panels = int(style_params.get("num_panels") or 4)
    wb_width = float(style_params.get("waistband_width") or 4)

    waist_pp = waist / num_panels
    hips_pp = hips / num_panels

    r_inner = waist / (2 * math.pi)
    circle_hem_pp = 2 * math.pi * (r_inner + length) / num_panels
    hem_pp = hips_pp + flare * (circle_hem_pp - hips_pp)

    panel_top = waist_pp + 2 * SA
    panel_bot = hem_pp + 2 * SA
    panel_h = length + SA + HA

    wb_cut_w = waist + 2 * SA + 3.0
    wb_cut_h = wb_width * 2 + 2 * SA

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


def _page_panel(c, cut_top, cut_bot, cut_h, fin_top, fin_bot, fin_h, num_panels):
    PW, PH = A4
    mg = MARGIN * cm
    title_h = TITLE_H * cm

    avail_w = PW - 2 * mg
    avail_h = PH - 2 * mg - title_h
    scale = min(avail_w / (cut_bot * cm), avail_h / (cut_h * cm), 1.0)

    pw = cut_bot * cm * scale
    ph = cut_h * cm * scale
    ox = mg + (avail_w - pw) / 2
    oy = mg

    _title_block(c, PW, PH, mg,
                 "SKIRT PANEL",
                 f"Cut × {num_panels}  |  SA {SA} cm included on all sides  |  Hem allowance {HA} cm included")

    dx = (cut_bot - cut_top) / 2

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

    c.setDash(4, 3)
    c.setLineWidth(0.6)
    c.setStrokeColor(colors.Color(0.35, 0.35, 0.35))

    wl = p(dx + SA, cut_h - SA)
    wr = p(dx + cut_top - SA, cut_h - SA)
    c.line(*wl, *wr)

    hl = p(SA, HA)
    hr = p(cut_bot - SA, HA)
    c.line(*hl, *hr)
    c.line(*hl, *wl)
    c.line(*hr, *wr)

    c.setDash()
    c.setStrokeColor(colors.black)

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

    c.setFillColor(colors.black)
    c.setFont("Helvetica", 7)
    gx_pts, _ = p(gx, cut_h / 2)
    c.drawCentredString(gx_pts, p(gx, cut_h / 2)[1], "GRAIN")

    c.setFont("Helvetica", 8)
    c.drawCentredString(*p(dx + cut_top / 2, cut_h + 0.35), f"WAIST  {fin_top:.1f} cm")
    c.drawCentredString(*p(cut_bot / 2, -0.5), f"HEM  {fin_bot:.1f} cm")

    c.setFont("Helvetica", 7)
    sx, sy = p(-0.15, cut_h / 2)
    c.saveState()
    c.translate(sx, sy)
    c.rotate(90)
    c.drawCentredString(0, 0, "SIDE SEAM")
    c.restoreState()

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

    c.setStrokeColor(colors.black)
    c.setLineWidth(1.2)
    c.rect(ox, oy, pw, ph)

    fold_y = oy + ph / 2
    c.setDash(6, 3)
    c.setLineWidth(0.6)
    c.setStrokeColor(colors.Color(0.35, 0.35, 0.35))
    c.line(ox, fold_y, ox + pw, fold_y)
    c.setDash()

    c.setDash(4, 3)
    sa_pts = SA * cm * scale
    c.line(ox + sa_pts, oy, ox + sa_pts, oy + ph)
    c.line(ox + pw - sa_pts, oy, ox + pw - sa_pts, oy + ph)
    c.line(ox, oy + sa_pts, ox + pw, oy + sa_pts)
    c.line(ox, oy + ph - sa_pts, ox + pw, oy + ph - sa_pts)
    c.setDash()
    c.setStrokeColor(colors.black)

    c.setFont("Helvetica", 8)
    c.setFillColor(colors.black)
    c.drawCentredString(ox + pw / 2, fold_y + 0.22 * cm, "FOLD")
    c.drawCentredString(ox + pw / 2, oy + ph + 0.35 * cm, f"Cut: {cut_w:.1f} cm × {cut_h:.1f} cm")
    c.drawCentredString(ox + pw / 2, oy - 0.45 * cm, f"Finished waistband width: {fin_h:.1f} cm")

    _scale_bar(c, scale, mg, oy - 1.2 * cm)
