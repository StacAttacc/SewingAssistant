import sqlite3
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sewing_assistant.db")
DB_PATH = DATABASE_URL.removeprefix("sqlite:///") if DATABASE_URL.startswith("sqlite:///") else DATABASE_URL


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # rows behave like dicts
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS projects (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                budget      REAL,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS saved_patterns (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                source      TEXT NOT NULL DEFAULT '',
                title       TEXT NOT NULL DEFAULT '',
                url         TEXT NOT NULL,
                image_url   TEXT,
                price       TEXT,
                saved_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS checklist_items (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                title       TEXT NOT NULL,
                notes       TEXT NOT NULL DEFAULT '',
                checked     INTEGER NOT NULL DEFAULT 0,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS project_materials (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                name        TEXT NOT NULL,
                quantity    TEXT NOT NULL DEFAULT '',
                notes       TEXT NOT NULL DEFAULT '',
                purchased   INTEGER NOT NULL DEFAULT 0,
                image_url   TEXT,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        # Migrate existing DBs that predate the image_url column
        try:
            conn.execute("ALTER TABLE project_materials ADD COLUMN image_url TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists
        # Migrate existing DBs that predate the measurements column
        try:
            conn.execute("ALTER TABLE projects ADD COLUMN measurements TEXT")
        except sqlite3.OperationalError:
            pass  # column already exists
        # Migrate existing DBs that predate the status column
        try:
            conn.execute("ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'to_start'")
        except sqlite3.OperationalError:
            pass  # column already exists
        # Migrate existing DBs that predate the price column on materials
        try:
            conn.execute("ALTER TABLE project_materials ADD COLUMN price REAL")
        except sqlite3.OperationalError:
            pass  # column already exists

        conn.executescript("""
            CREATE TABLE IF NOT EXISTS project_measurement_sets (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                name         TEXT NOT NULL,
                measurements TEXT NOT NULL DEFAULT '{}',
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS global_measurement_sets (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT NOT NULL,
                measurements TEXT NOT NULL DEFAULT '{}',
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS project_global_measurements (
                project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                global_ms_id INTEGER NOT NULL REFERENCES global_measurement_sets(id) ON DELETE CASCADE,
                PRIMARY KEY (project_id, global_ms_id)
            );
        """)
