# Sewing Assistant

## Project Overview

An agentic LLM-powered assistant that helps users research, plan, and execute sewing projects.

---

## Original Feature Ideas

### Core Features

- **Agentic LLM** - Helps research and plan sewing projects
- **Pattern Search** - Finds sewing patterns and provides links
- **Materials Finder** - Locates materials and nearby stores to buy them
- **Checklist UI** - Interface for tracking what to buy
- **Project Database** - Saves progress on current projects

### Extra Features (Stretch Goals)

- Raspberry Pi integration for wearable tech
- User measurements integration to tweak patterns for better fit
- Mobile App Integration

---

## Time Estimates (50h Budget)

| Feature                                 | Time Estimate |
| --------------------------------------- | ------------- |
| Agentic LLM for research/planning       | 8-10h         |
| Pattern search + link retrieval         | 6-8h          |
| Materials/store finder (location-based) | 8-10h         |
| UI for checklists                       | 6-8h          |
| Database for project tracking           | 5-6h          |
| **Core Total**                          | **~35-40h**   |

---

## Recommended Tech Stack

- **Backend:** Python (FastAPI) + LangChain/LangGraph for agentic flow
- **Frontend:** React or Streamlit (faster for 50h)
- **Database:** SQLite or PostgreSQL
- **LLM:** OpenAI API or local Ollama

---

## Prioritized Feature List (MoSCoW)

| Priority   | Feature                               |
| ---------- | ------------------------------------- |
| **Must**   | LLM chat for project planning         |
| **Must**   | Pattern search (2-3 sources)          |
| **Must**   | Basic material list generation        |
| **Must**   | Checklist UI                          |
| **Must**   | SQLite project persistence            |
| **Should** | Store finder with location            |
| **Could**  | User measurements for fit suggestions |
| **Won't**  | Raspberry Pi (save for v2)            |

---

## Key Recommendations

1. **Narrow pattern search scope** - Focus on 2-3 sources (Simplicity, McCall's, free PDFs)
2. **Use existing APIs** - Google Places API for store finding, affiliate links for materials
3. **Skip Raspberry Pi** - Too complex for 50h, save for future version
4. **User measurements** - Achievable as simple form + scaling logic (~5-8h)
5. **Budget 20% buffer** - Agentic LLM debugging and prompt engineering eat time

---

## Risks

- Agentic LLMs can spiral in complexity
- Web scraping for patterns is time-consuming
- Tool call debugging and edge cases need buffer time

---

_Summary created: January 23, 2026_
