from repositories import project_repository


def list_projects() -> list[dict]:
    return project_repository.get_all_projects()


def create_project(name: str, notes: str) -> dict:
    return project_repository.create_project(name, notes)


def delete_project(project_id: int) -> None:
    project_repository.delete_project(project_id)


def get_checklist(project_id: int) -> list[dict]:
    return project_repository.get_checklist(project_id)


def add_checklist_item(project_id: int, name: str, quantity: str) -> dict:
    return project_repository.add_checklist_item(project_id, name, quantity)


def toggle_checklist_item(item_id: int, project_id: int) -> dict | None:
    return project_repository.toggle_checklist_item(item_id, project_id)


def delete_checklist_item(item_id: int, project_id: int) -> None:
    project_repository.delete_checklist_item(item_id, project_id)


def get_saved_patterns(project_id: int) -> list[dict]:
    return project_repository.get_saved_patterns(project_id)


def save_pattern(project_id: int, title: str, url: str, snippet: str) -> dict:
    return project_repository.save_pattern(project_id, title, url, snippet)


def delete_saved_pattern(pattern_id: int, project_id: int) -> None:
    project_repository.delete_saved_pattern(pattern_id, project_id)
