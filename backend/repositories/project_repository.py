from database import get_connection


# --- Projects ---


def get_all_projects() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM projects ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def get_project(project_id: int) -> dict | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone()
    return dict(row) if row else None


def create_project(name: str, description: str, budget: float | None) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO projects (name, description, budget) VALUES (?, ?, ?)",
            (name, description, budget),
        )
    return {"id": cur.lastrowid, "name": name}


def update_project(project_id: int, name: str, description: str, budget: float | None) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE projects SET name = ?, description = ?, budget = ? WHERE id = ?",
            (name, description, budget, project_id),
        )
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    return dict(row) if row else None


def delete_project(project_id: int) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))


def save_measurements(project_id: int, measurements_json: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE projects SET measurements = ? WHERE id = ?",
            (measurements_json, project_id),
        )


# --- Checklist ---


def get_checklist(project_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM checklist_items WHERE project_id = ? ORDER BY created_at",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_checklist_item(project_id: int, title: str, notes: str) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO checklist_items (project_id, title, notes) VALUES (?, ?, ?)",
            (project_id, title, notes),
        )
    return {"id": cur.lastrowid, "title": title}


def toggle_checklist_item(item_id: int, project_id: int) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE checklist_items SET checked = NOT checked WHERE id = ? AND project_id = ?",
            (item_id, project_id),
        )
        row = conn.execute(
            "SELECT * FROM checklist_items WHERE id = ? AND project_id = ?", (item_id, project_id)
        ).fetchone()
    return dict(row) if row else None


def delete_checklist_item(item_id: int, project_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM checklist_items WHERE id = ? AND project_id = ?",
            (item_id, project_id),
        )


# --- Saved patterns ---


def get_saved_patterns(project_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM saved_patterns WHERE project_id = ? ORDER BY saved_at DESC",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def save_pattern(
    project_id: int,
    source: str,
    title: str,
    url: str,
    image_url: str | None,
    price: str | None,
) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO saved_patterns (project_id, source, title, url, image_url, price) VALUES (?, ?, ?, ?, ?, ?)",
            (project_id, source, title, url, image_url, price),
        )
    return {"id": cur.lastrowid, "url": url}


def delete_saved_pattern(pattern_id: int, project_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM saved_patterns WHERE id = ? AND project_id = ?",
            (pattern_id, project_id),
        )


# --- Project materials ---


def get_materials(project_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM project_materials WHERE project_id = ? ORDER BY created_at",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_material(
    project_id: int, name: str, quantity: str, notes: str, image_url: str | None = None
) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO project_materials (project_id, name, quantity, notes, image_url) VALUES (?, ?, ?, ?, ?)",
            (project_id, name, quantity, notes, image_url),
        )
    return {"id": cur.lastrowid, "name": name}


def toggle_material_purchased(material_id: int, project_id: int) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE project_materials SET purchased = NOT purchased WHERE id = ? AND project_id = ?",
            (material_id, project_id),
        )
        row = conn.execute(
            "SELECT * FROM project_materials WHERE id = ? AND project_id = ?", (material_id, project_id)
        ).fetchone()
    return dict(row) if row else None


def delete_material(material_id: int, project_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM project_materials WHERE id = ? AND project_id = ?",
            (material_id, project_id),
        )


# --- Measurement sets ---


def get_measurement_sets(project_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM project_measurement_sets WHERE project_id = ? ORDER BY created_at",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_measurement_set(project_id: int, name: str, measurements_json: str) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO project_measurement_sets (project_id, name, measurements) VALUES (?, ?, ?)",
            (project_id, name, measurements_json),
        )
        row = conn.execute(
            "SELECT * FROM project_measurement_sets WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


def update_measurement_set(ms_id: int, project_id: int, name: str, measurements_json: str) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE project_measurement_sets SET name = ?, measurements = ? WHERE id = ? AND project_id = ?",
            (name, measurements_json, ms_id, project_id),
        )
        row = conn.execute(
            "SELECT * FROM project_measurement_sets WHERE id = ? AND project_id = ?", (ms_id, project_id)
        ).fetchone()
    return dict(row) if row else None


def delete_measurement_set(ms_id: int, project_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM project_measurement_sets WHERE id = ? AND project_id = ?",
            (ms_id, project_id),
        )
