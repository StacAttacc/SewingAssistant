"""LLM helpers powered by Claude Haiku (cheapest option, stateless)."""

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


def _call(system: str, name: str, description: str) -> str:
    user_msg = (
        f"Project: {name}\nDescription: {description or 'No description provided.'}"
    )
    response = _client.messages.create(
        model=MODEL,
        max_tokens=16,
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
