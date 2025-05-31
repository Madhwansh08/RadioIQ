import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

# Add parent directory to Python path to allow relative imports
sys.path.append(str(Path(__file__).parent.parent))

# Import the FastAPI app from the main module
from src.server import app


@pytest.fixture
def client():
    """Sync TestClient for simple tests"""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Async test client for async endpoints"""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://localhost:8080"
    ) as client:
        yield client
