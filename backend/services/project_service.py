from repositories import project_repository


# --- Projects ---

def list_projects() -> list[dict]:
    return project_repository.get_all_projects()


def get_project(project_id: int) -> dict | None:
    return project_repository.get_project(project_id)


def create_project(name: str, description: str, budget: float | None) -> dict:
    return project_repository.create_project(name, description, budget)


def delete_project(project_id: int) -> None:
    project_repository.delete_project(project_id)


# --- Checklist ---

def get_checklist(project_id: int) -> list[dict]:
    return project_repository.get_checklist(project_id)


def add_checklist_item(project_id: int, title: str, notes: str) -> dict:
    return project_repository.add_checklist_item(project_id, title, notes)


def toggle_checklist_item(item_id: int, project_id: int) -> dict | None:
    return project_repository.toggle_checklist_item(item_id, project_id)


def delete_checklist_item(item_id: int, project_id: int) -> None:
    project_repository.delete_checklist_item(item_id, project_id)


# --- Saved patterns ---

def get_saved_patterns(project_id: int) -> list[dict]:
    return project_repository.get_saved_patterns(project_id)


def save_pattern(project_id: int, source: str, title: str, url: str, image_url: str | None, price: str | None) -> dict:
    return project_repository.save_pattern(project_id, source, title, url, image_url, price)


def delete_saved_pattern(pattern_id: int, project_id: int) -> None:
    project_repository.delete_saved_pattern(pattern_id, project_id)


# --- Project materials ---

def get_materials(project_id: int) -> list[dict]:
    return project_repository.get_materials(project_id)


def add_material(project_id: int, name: str, quantity: str, notes: str) -> dict:
    return project_repository.add_material(project_id, name, quantity, notes)


def toggle_material_purchased(material_id: int, project_id: int) -> dict | None:
    return project_repository.toggle_material_purchased(material_id, project_id)


def delete_material(material_id: int, project_id: int) -> None:
    project_repository.delete_material(material_id, project_id)
