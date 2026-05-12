import json
from repositories import project_repository


# --- Projects ---


def list_projects() -> list[dict]:
    return project_repository.get_all_projects()


def get_project(project_id: int) -> dict | None:
    return project_repository.get_project(project_id)


def create_project(name: str, description: str, budget: float | None) -> dict:
    return project_repository.create_project(name, description, budget)


def update_project(project_id: int, name: str, description: str, budget: float | None) -> dict | None:
    return project_repository.update_project(project_id, name, description, budget)


def update_project_status(project_id: int, status: str) -> dict | None:
    return project_repository.update_project_status(project_id, status)


def delete_project(project_id: int) -> None:
    project_repository.delete_project(project_id)


# --- Progress images ---


def get_progress_images(project_id: int) -> list[dict]:
    return project_repository.get_progress_images(project_id)


def add_progress_image(project_id: int, url: str) -> dict:
    return project_repository.add_progress_image(project_id, url)


def delete_progress_image(image_id: int, project_id: int) -> None:
    project_repository.delete_progress_image(image_id, project_id)


# --- Measurement sets ---


def get_measurement_sets(project_id: int) -> list[dict]:
    rows = project_repository.get_measurement_sets(project_id)
    for row in rows:
        raw = row.get("measurements", "{}")
        try:
            row["measurements"] = json.loads(raw)
        except (json.JSONDecodeError, ValueError):
            row["measurements"] = {}
    return rows


def add_measurement_set(project_id: int, name: str, measurements: dict) -> dict:
    row = project_repository.add_measurement_set(project_id, name, json.dumps(measurements))
    try:
        row["measurements"] = json.loads(row["measurements"])
    except (json.JSONDecodeError, ValueError):
        row["measurements"] = {}
    return row


def update_measurement_set(ms_id: int, project_id: int, name: str, measurements: dict) -> dict | None:
    row = project_repository.update_measurement_set(ms_id, project_id, name, json.dumps(measurements))
    if row:
        try:
            row["measurements"] = json.loads(row["measurements"])
        except (json.JSONDecodeError, ValueError):
            row["measurements"] = {}
    return row


def delete_measurement_set(ms_id: int, project_id: int) -> None:
    project_repository.delete_measurement_set(ms_id, project_id)


# --- Checklist ---


def _parse_checklist_images(row: dict) -> dict:
    raw = row.pop('image_url', None) or '[]'
    try:
        urls = json.loads(raw)
        if isinstance(urls, str):
            urls = [urls] if urls else []
        elif not isinstance(urls, list):
            urls = []
    except (json.JSONDecodeError, ValueError):
        urls = [raw] if raw else []
    row['image_urls'] = urls
    return row


def get_checklist(project_id: int) -> list[dict]:
    rows = project_repository.get_checklist(project_id)
    return [_parse_checklist_images(r) for r in rows]


def add_checklist_item(project_id: int, title: str, notes: str) -> dict:
    return project_repository.add_checklist_item(project_id, title, notes)


def toggle_checklist_item(item_id: int, project_id: int) -> dict | None:
    row = project_repository.toggle_checklist_item(item_id, project_id)
    return _parse_checklist_images(row) if row else None


def update_checklist_item(item_id: int, project_id: int, title: str, notes: str, image_urls: list) -> dict | None:
    row = project_repository.update_checklist_item(item_id, project_id, title, notes, json.dumps(image_urls))
    return _parse_checklist_images(row) if row else None


def delete_checklist_item(item_id: int, project_id: int) -> None:
    project_repository.delete_checklist_item(item_id, project_id)


# --- Saved patterns ---


def get_saved_patterns(project_id: int) -> list[dict]:
    return project_repository.get_saved_patterns(project_id)


def save_pattern(
    project_id: int,
    source: str,
    title: str,
    url: str,
    image_url: str | None,
    price: str | None,
    notes: str | None = None,
) -> dict:
    return project_repository.save_pattern(
        project_id, source, title, url, image_url, price, notes
    )


def delete_saved_pattern(pattern_id: int, project_id: int) -> None:
    project_repository.delete_saved_pattern(pattern_id, project_id)


# --- Project materials ---


def get_materials(project_id: int) -> list[dict]:
    return project_repository.get_materials(project_id)


def add_material(
    project_id: int, name: str, quantity: str, notes: str,
    image_url: str | None = None, price: float | None = None,
    care_instructions: str | None = None, grain_direction: str | None = None, pre_wash: int = 0,
) -> dict:
    return project_repository.add_material(
        project_id, name, quantity, notes, image_url, price, care_instructions, grain_direction, pre_wash
    )


def update_material(material_id: int, project_id: int, purchased: int, price: float | None, quantity: str | None) -> dict | None:
    return project_repository.update_material(material_id, project_id, purchased, price, quantity)


def toggle_material_purchased(material_id: int, project_id: int) -> dict | None:
    return project_repository.toggle_material_purchased(material_id, project_id)


def edit_material(
    material_id: int, project_id: int, name: str, quantity: str, notes: str,
    image_url: str | None, price: float | None,
    care_instructions: str | None = None, grain_direction: str | None = None, pre_wash: int = 0,
) -> dict | None:
    return project_repository.edit_material(
        material_id, project_id, name, quantity, notes, image_url, price, care_instructions, grain_direction, pre_wash
    )


def delete_material(material_id: int, project_id: int) -> None:
    project_repository.delete_material(material_id, project_id)
