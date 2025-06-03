import asyncio
import sys

# Add parent directory to Python path to allow relative imports
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

import pytest

from src.server import batch_process_images


class TestInference:
    @pytest.mark.sanity
    def test_ping(self, client):
        """Test root endpoint"""
        response = client.get("/ping")
        assert response.status_code == 200
        assert "status" in response.json()
        assert response.json()["status"] == "healthy"

    @pytest.mark.asyncio
    @pytest.mark.sanity
    async def test_inference(self, async_client):
        payload = {
            "data": {
                "url": "https://res.cloudinary.com/dfooayhil/image/upload/v1740159063/test_dataset/ne87ds66skvsotwoikys.png"
            }
        }
        asyncio.create_task(batch_process_images())
        response = await async_client.post("/invocations", json=payload)
        assert response.status_code == 200
        assert response.json()  # Ensure response is not empty

    @pytest.mark.asyncio
    @pytest.mark.sanity
    async def test_batch_inference(self, async_client):
        payload = {
            "data": {
                "url": "https://res.cloudinary.com/dfooayhil/image/upload/v1740159063/test_dataset/ne87ds66skvsotwoikys.png"
            }
        }
        asyncio.create_task(batch_process_images())
        response1, response2 = await asyncio.gather(
            async_client.post("/invocations", json=payload),
            async_client.post("/invocations", json=payload),
        )
        assert response1.status_code == 200
        assert response1.json()  # Ensure response is not empty
        assert response2.status_code == 200
        assert response2.json()  # Ensure response is not empty
