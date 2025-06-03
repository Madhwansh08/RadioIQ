# Define request schema
import asyncio
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Import FastAPI
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Adjust system path for local modules
sys.path.append(str(Path(__file__).parent.parent))

# Importing asynccontextmanager
from contextlib import asynccontextmanager

from src.batch_inference import batch_inference, process_dicom_images

# Import custom modules
from src.model_container import model_container
from src.utils import cleanup_gpu_memory,DICOMBatchProcessor


from fastapi.staticfiles import StaticFiles


from fastapi.middleware.cors import CORSMiddleware


origins = [
    "http://localhost:5173",  # e.g., your React app running on localhost:3000
    "http://127.0.0.1:5173",
    "http://localhost:18080"  # if your frontend is served from the same backend
]




@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load models on startup and start batch processing task.

    This function runs during application startup and shutdown.
    It loads all ML models into memory and starts the background
    batch processing task.

    Args:
        app (FastAPI): The FastAPI application instance

    Yields:
        None: Yields control back to FastAPI after startup tasks complete

    Note:
        - Uses global model_container to load models
        - Starts batch_process_images() as background task
        - Models remain loaded until application shutdown
    """
    global model_container
    model_container.load_all_models()
    asyncio.create_task(batch_process_images())
    yield
    del model_container
    cleanup_gpu_memory()


app = FastAPI(lifespan=lifespan)


if os.environ.get("DEBUGGER") == "True":
    try:
        import debugpy

        debugpy.listen(("0.0.0.0", 5678))
    except Exception:
        pass


class InputData(BaseModel):
    """
    Pydantic model for validating input data.

    Attributes:
        data (Dict[str, Any]): Dictionary containing input data for inference.

    Required keys:
        - **url** (*str*): URL of the image to process.

    Optional keys:
        - **isInverted** (*bool*): Flag indicating if the image is inverted.
    """

    data: Dict[str, Any]


# Queue to store incoming image URLs and their response futures
image_queue: List[Tuple[Dict[str, Any], asyncio.Future]] = []

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", 4))  # Max batch size
MAX_WAIT_TIME = int(
    os.environ.get("MAX_WAIT_TIME", 5)
)  # Max time to wait before processing

first_request_time = None  # Timestamp of first request in batch


# async def batch_process_images():
#     """
#     Background task that processes queued images in batches.

#     This function runs continuously and processes images when either:
#     - The queue reaches BATCH_SIZE
#     - MAX_WAIT_TIME seconds have passed since the first request in batch

#     Global variables used:
#         image_queue: List of tuples containing (input_data, future)
#         first_request_time: Timestamp of first request in current batch
#         BATCH_SIZE: Maximum number of images to process in one batch
#         MAX_WAIT_TIME: Maximum seconds to wait before processing incomplete batch

#     Note:
#         - Processes up to BATCH_SIZE images at once
#         - Uses batch_inference for multiple images
#         - Sets results in futures to resolve waiting requests
#         - Maintains continuous operation with 1-second sleep intervals
#     """
#     global image_queue, first_request_time

#     while True:
#         if len(image_queue) > 0:
#             # Start timer if this is the first request in batch
#             if first_request_time is None:
#                 first_request_time = time.time()

#             # Check if we should process the batch
#             if (
#                 len(image_queue) >= BATCH_SIZE
#                 or (time.time() - first_request_time) >= MAX_WAIT_TIME
#             ):
#                 batch = image_queue[:BATCH_SIZE]  # Take up to BATCH_SIZE images
#                 image_queue = image_queue[BATCH_SIZE:]  # Remove processed requests

#                 # Reset the timer if queue is empty
#                 first_request_time = None if not image_queue else time.time()

#                 # Extract image URLs and response futures
#                 input_data_batch = [entry[0] for entry in batch]
#                 futures = [entry[1] for entry in batch]

#                 print(f"Processing batch of {len(input_data_batch)} images...")

#                 # Step 0: Check for any DICOMs
#                 dicom_inputs = [item for item in input_data_batch if item["url"].endswith(".dicom")]
#                 image_inputs = [item for item in input_data_batch if not item["url"].endswith(".dicom")]

#                 # Step 1: Convert DICOMs to PNGs
#                 converted = []
#                 if dicom_inputs:
#                     for dicom_input in dicom_inputs:
#                         dicom_image = Path(dicom_input["url"].replace("file://", ""))
#                         converted_folder = Path("/data/converted_png/")  # You can adjust this
#                         os.makedirs(converted_folder, exist_ok=True)  # Make sure it exists
#                         converted_paths = await process_dicom_images(...)
#                         converted.extend([{"url": f"file://{p}"} for p in converted_paths])
#                 if image_inputs:
#                     for image_input in image_inputs:
#                         png_image = Path(image_input["url"].replace("file://", ""))
#                         converted_folder = Path("/data/converted_png/")  # You can adjust this
#                         os.makedirs(converted_folder, exist_ok=True)  # Make sure it exists
#                         converted.append(await process_dicom_images(str(png_image), str(converted_folder)))

#                 # Step 2: Combine all valid image inputs (converted + already PNG)
#                 image_data_list = converted + image_inputs

#                 if not image_data_list:
#                     print("Critical inference error: No valid images were processed")
#                     for future in futures:
#                         future.set_result({"error": "No valid images were processed"})
#                     continue

#                 # Step 3: Run inference
#                 results = await batch_inference(image_data_list)

#                 # Resolve all waiting requests
#                 for future, result in zip(futures, results):
#                     future.set_result(result)

#         await asyncio.sleep(1)  # Small delay to prevent busy-waiting
async def batch_process_images():
    """
#     Background task that processes queued images in batches.

#     This function runs continuously and processes images when either:
#     - The queue reaches BATCH_SIZE
#     - MAX_WAIT_TIME seconds have passed since the first request in batch

#     Global variables used:
#         image_queue: List of tuples containing (input_data, future)
#         first_request_time: Timestamp of first request in current batch
#         BATCH_SIZE: Maximum number of images to process in one batch
#         MAX_WAIT_TIME: Maximum seconds to wait before processing incomplete batch

#     Note:
#         - Processes up to BATCH_SIZE images at once
#         - Uses batch_inference for multiple images
#         - Sets results in futures to resolve waiting requests
#         - Maintains continuous operation with 1-second sleep intervals
#     """
    global image_queue, first_request_time

    while True:
        if len(image_queue) > 0:
            if first_request_time is None:
                first_request_time = time.time()

            if (
                len(image_queue) >= BATCH_SIZE
                or (time.time() - first_request_time) >= MAX_WAIT_TIME
            ):
                batch = image_queue[:BATCH_SIZE]
                image_queue = image_queue[BATCH_SIZE:]

                first_request_time = None if not image_queue else time.time()

                input_data_batch = [entry[0] for entry in batch]
                futures = [entry[1] for entry in batch]

                print(f"Processing batch of {len(input_data_batch)} images...")

                converted = []
                converted_folder = Path("/data/converted_png/")
                os.makedirs(converted_folder, exist_ok=True)
                processor = DICOMBatchProcessor(str(converted_folder))

                for item in input_data_batch:
                    local_path = Path(item["url"].replace("file://", ""))
                    output_path = processor.convert_batch(str(local_path))
                    converted.append({"url": f"file://{output_path}"})

                if not converted:
                    print("Critical inference error: No valid images were processed")
                    for future in futures:
                        future.set_result({"error": "No valid images were processed"})
                    continue

                results = await batch_inference(converted)

                for future, result in zip(futures, results):
                    future.set_result(result)

        await asyncio.sleep(1) # Small delay to prevent busy-waiting



# @app.on_event("startup")
# async def startup_event():
#     """Load models on startup"""
#     global model_container
#     model_container.load_all_models()
#     asyncio.create_task(batch_process_images())


@app.get("/ping")
async def health_check():
    """
    SageMaker health check endpoint.

    Returns:
        dict: Status indicating server health
            {"status": "healthy"}
    """
    return {"status": "healthy"}


@app.post("/invocations")
async def predict(input_data: InputData):
    """
    SageMaker prediction endpoint for processing chest X-ray images.

    Args:
        input_data (InputData): Pydantic model containing inference request data.

    Returns:
        dict: Inference results including:
            - image_id: Unique identifier
            - abnormalities: Detected conditions
            - visualizations: Generated image URLs
            - metrics: Computed measurements

    Raises:
        HTTPException:
            - 400: Invalid input data or format
            - 499: Request cancelled
            - 500: Unexpected server error

    Note:
        - Requests are queued for batch processing
        - Results are returned asynchronously when batch is processed
        - Supports both single image and batch processing
    """
    try:
        future = asyncio.get_running_loop().create_future()
        image_queue.append((input_data.data, future))
        return await future

    except asyncio.CancelledError:
        print("Request was cancelled (client likely disconnected)")
        raise HTTPException(status_code=499, detail="Request was cancelled")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           # List of origins that are allowed to make CORS requests
    allow_credentials=True,          # Allow cookies and other credentials
    allow_methods=["*"],             # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],             # Allow all headers
)





# Serve local folder via HTTP
app.mount("/static", StaticFiles(directory="/data/output"), name="static")
app.mount('/static' , StaticFiles(directory="/data/converted_png"), name="static")


