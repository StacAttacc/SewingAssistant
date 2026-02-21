from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_connection

router = APIRouter()


# --- Schemas ---

class ProjectCreate(BaseModel):
    name: str
    notes: str = ""

class ChecklistItemCreate(BaseModel):
    name: str
    quantity: str = ""

class SavedPatternCreate(BaseModel):
    title: str = ""
    url: str
    snippet: str = ""


# --- Projects ---

@router.get("/")
def list_projects():
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


@router.post("/")
def create_project(data: ProjectCreate):
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO projects (name, notes) VALUES (?, ?)",
            (data.name, data.notes),
        )
    return {"id": cur.lastrowid, "name": data.name}


@router.delete("/{project_id}")
def delete_project(project_id: int):
    with get_connection() as conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    return {"deleted": project_id}


# --- Checklist ---

@router.get("/{project_id}/checklist")
def get_checklist(project_id: int):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM checklist_items WHERE project_id = ? ORDER BY created_at",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.post("/{project_id}/checklist")
def add_checklist_item(project_id: int, data: ChecklistItemCreate):
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO checklist_items (project_id, name, quantity) VALUES (?, ?, ?)",
            (project_id, data.name, data.quantity),
        )
    return {"id": cur.lastrowid, "name": data.name}


@router.patch("/{project_id}/checklist/{item_id}/toggle")
def toggle_checklist_item(project_id: int, item_id: int):
    with get_connection() as conn:
        conn.execute(
            "UPDATE checklist_items SET checked = NOT checked WHERE id = ? AND project_id = ?",
            (item_id, project_id),
        )
        row = conn.execute("SELECT * FROM checklist_items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Item not found")
    return dict(row)


@router.delete("/{project_id}/checklist/{item_id}")
def delete_checklist_item(project_id: int, item_id: int):
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM checklist_items WHERE id = ? AND project_id = ?",
            (item_id, project_id),
        )
    return {"deleted": item_id}


# --- Saved patterns ---

@router.get("/{project_id}/patterns")
def get_saved_patterns(project_id: int):
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM saved_patterns WHERE project_id = ? ORDER BY saved_at DESC",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.post("/{project_id}/patterns")
def save_pattern(project_id: int, data: SavedPatternCreate):
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO saved_patterns (project_id, title, url, snippet) VALUES (?, ?, ?, ?)",
            (project_id, data.title, data.url, data.snippet),
        )
    return {"id": cur.lastrowid, "url": data.url}


@router.delete("/{project_id}/patterns/{pattern_id}")
def delete_saved_pattern(project_id: int, pattern_id: int):
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM saved_patterns WHERE id = ? AND project_id = ?",
            (pattern_id, project_id),
        )
    return {"deleted": pattern_id}
