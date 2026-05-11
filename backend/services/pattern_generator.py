"""
Sewing pattern generator — placeholder pending new implementation.
"""

import os

UPLOADS_DIR = os.getenv("UPLOADS_DIR", "uploads")
GENERATED_DIR = os.path.join(UPLOADS_DIR, "generated")


def generate_skirt(measurements: dict, style_params: dict) -> dict:
    raise NotImplementedError("Pattern generator not yet implemented")
