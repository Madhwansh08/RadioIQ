import sys

# Add parent directory to Python path to allow relative imports
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

import asyncio
import time

import pytest

from src.server import batch_process_images


@pytest.mark.asyncio
@pytest.mark.stress
async def test_stress_api(async_client):
    num_requests = 100  # Total number of requests
    concurrency = 10  # Max concurrent requests at a time
    semaphore = asyncio.Semaphore(concurrency)

    response_times = []
    failure_details = []
    asyncio.create_task(batch_process_images())

    async def send_request(i):
        async with semaphore:
            start_time = time.perf_counter()  # Start timing request
            try:
                test_payload = {
                    "data": {
                        "url": "https://res.cloudinary.com/dfooayhil/image/upload/v1740159063/test_dataset/ne87ds66skvsotwoikys.png"
                    }
                }
                response = await async_client.post(
                    "/invocations", json=test_payload, timeout=30
                )
                elapsed_time = (
                    time.perf_counter() - start_time
                )  # Calculate response time

                if response.status_code == 200:
                    response_times.append(elapsed_time)
                    return response.json()
                else:
                    failure_details.append(
                        f"Request {i} failed with status {response.status_code}. Response: {response.text}"
                    )
                    return None
            except Exception as e:
                failure_details.append(f"Request {i} failed: {e}")
                return None

    test_start_time = time.perf_counter()
    tasks = [send_request(i) for i in range(num_requests)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    test_elapsed_time = time.perf_counter() - test_start_time

    # Calculate statistics
    successful_requests = len([r for r in results if r is not None])
    failed_requests = len(results) - successful_requests

    if response_times:
        min_time = min(response_times)
        max_time = max(response_times)
        avg_time = sum(response_times) / len(response_times)
        p95_time = sorted(response_times)[
            int(0.95 * len(response_times))
        ]  # 95th percentile
        p99_time = sorted(response_times)[
            int(0.99 * len(response_times))
        ]  # 99th percentile
    else:
        min_time = max_time = avg_time = p95_time = p99_time = None

    # Print results
    print("\n--- Stress Test Results ---")
    print(f"Total Requests Sent: {num_requests}")
    print(f"Concurrency Level: {concurrency}")
    print(f"Successful Requests: {successful_requests}")
    print(f"Failed Requests: {failed_requests}")
    print(f"Success Rate: {successful_requests / num_requests * 100:.2f}%")
    print(f"Response Time (min): {min_time:.3f} sec")
    print(f"Response Time (max): {max_time:.3f} sec")
    print(f"Response Time (avg): {avg_time:.3f} sec")
    print(f"Total Test Time: {test_elapsed_time:.3f} sec")
    print(f"Response Time (95th percentile): {p95_time:.3f} sec")
    print(f"Response Time (99th percentile): {p99_time:.3f} sec")

    # Print first few failure details if any
    if failure_details:
        print("\n--- Failed Requests ---")
        for detail in failure_details:
            print(detail)

    assert successful_requests == num_requests, f"{failed_requests} requests failed"
