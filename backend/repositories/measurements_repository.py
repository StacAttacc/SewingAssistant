from database import get_connection


def get_all() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM global_measurement_sets ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


def add(name: str, measurements_json: str) -> dict:
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO global_measurement_sets (name, measurements) VALUES (?, ?)",
            (name, measurements_json),
        )
        row = conn.execute(
            "SELECT * FROM global_measurement_sets WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(row)


def delete(ms_id: int) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM global_measurement_sets WHERE id = ?", (ms_id,))


def get_for_project(project_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT g.* FROM global_measurement_sets g
            JOIN project_global_measurements pgm ON g.id = pgm.global_ms_id
            WHERE pgm.project_id = ?
            ORDER BY g.created_at
            """,
            (project_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def update(ms_id: int, name: str, measurements_json: str) -> dict | None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE global_measurement_sets SET name = ?, measurements = ? WHERE id = ?",
            (name, measurements_json, ms_id),
        )
        row = conn.execute(
            "SELECT * FROM global_measurement_sets WHERE id = ?", (ms_id,)
        ).fetchone()
    return dict(row) if row else None


def link_to_project(project_id: int, global_ms_ids: list[int]) -> None:
    with get_connection() as conn:
        conn.executemany(
            "INSERT OR IGNORE INTO project_global_measurements (project_id, global_ms_id) VALUES (?, ?)",
            [(project_id, gid) for gid in global_ms_ids],
        )


def unlink_from_project(project_id: int, global_ms_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM project_global_measurements WHERE project_id = ? AND global_ms_id = ?",
            (project_id, global_ms_id),
        )
