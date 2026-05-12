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


def update_project_status(project_id: int, status: str) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE projects SET status = ? WHERE id = ?",
            (status, project_id),
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
            "SELECT * FROM checklist_items WHERE project_id = ? ORDER BY position, created_at",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_checklist_item(project_id: int, title: str, notes: str) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            """INSERT INTO checklist_items (project_id, title, notes, position)
               VALUES (?, ?, ?, COALESCE((SELECT MAX(position) FROM checklist_items WHERE project_id = ?), 0) + 1)""",
            (project_id, title, notes, project_id),
        )
    return {"id": cur.lastrowid, "title": title}


def reorder_checklist(project_id: int, ordered_ids: list[int]) -> None:
    with get_connection() as conn:
        for pos, item_id in enumerate(ordered_ids, start=1):
            conn.execute(
                "UPDATE checklist_items SET position = ? WHERE id = ? AND project_id = ?",
                (pos, item_id, project_id),
            )


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


def update_checklist_item(item_id: int, project_id: int, title: str, notes: str, image_urls_json: str) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE checklist_items SET title = ?, notes = ?, image_url = ? WHERE id = ? AND project_id = ?",
            (title, notes, image_urls_json, item_id, project_id),
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


# --- Progress images ---


def get_progress_images(project_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM project_progress_images WHERE project_id = ? ORDER BY created_at",
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def add_progress_image(project_id: int, url: str) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO project_progress_images (project_id, url) VALUES (?, ?)",
            (project_id, url),
        )
        row = conn.execute(
            "SELECT * FROM project_progress_images WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


def delete_progress_image(image_id: int, project_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM project_progress_images WHERE id = ? AND project_id = ?",
            (image_id, project_id),
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
    notes: str | None = None,
) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO saved_patterns (project_id, source, title, url, image_url, price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (project_id, source, title, url, image_url, price, notes),
        )
    return {"id": cur.lastrowid, "url": url}


def update_pattern(pattern_id: int, project_id: int, title: str, notes: str | None) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE saved_patterns SET title=?, notes=? WHERE id=? AND project_id=?",
            (title, notes, pattern_id, project_id),
        )
        row = conn.execute(
            "SELECT * FROM saved_patterns WHERE id=? AND project_id=?", (pattern_id, project_id)
        ).fetchone()
    return dict(row) if row else None


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
    project_id: int, name: str, quantity: str, notes: str,
    image_url: str | None = None, price: float | None = None,
    care_instructions: str | None = None, grain_direction: str | None = None, pre_wash: int = 0,
) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            """INSERT INTO project_materials
               (project_id, name, quantity, notes, image_url, price, care_instructions, grain_direction, pre_wash)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (project_id, name, quantity, notes, image_url, price, care_instructions, grain_direction, pre_wash),
        )
    return {"id": cur.lastrowid, "name": name}


def update_material(material_id: int, project_id: int, purchased: int, price: float | None, quantity: str | None) -> dict | None:
    with get_connection() as conn:
        fields = "purchased = ?, price = ?"
        params: list = [purchased, price]
        if quantity is not None:
            fields += ", quantity = ?"
            params.append(quantity)
        params += [material_id, project_id]
        conn.execute(
            f"UPDATE project_materials SET {fields} WHERE id = ? AND project_id = ?", params
        )
        row = conn.execute(
            "SELECT * FROM project_materials WHERE id = ? AND project_id = ?", (material_id, project_id)
        ).fetchone()
    return dict(row) if row else None


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


def edit_material(
    material_id: int, project_id: int, name: str, quantity: str, notes: str,
    image_url: str | None, price: float | None,
    care_instructions: str | None = None, grain_direction: str | None = None, pre_wash: int = 0,
) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            """UPDATE project_materials
               SET name=?, quantity=?, notes=?, image_url=?, price=?,
                   care_instructions=?, grain_direction=?, pre_wash=?
               WHERE id=? AND project_id=?""",
            (name, quantity, notes, image_url, price, care_instructions, grain_direction, pre_wash, material_id, project_id),
        )
        row = conn.execute(
            "SELECT * FROM project_materials WHERE id=? AND project_id=?", (material_id, project_id)
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
