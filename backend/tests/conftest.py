from unittest.mock import patch
import pytest


# Prevent init_db from creating a real DB file during tests
@pytest.fixture(autouse=True)
def mock_init_db():
    with patch("database.init_db"):
        yield
