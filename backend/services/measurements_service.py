import json
from repositories import measurements_repository


def list_global_sets() -> list[dict]:
    rows = measurements_repository.get_all()
    for row in rows:
        row["measurements"] = _parse(row.get("measurements", "{}"))
    return rows


def add_global_set(name: str, measurements: dict) -> dict:
    row = measurements_repository.add(name, json.dumps(measurements))
    row["measurements"] = _parse(row.get("measurements", "{}"))
    return row


def update_global_set(ms_id: int, name: str, measurements: dict) -> dict | None:
    row = measurements_repository.update(ms_id, name, json.dumps(measurements))
    if row:
        row["measurements"] = _parse(row.get("measurements", "{}"))
    return row


def delete_global_set(ms_id: int) -> None:
    measurements_repository.delete(ms_id)


def get_for_project(project_id: int) -> list[dict]:
    rows = measurements_repository.get_for_project(project_id)
    for row in rows:
        row["measurements"] = _parse(row.get("measurements", "{}"))
    return rows


def link_to_project(project_id: int, global_ms_ids: list[int]) -> None:
    if global_ms_ids:
        measurements_repository.link_to_project(project_id, global_ms_ids)


def unlink_from_project(project_id: int, global_ms_id: int) -> None:
    measurements_repository.unlink_from_project(project_id, global_ms_id)


def _parse(raw: str) -> dict:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return {}
