import json
from ddgs import DDGS
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL

_client = Groq(api_key=GROQ_API_KEY)


def search_patterns(query: str, max_results: int = 5) -> list[dict]:
    """Search DuckDuckGo for patterns, then use Groq to structure the results."""
    full_query = f"sewing pattern {query} site:simplicity.com OR site:mccall.com OR site:burdastyle.com"
    with DDGS() as ddgs:
        raw = list(ddgs.text(full_query, max_results=max_results))

    if not raw:
        return []

    # Format raw results into a compact string for the LLM
    raw_text = "\n".join(
        f"- {r.get('title')} | {r.get('href')} | {r.get('body')}"
        for r in raw
    )

    response = _client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a data extraction assistant. Extract sewing pattern info from search results and return ONLY a JSON array, no explanation.",
            },
            {
                "role": "user",
                "content": f"""Extract sewing pattern data from these search results:

{raw_text}

Return a JSON array where each item has:
- title: pattern name
- pattern_number: e.g. S9898 or M8000 (null if not found)
- brand: Simplicity / McCall's / BurdaStyle / etc
- difficulty: Easy / Intermediate / Advanced (null if not found)
- url: the link""",
            },
        ],
        temperature=0,
    )

    content = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # Fall back to raw results if LLM output is unparseable
        return [{"title": r.get("title"), "url": r.get("href"), "snippet": r.get("body")} for r in raw]
