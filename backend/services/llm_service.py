"""LLM helpers powered by Claude Haiku (cheapest option, stateless)."""

import json
import anthropic

MODEL = "claude-haiku-4-5-20251001"
_client = anthropic.Anthropic()

_PATTERN_SYSTEM = (
    "You are a sewing expert. Given a project name and description, "
    "reply with ONLY a single search query of 1-3 words for finding sewing patterns. "
    "No prose, no punctuation, just the query. Example: Victorian dress"
)

_MATERIAL_SYSTEM = (
    "You are a sewing expert. Given a project name and description, "
    "reply with ONLY a single 1-word fabric or notion name to search for. "
    "No prose, no punctuation, just the word. Example: taffeta"
)

_AI_PATTERN_SYSTEM = """\
You are a sewing pattern drafting assistant. Given body measurements and a garment description, \
return ONLY a valid JSON object — no markdown fences, no explanation.

Allowed shapes: "rectangle", "trapezoid" (symmetric), "right_triangle"
Dimensions per shape:
  rectangle      → { "width_cm": N, "height_cm": N }
  trapezoid      → { "top_cm": N, "bottom_cm": N, "height_cm": N }
  right_triangle → { "leg1_cm": N, "leg2_cm": N }

All dimensions are FINISHED (no seam allowance — the system adds 1.5 cm to all edges).
Add appropriate ease: 2–4 cm for fitted, 4–8 cm for relaxed, more for loose/gathered.

Output schema:
{
  "title": "string",
  "instructions": ["step 1", "step 2"],
  "pieces": [
    {
      "name": "string",
      "shape": "rectangle|trapezoid|right_triangle",
      "dimensions": { ... },
      "cut_count": 1,
      "on_fold": false,
      "grain": "straight|bias|cross",
      "notes": "optional string"
    }
  ]
}\
"""


def _call(system: str, name: str, description: str, max_tokens: int = 16, temperature: float = 1.0) -> str:
    user_msg = (
        f"Project: {name}\nDescription: {description or 'No description provided.'}"
    )
    response = _client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user_msg}],
    )
    if not response.content:
        return ""
    return response.content[0].text.strip()


def suggest_patterns(name: str, description: str) -> str:
    """Return a single 1-3 word pattern search query."""
    return _call(_PATTERN_SYSTEM, name, description)


def suggest_materials(name: str, description: str) -> str:
    """Return a single 1-word material/fabric search term."""
    return _call(_MATERIAL_SYSTEM, name, description)


def generate_pattern_spec(prompt: str, measurements: dict) -> dict:
    """Call Haiku to produce a structured pattern spec from a garment description + measurements."""
    filled = {k: v for k, v in measurements.items() if v is not None}
    meas_str = ", ".join(f"{k}={v} cm" for k, v in filled.items()) if filled else "no measurements provided"
    user_msg = f"Measurements: {meas_str}\nGarment: {prompt}"

    response = _client.messages.create(
        model=MODEL,
        max_tokens=2048,
        temperature=0.2,
        system=_AI_PATTERN_SYSTEM,
        messages=[{"role": "user", "content": user_msg}],
    )
    raw = response.content[0].text.strip() if response.content else ""
    # Strip accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        spec = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Haiku returned invalid JSON: {exc}") from exc
    if "pieces" not in spec or not isinstance(spec.get("pieces"), list):
        raise ValueError("Haiku response missing 'pieces' list")
    return spec
