import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
GENERATED_DIR = os.path.join(UPLOADS_DIR, "generated")

SA = 1.5
HA = 3.0
MARGIN = 1.5
TITLE_H = 2.8


def _title_block(c, PW, PH, mg, title, subtitle):
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(colors.black)
    c.drawString(mg, PH - mg - 13, title)
    c.setFont("Helvetica", 9)
    c.drawString(mg, PH - mg - 26, subtitle)
    c.setStrokeColor(colors.Color(0.7, 0.7, 0.7))
    c.setLineWidth(0.5)
    c.line(mg, PH - mg - TITLE_H * cm, PW - mg, PH - mg - TITLE_H * cm)
    c.setStrokeColor(colors.black)


def _scale_bar(c, scale, x, y):
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
