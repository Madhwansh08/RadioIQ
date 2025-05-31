# Standard library imports
import asyncio
import collections
import io
import uuid
from typing import Any, Dict, List, Tuple, Union

import aiohttp
import cv2

# Third-party imports
import numpy as np
import torch
import torch.nn.functional as F
import torchvision.ops as ops
import torchxrayvision as xrv
from PIL import Image
from scipy.ndimage import gaussian_filter
from skimage.feature import graycomatrix, graycoprops
from skimage.morphology import dilation, square
from torchvision import transforms
from src.model_container import device, model_container


# Local application imports
from src.utils import (
    CLAHE,
    HistogramEqualizationTransform,
    S3Uploader,
    add_color_legend,
    get_bbox_from_mask,
    process_image_bs,
    DICOMConverter,
    DICOMBatchProcessor,
    LocalUploader
)

# ------------------------------------------------------------------------------
# Load pre-trained models from the specified model directory (MODEL_ROOT)
# and transfer them to the designated computation device.
# ------------------------------------------------------------------------------


# async def get_image(input_data: Dict[str, Any]) -> np.ndarray:
#     """Asynchronously load and process an image from a URL.

#     Args:
#         input_data (dict): Dictionary containing image metadata. Required keys:

#         - **url** (*str*): URL of the image to download.

#     Returns:
#         np.ndarray: Loaded image as a NumPy array with shape (H, W, 3) and dtype float32.

#     Raises:
#         ValueError: If there is an error downloading or processing the image.
#         aiohttp.ClientError: If there is a network error while fetching the image.
#         AssertionError: If the URL is None or not a valid image format.
#     """
    
#     image_url = input_data.get("url")
#     try:
#         assert image_url is not None
#         assert image_url.lower().endswith((".jpg", ".jpeg", ".png"))

#         # Download image asynchronously
#         async with aiohttp.ClientSession() as session:
#             async with session.get(image_url) as response:
#                 response.raise_for_status()
#                 image_bytes = await response.read()

#         image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
#         image = np.array(image, np.float32)

#         return image

#     except aiohttp.ClientError as e:
#         raise ValueError(f"Network error while fetching image: {e}")

#     except Exception as e:
#         raise ValueError(f"Error processing image: {e}")


async def process_dicom_images(input_image: str, output_folder: str) -> dict:
    """
    Convert a batch of DICOM images to PNG and prepare data for get_image.

    Args:
        input_folder (str): Path to the folder containing DICOM files.
        output_folder (str): Path to store the converted PNG files.

    Returns:
        List[Dict[str, str]]: A list of dictionaries with image URLs.
    """
    processor = DICOMBatchProcessor(output_folder)
    png_image = processor.convert_batch(input_image)

    # Prepare data for get_image()
    image_data = {"url": f"file://{png_image}"}

    print(image_data)
    return image_data


async def get_image(input_data: Dict[str, Any]) -> np.ndarray:
    """
    Asynchronously load and process an image from a URL.

    Args:
        input_data (dict): Dictionary containing image metadata. Required keys:
            - "url" (str): URL of the image to download.

    Returns:
        np.ndarray: Loaded image as a NumPy array with shape (H, W, 3) and dtype float32.

    Raises:
        ValueError: If there's an error downloading or processing the image.
    """
    image_url = input_data.get("url")

    try:
        assert image_url is not None, "Image URL is None."
        assert image_url.lower().endswith((".jpg", ".jpeg", ".png" , '.dicom' , '.dcm' , '.dic')), "Invalid image format."

        # Handle local file URLs
        if image_url.startswith("file://"):
            file_path = image_url[7:]  # Remove 'file://' prefix
            with open(file_path, "rb") as f:
                image_bytes = f.read()
        else:
            async with aiohttp.ClientSession() as session:
                async with session.get(image_url) as response:
                    response.raise_for_status()
                    image_bytes = await response.read()

        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = np.array(image, dtype=np.float32)

        return image

    except aiohttp.ClientError as e:
        raise ValueError(f"Network error while fetching image: {e}")

    except Exception as e:
        raise ValueError(f"Error processing image: {e}")


async def to_image_array(image: Union[torch.Tensor, np.ndarray]) -> np.ndarray:
    """
    Convert a tensor or array to a uint8 numpy array suitable for image saving.

    Args:
        image (Union[torch.Tensor, np.ndarray]): Input image as either:
            - torch.Tensor with shape (C, H, W) or (B, C, H, W)
            - np.ndarray with shape (H, W, C) or (B, H, W, C)

    Returns:
        np.ndarray: Image array with shape (H, W, 3) and dtype uint8.
            Values are scaled to range [0, 255].

    Note:
        - Handles both CPU and CUDA tensors
        - Converts single-channel images to RGB by repeating channels
        - Automatically scales values to [0, 1] range if input is in [0, 1]
    """
    if isinstance(image, torch.Tensor):
        # Handle torch tensor
        if image.is_cuda:
            image = image.cpu()
        image = image.numpy()
    if image.ndim == 4:  # Has batch dimension
        image = image.squeeze(0)
    if image.shape[0] in [1, 3]:  # Channels first
        image = image.transpose(1, 2, 0)

    # Now we have a numpy array
    # Scale to [0, 255] if needed
    if image.max() <= 1.0:
        image = image * 255

    # Ensure we have 3 channels
    if len(image.shape) == 2:  # Grayscale
        image = np.stack([image] * 3, axis=-1)
    elif image.shape[-1] == 1:  # Single channel
        image = np.repeat(image, 3, axis=-1)

    return image.astype(np.uint8)


async def preprocessing(input_image: np.ndarray) -> torch.Tensor:
    """
    Preprocess an input image for model inference.

    Args:
        input_image (np.ndarray): Input image array with shape (H, W, 3).

    Returns:
        torch.Tensor: Preprocessed image tensor with shape (1, 3, 1024, 1024).
            The tensor is:
            - Converted to grayscale using ITU-R BT.601 coefficients
            - Normalized to [0, 1] range
            - Resized to 1024x1024
            - CLAHE enhanced
            - Converted to RGB by repeating the grayscale channel
            - Moved to the appropriate device (CPU/GPU)
    """
    # Convert to grayscale using ITU-R BT.601 coefficients
    image = (
        input_image[..., 0] * 0.299
        + input_image[..., 1] * 0.587
        + input_image[..., 2] * 0.114
    )

    # Normalize
    image = (image - image.min()) / (image.max() - image.min() + 1e-6)

    # Create transform pipeline
    transform_n = transforms.Compose(
        [
            transforms.ToTensor(),
            transforms.Resize((1024, 1024), antialias=True),
            CLAHE(),
        ]
    )

    # Apply transforms
    x = transform_n(image).unsqueeze(0)

    # Convert grayscale to RGB by repeating channel 3 times
    x = x.repeat(1, 3, 1, 1)

    return x.to(device)


async def check_validation(input_image: torch.Tensor) -> bool:
    """
    Validate the input image tensor for model inference.

    Args:
        input_image (torch.Tensor): Input image tensor with shape (1, 3, H, W).

    Returns:
        bool: True if the image is valid for inference, False otherwise.
    """
    return True  # Placeholder


async def get_intensity_and_glcm_features(
    input_image: torch.Tensor, intensity_bins: int = 256
) -> np.ndarray:
    """
    Extract intensity histogram and GLCM features from an input image.

    Args:
        input_image (torch.Tensor): Input image tensor with shape (1, 3, H, W).
        intensity_bins (int, optional): Number of bins for intensity histogram. Defaults to 256.

    Returns:
        np.ndarray: Feature vector containing concatenated intensity histogram and GLCM features.

    Note:
        GLCM features computed:
            - Contrast
            - Dissimilarity
            - Homogeneity
            - Energy
            - Correlation
            - ASM (Angular Second Moment)

        Process:
            1. Converts RGB to grayscale
            2. Resizes to 224x224
            3. Computes normalized intensity histogram
            4. Computes GLCM features at distances [1, 2] and angles [0, 45, 90, 135] degrees
    """
    image = input_image.squeeze(0)

    if isinstance(image, torch.Tensor):
        image = image.detach().cpu().numpy()

    # Transpose to (H, W, 3) because OpenCV expects HWC format
    image = np.transpose(image, (1, 2, 0))
    img_gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    img_resized = cv2.resize(img_gray, (224, 224))
    img_resized = (img_resized * 255).astype(np.uint8)
    # ------------------------------------------------
    # 1) Compute the intensity histogram
    # ------------------------------------------------
    hist = cv2.calcHist([img_resized], [0], None, [intensity_bins], [0, 256])
    hist = hist.flatten()
    hist_sum = hist.sum()
    if hist_sum > 0:
        hist = hist / hist_sum
    else:
        hist = np.zeros_like(hist)

    # ------------------------------------------------
    # 2) Compute GLCM features
    # ------------------------------------------------
    distances = [1, 2]  # as used during training
    angles = [0, np.pi / 4, np.pi / 2, 3 * np.pi / 4]
    levels = 256
    props = ["contrast", "dissimilarity", "homogeneity", "energy", "correlation", "ASM"]

    glcm = graycomatrix(
        img_resized,
        distances=distances,
        angles=angles,
        levels=levels,
        symmetric=True,
        normed=True,
    )

    glcm_features_list = []
    for prop in props:
        prop_values = graycoprops(glcm, prop)
        glcm_features_list.append(prop_values.flatten())
    glcm_features = np.concatenate(glcm_features_list, axis=0)

    # ------------------------------------------------
    # 3) Concatenate the histogram and GLCM features
    # ------------------------------------------------
    features = np.concatenate([hist, glcm_features], axis=0)

    return features.astype(np.float32)


async def check_inverted(
    input_images: List[torch.Tensor], input_data: List[dict]
) -> List[bool]:
    """
    Check if input images appear to be in an inverted color scheme.

    Args:
        input_images (List[torch.Tensor]): List of input images as tensors with shape (1, 3, H, W).
        input_data (List[dict]): Input data dictionary containing image URLs and optional is_inverted flags.

    Returns:
        List[bool]: List indicating whether each image is inverted (True) or not (False).

    Note:
        - Uses a pre-trained model to predict image inversion
        - Respects manually specified inversion flags from input_data if present
    """
    features_list = []
    for input_image in input_images:
        features = await get_intensity_and_glcm_features(input_image)
        features_list.append(features)

    # Stack features into a batch
    features_batch = np.stack(features_list)

    check_inversion_model = model_container.get_model("check_inversion_model")

    # Predict for the batch
    predictions = check_inversion_model.predict(features_batch)

    is_inverted_list = [0] * len(input_images)
    for i, pred in enumerate(predictions):
        if input_data[i].get("isInverted") is not None:
            is_inverted_list[i] = input_data[i].get("isInverted")
        else:
            is_inverted_list[i] = pred == 0

    return is_inverted_list


async def get_lung_bbox(input_images: List[torch.Tensor]) -> List[List[int]]:
    """
    Detect lung bounding boxes in chest X-ray images using a pre-trained model.

    Args:
        input_images (List[torch.Tensor]): List of input images as tensors with shape (1, 3, H, W).

    Returns:
        List[List[int]]: List of bounding boxes, where each box is [x1, y1, x2, y2] or None if no lungs detected.

    Note:
        - Uses YOLOv8 model for lung detection
        - Returns coordinates in the original image space
        - Returns None for images where no lungs are detected
    """
    lung_crop_model = model_container.get_model("lung_crop_model")
    lung_crop_model.eval()

    # Stack input images into a batch tensor
    batch_images = torch.stack(
        [img.cpu()[0] for img in input_images]
    )  # Shape: (N, C, H, W)

    # Convert batch tensor to a list of PIL images
    pil_images = [transforms.ToPILImage()(img) for img in batch_images]

    # Perform inference in batch
    with torch.inference_mode():
        results = lung_crop_model(
            pil_images, verbose=False
        )  # Assuming the model supports batch inference

    # Extract bounding boxes for each image
    bboxes = []
    for result in results:
        bbox = None
        if result and result.boxes:
            box = result.boxes[0]  # Use the first detected box
            x1, y1, x2, y2 = map(int, box.xyxy[0])  # Get coordinates
            bbox = [x1, y1, x2, y2]
        bboxes.append(bbox)

    return bboxes


async def generate_smooth_binary_mask(
    heatmap: np.ndarray,
    threshold: int = 40,
    border_thickness: int = 45,
    dilation_iter: int = 5,
    kernel_size: int = 2,
    min_area: int = 50,
) -> np.ndarray:
    """
    Generate a smooth binary mask from a heatmap with various processing steps.

    Args:
        heatmap (np.ndarray): Input heatmap array.
        threshold (int, optional): Threshold for binarization. Defaults to 40.
        border_thickness (int, optional): Thickness of ignored border area. Defaults to 45.
        dilation_iter (int, optional): Number of dilation iterations. Defaults to 5.
        kernel_size (int, optional): Kernel size for dilation. Defaults to 2.
        min_area (int, optional): Minimum area for valid contours. Defaults to 50.

    Returns:
        np.ndarray: Smoothed binary mask.

    Raises:
        ValueError: If heatmap is None or not a valid NumPy array.

    Note:
        Processing steps:
        1. Thresholding
        2. Border removal
        3. Dilation
        4. Morphological closing
        5. Small contour removal
        6. Gaussian smoothing
    """
    if heatmap is None or not isinstance(heatmap, np.ndarray):
        raise ValueError("Error: Heatmap must be a valid NumPy array.")
    # Ensure heatmap is single-channel
    if heatmap.ndim == 3 and heatmap.shape[-1] == 3:
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2GRAY)
    # Step 1: Apply threshold
    _, binary_mask = cv2.threshold(heatmap, threshold, 255, cv2.THRESH_BINARY)

    # Step 2: Remove border regions
    border_mask = np.ones_like(binary_mask, dtype=np.uint8) * 255
    border_mask[:border_thickness, :] = 0
    border_mask[-border_thickness:, :] = 0
    border_mask[:, :border_thickness] = 0
    border_mask[:, -border_thickness:] = 0
    binary_mask = cv2.bitwise_and(binary_mask, border_mask)

    # Step 3: Dilation to fill small gaps
    kernel = np.ones((kernel_size, kernel_size), np.uint8)
    dilated_mask = cv2.dilate(binary_mask, kernel, iterations=dilation_iter)
    dilated_mask = cv2.bitwise_and(dilated_mask, border_mask)

    # Step 4: Morphological closing to smooth edges
    closing_kernel = np.ones((5, 5), np.uint8)
    smoothed_mask = cv2.morphologyEx(dilated_mask, cv2.MORPH_CLOSE, closing_kernel)

    # Step 5: Remove small contours
    contours, _ = cv2.findContours(
        smoothed_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    cleaned_mask = np.zeros_like(smoothed_mask)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area >= min_area:
            cv2.drawContours(cleaned_mask, [cnt], -1, 255, thickness=cv2.FILLED)

    # Step 6: Apply Gaussian blur for smoother mask
    smooth_mask = cv2.GaussianBlur(cleaned_mask, (5, 5), sigmaX=50, sigmaY=50)

    return smooth_mask


async def yolo_lrp_mask(input_image: torch.Tensor) -> np.ndarray:
    """
    Generate Layer-wise Relevance Propagation (LRP) mask using YOLOv8.

    Args:
        input_image (torch.Tensor): Input image tensor with shape (1, 3, H, W).

    Returns:
        np.ndarray: Binary mask highlighting relevant regions detected by YOLO-LRP.

    Note:
        - Resizes input to 640x640 for YOLO processing
        - Applies Gaussian smoothing to the explanation heatmap
        - Thresholds the smoothed heatmap to create binary mask
    """
    # Convert tensor to PIL image
    transform_to_pil = transforms.ToPILImage()
    orig_image = transform_to_pil(input_image.squeeze(0))

    # Transform the image to the required size and format
    transform = transforms.Compose(
        [
            transforms.Resize((640, 640)),
            transforms.ToTensor(),
        ]
    )
    image_tensor = transform(orig_image).unsqueeze(0).to(device)  # [1, 3, 640, 640]

    # Load YOLO model and LRP
    lrp = model_container.get_model("lrp")

    # Generate explanation heatmap
    explanation = lrp.explain(image_tensor.squeeze(0))
    heatmap = explanation.cpu().detach().numpy().squeeze()

    # Normalize and smooth the heatmap
    normalized_heatmap = (heatmap - np.min(heatmap)) / (
        np.max(heatmap) - np.min(heatmap)
    )
    smoothed_heatmap = gaussian_filter(normalized_heatmap, sigma=5)

    # Threshold to create binary mask
    threshold = 0.1
    binary_mask = (smoothed_heatmap >= threshold).astype(np.uint8) * 255

    return binary_mask


def combine_masks(rt_mask_full: np.ndarray, yolo_mask_full: np.ndarray) -> np.ndarray:
    """
    Combine two full-resolution masks with different intensity levels.

    Args:
        rt_mask_full (np.ndarray): RT-DETR generated mask.
        yolo_mask_full (np.ndarray): YOLO-LRP generated mask.

    Returns:
        np.ndarray: Combined mask where:
            - Common areas have intensity 255
            - Non-common areas have intensity 200
            - Background has intensity 0

    Note:
        Used to create a visualization showing agreement between different detection methods.
    """
    union_mask = np.maximum(rt_mask_full, yolo_mask_full)
    common_area = np.logical_and(rt_mask_full > 0, yolo_mask_full > 0)
    union_area = np.logical_and(union_mask > 0, np.logical_not(common_area))
    union_mask[union_area.astype(int)] = 200
    union_mask[common_area.astype(int)] = 255
    return union_mask


def restrict_mask_to_bbox(
    combined_mask: np.ndarray, bbox_list: List[List[int]]
) -> np.ndarray:
    """
    Restrict a mask to regions defined by bounding boxes.

    Args:
        combined_mask (np.ndarray): Full-resolution combined mask.
        bbox_list (List[List[int]]): List of bounding boxes, each as [x1, y1, x2, y2].

    Returns:
        np.ndarray: Mask containing only the regions inside the specified bounding boxes.
    """
    restricted_mask = np.zeros_like(combined_mask)
    for x1, y1, x2, y2 in bbox_list:
        restricted_mask[y1:y2, x1:x2] = combined_mask[y1:y2, x1:x2]
    return restricted_mask


def apply_convex_hull(mask: np.ndarray) -> np.ndarray:
    """
    Apply convex hull operation to a binary mask.

    Args:
        mask (np.ndarray): Input binary mask.

    Returns:
        np.ndarray: Binary mask with convex hull applied to each contour.

    Note:
        Creates a more regular shape by filling concavities in the input mask.
    """
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    hull_mask = np.zeros_like(mask)  # Create an empty mask
    for contour in contours:
        hull = cv2.convexHull(contour)  # Compute convex hull
        cv2.drawContours(
            hull_mask, [hull], -1, (255), thickness=cv2.FILLED
        )  # Fill hull shape
    return hull_mask


def apply_bezier_smoothing(mask: np.ndarray) -> np.ndarray:
    """
    Smoothens mask contours using Bezier curve interpolation.

    Args:
        mask (np.ndarray): Input binary mask.

    Returns:
        np.ndarray: Smoothed binary mask.

    Note:
        - Uses cubic Bezier curves for smoothing
        - Processes the largest contour only
        - Automatically adjusts smoothing based on contour length
        - Maintains closed contours
    """
    # Find all external contours
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return mask

    # Select the largest contour (assumes one main region)
    contour = max(contours, key=cv2.contourArea)
    contour = contour[:, 0, :]  # reshape from (N,1,2) to (N,2)
    n = contour.shape[0]
    if n < 4:
        return mask

    # Helper function: cubic Bezier for four control points
    def cubic_bezier(P0, P1, P2, P3, num_points=20):
        t = np.linspace(0, 1, num_points)
        curve = (
            np.outer((1 - t) ** 3, P0)
            + np.outer(3 * (1 - t) ** 2 * t, P1)
            + np.outer(3 * (1 - t) * t**2, P2)
            + np.outer(t**3, P3)
        )
        return curve.astype(np.int32)

    # Choose a step size based on contour length (adjustable as needed)
    step = 5 if n > 20 else 3
    smoothed_points = []

    # Process contour points in a circular manner
    for i in range(0, n, step):
        P0 = contour[i % n]
        P1 = contour[(i + step // 3) % n]
        P2 = contour[(i + 2 * (step // 3)) % n]
        P3 = contour[(i + step) % n]
        bezier_segment = cubic_bezier(P0, P1, P2, P3, num_points=20)
        smoothed_points.extend(bezier_segment.tolist())

    smoothed_points = np.array(smoothed_points, dtype=np.int32)

    # Reshape to match cv2.fillPoly input expectations
    smoothed_points = smoothed_points.reshape((-1, 1, 2))
    smoothed_mask = np.zeros_like(mask)
    cv2.fillPoly(smoothed_mask, [smoothed_points], 255)

    return smoothed_mask


async def add_segmentation(
    abnormalitiess: List[List[Dict[str, Any]]],
    input_images: List[torch.Tensor],
    heatmaps: List[np.ndarray],
) -> List[List[Dict[int, List[List[int]]]]]:
    """
    Add segmentation masks to detected abnormalities for a batch of images.

    Args:
        abnormalitiess (List[List[Dict[str, Any]]]): List of abnormality dictionaries for each image.
        input_images (List[torch.Tensor]): List of input image tensors (1, 3, H, W).
        heatmaps (List[np.ndarray]): List of heatmap arrays for RT-DETR masks.

    Returns:
        List[List[Dict[int, List[List[int]]]]]: Segmentation masks for each abnormality in each image.

    Note:
        Process for each image:
        1. Generates and combines RT-DETR and YOLOv8LRP masks
        2. Restricts masks to detected bounding boxes
        3. Applies convex hull and Bezier smoothing
        4. Maps contour points to original image coordinates
    """
    if not abnormalitiess:
        return [[] for _ in range(len(input_images))]

    segmentation_results_batch = []  # List to store segmentation results for the batch

    for abnormalities, input_image, heatmap in zip(
        abnormalitiess, input_images, heatmaps
    ):
        if not abnormalities:
            segmentation_results_batch.append([])
            continue

        segmentation_results = []  # List to store segmentation masks for this image

        # Convert tensor to NumPy array (H, W, 3)
        transform = transforms.ToPILImage()
        image_pil = transform(input_image.squeeze(0))
        image_np = np.array(image_pil)

        # Generate RT-DETR and YOLOv8LRP masks
        tasks = [
            generate_smooth_binary_mask(heatmap, threshold=5, dilation_iter=10),
            yolo_lrp_mask(input_image),
        ]

        rt_smooth_mask, yolo_mask = await asyncio.gather(*tasks)

        # Resize masks to match image dimensions
        rt_mask_full = cv2.resize(
            rt_smooth_mask,
            (image_np.shape[1], image_np.shape[0]),
            interpolation=cv2.INTER_NEAREST,
        )
        yolo_mask_full = cv2.resize(
            yolo_mask,
            (image_np.shape[1], image_np.shape[0]),
            interpolation=cv2.INTER_NEAREST,
        )

        # Ensure both masks are non-empty
        if (
            rt_mask_full is None
            or yolo_mask_full is None
            or rt_mask_full.size == 0
            or yolo_mask_full.size == 0
        ):
            raise ValueError(
                "RT or YOLO mask is empty. Cannot proceed with segmentation."
            )

        # Combine RT-DETR and YOLOv8LRP masks
        combined_mask = combine_masks(rt_mask_full, yolo_mask_full)

        # Extract bounding boxes from abnormalities
        bbox_list = [[int(coord) for coord in abn["bbox"]] for abn in abnormalities]

        # Ensure bounding boxes exist
        if not bbox_list:
            segmentation_results_batch.append([])
            continue

        # Restrict the mask to detected bounding boxes
        restricted_mask = restrict_mask_to_bbox(combined_mask, bbox_list)

        # Process each bounding box separately
        for i, bbox in enumerate(bbox_list):
            x1, y1, x2, y2 = bbox

            # Extract region from restricted mask
            single_mask = np.zeros((y2 - y1, x2 - x1), dtype=restricted_mask.dtype)
            single_mask[:, :] = restricted_mask[y1:y2, x1:x2]

            # Apply convex hull to mask
            convex_mask = apply_convex_hull(single_mask)

            # Apply Bezier smoothing to convex mask
            single_mask = apply_bezier_smoothing(convex_mask)

            # Find contours with CHAIN_APPROX_NONE to get all points
            contours, _ = cv2.findContours(
                single_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE
            )

            # Map contour points to the original image coordinates
            contour_points_list = []
            for contour in contours:
                mapped_contour = []
                for point in contour:
                    x, y = point[0]
                    mapped_x = int(x + x1)
                    mapped_y = int(y + y1)
                    mapped_contour.extend([mapped_x, mapped_y])
                contour_points_list.append(mapped_contour)

            # Store segmentation in dictionary
            segmentation_results.append({"segmentation": contour_points_list})

        segmentation_results_batch.append(segmentation_results)

    return segmentation_results_batch


async def preprocess_image_xrv(image: torch.Tensor) -> torch.Tensor:
    """
    Preprocess chest X-ray images for the torchxrayvision model.

    Args:
        image (torch.Tensor): Input image tensor (1, 3, H, W) containing 8-bit image.

    Returns:
        torch.Tensor: Preprocessed image tensor (1, 512, 512).

    Note:
        Processing steps:
        1. Converts to numpy and scales to [0, 255]
        2. Normalizes to model-specific range
        3. Converts to grayscale
        4. Resizes to 512x512
    """
    img_np = image.cpu().numpy()
    img_np = img_np * 255

    # Normalize from 8-bit to the desired range and add a channel dimension.
    img_np = xrv.datasets.normalize(img_np, 255)

    # Remove the batch dimension and convert to grayscale.
    img_np = img_np.squeeze(0).mean(axis=0)

    img_np = img_np[None, ...]

    # Resize the image to 512x512.
    # Settings the warnings to be ignored
    transform = transforms.Compose([xrv.datasets.XRayResizer(512, engine="cv2")])
    img_np = transform(img_np)

    return torch.from_numpy(img_np).float()


async def compute_dice(mask: np.ndarray, bbox: tuple) -> float:
    """
    Compute Dice similarity coefficient between a binary mask and bounding box.

    Args:
        mask (np.ndarray): Binary mask of shape (H, W).
        bbox (tuple): Bounding box coordinates (xmin, ymin, xmax, ymax).

    Returns:
        float: Dice coefficient in range [0, 1].

    Note:
        ``Dice = 2 * |intersection| / (|mask| + |bbox|)``
    """
    xmin, ymin, xmax, ymax = bbox

    # Create a binary mask for the bbox
    bbox_mask = np.zeros_like(mask, dtype=np.uint8)
    bbox_mask[ymin:ymax, xmin:xmax] = 1  # Set bbox area to 1

    # Compute intersection and union
    intersection = np.logical_and(mask, bbox_mask).sum()
    dice = 2 * intersection / (mask.sum() + bbox_mask.sum())

    return dice


async def get_lung_segmentation_masks(input_images: List[torch.Tensor]) -> np.ndarray:
    """
    Generate segmentation masks for anatomical structures in chest X-rays.

    Args:
        input_images (List[torch.Tensor]): List of input images as tensors (1, 3, H, W).

    Returns:
        np.ndarray: Binary segmentation masks for 14 anatomical structures:
            0: Left Clavicle
            1: Right Clavicle
            2: Left Scapula
            3: Right Scapula
            4: Left Lung
            5: Right Lung
            6: Left Hilus Pulmonis
            7: Right Hilus Pulmonis
            8: Heart
            9: Aorta
            10: Facies Diaphragmatica
            11: Mediastinum
            12: Weasand
            13: Spine

    Note:
        - Uses pre-trained organ segmentation model
        - Resizes output masks to original image dimensions
        - Returns binary masks (0 or 1)
    """
    original_h, original_w = input_images[0].shape[2:]

    images = [await preprocess_image_xrv(input_image) for input_image in input_images]
    images = torch.stack(images)
    images = images.to(device)

    organ_segmentation_model = model_container.get_model("organ_segmentation_model")
    organ_segmentation_model.eval()

    with torch.inference_mode():
        preds = organ_segmentation_model(images)
        maskss = torch.sigmoid(preds)
        # Binarize masks and convert to NumPy.
        maskss = (maskss >= 0.5).byte().cpu().numpy()

    # Convert the masks to original resolution
    resized_maskss = []
    for masks in maskss:
        resized_masks = []
        for i in range(masks.shape[0]):
            resized_mask = cv2.resize(
                masks[i].astype(np.uint8),
                (original_w, original_h),
                interpolation=cv2.INTER_NEAREST,
            )
            resized_masks.append(resized_mask)
        resized_maskss.append(resized_masks)

    return resized_maskss


async def add_location_id(
    abnormalitiess: List[List[Dict[str, Any]]], maskss: List[np.ndarray]
) -> List[List[Dict[str, Any]]]:
    """
    Assign anatomical location IDs to detected abnormalities using segmentation masks.

    Args:
        abnormalitiess (List[List[Dict[str, Any]]]): List of abnormality dictionaries for each image.
        maskss (List[np.ndarray]): Segmentation masks for each image.

    Returns:
        List[List[Dict[str, Any]]]: Updated abnormality dictionaries with location_id field.

    Note:
        - Computes Dice coefficient between abnormality bbox and each anatomical mask
        - Assigns location_id based on highest overlap
        - Considers only relevant anatomical structures (indices 4-12)
    """
    for abnormalities, masks in zip(abnormalitiess, maskss):
        for abnormality in abnormalities:
            # Scale the bounding box coordinates.
            x1, y1, x2, y2 = abnormality["bbox"]
            x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

            best_mask_idx = None
            max_dice = 0.0

            # Iterate over the target masks (assuming relevant indices).
            # masks for 0-3 are 'Left Clavicle', 'Right Clavicle', 'Left Scapula', 'Right Scapula' and 13 is 'Spine'
            # which are not relevant for this task, hence starting from index 4 and ending at the second last index.
            for i in range(4, 13):
                mask = masks[i]
                dice = await compute_dice(mask, (x1, y1, x2, y2))
                if dice > max_dice:
                    max_dice = dice
                    best_mask_idx = i

            abnormality["location_id"] = best_mask_idx
    return abnormalitiess


async def get_tb_score(
    original_images: List[np.array], lungs_bbox_list: List[List[int]]
) -> List[float]:
    """
    Calculate tuberculosis probability scores for chest X-rays.

    Args:
        original_images (List[np.array]): List of original images.
        lungs_bbox_list (List[List[int]]): List of lung bounding boxes [x1, y1, x2, y2].

    Returns:
        List[float]: Tuberculosis probability scores [0, 1] for each image.

    Note:
        - Crops images to lung region
        - Applies histogram equalization
        - Uses temperature scaling for calibrated probabilities
        - Returns rounded scores to 2 decimal places
    """
    tb_classification_model = model_container.get_model("tb_classification_model")
    tb_classification_model.eval()

    transform = transforms.Compose(
        [
            transforms.ToTensor(),
            transforms.Resize((224, 224), antialias=True),
            HistogramEqualizationTransform(),
        ]
    )

    cropped_images = []
    for original_image, lungs_bbox in zip(original_images, lungs_bbox_list):
        x1, y1, x2, y2 = lungs_bbox
        original_image = (original_image - original_image.min()) / (
            original_image.max() - original_image.min() + 1e-6
        )
        cropped_image = original_image[x1:x2, y1:y2, :]
        # Convert to grayscale using ITU-R BT.601 coefficients
        cropped_image = (
            cropped_image[..., 0] * 0.299
            + cropped_image[..., 1] * 0.587
            + cropped_image[..., 2] * 0.114
        )
        cropped_image = transform(cropped_image)
        cropped_images.append(cropped_image)

    cropped_images = torch.stack(cropped_images, dim=0).repeat(1, 3, 1, 1).to(device)
    OPTIMAL_TEMPERATURE = 1.3809717893600464
    with torch.inference_mode():
        outputs = tb_classification_model(cropped_images)
        outputs = outputs / OPTIMAL_TEMPERATURE
        outputs = F.softmax(outputs, dim=1)

    probs = outputs[:, 1].cpu().numpy()
    probs = [round(float(prob), 2) for prob in probs]

    print(f"TB score: {probs}")

    return probs


async def generate_rtdetr_heatmap_with_mask(
    input_image: torch.Tensor,
    abnormalities: List[Dict[str, Any]],
    masks: np.ndarray,
    results: List[np.ndarray],
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate heatmap and overlay visualization for detected abnormalities.

    Args:
        input_image (torch.Tensor): Input image tensor (1, 3, 1024, 1024).
        abnormalities (List[Dict[str, Any]]): List of detected abnormalities with bboxes.
        masks (np.ndarray): Segmentation masks array.
        results (List[np.ndarray]): Feature maps from RT-DETR model.

    Returns:
        Tuple[np.ndarray, np.ndarray]:
            - Heatmap with color legend (1024, 1024, 3)
            - Overlay combining heatmap and input image (1024, 1024, 3)

    Note:
        - Combines feature maps from RT-DETR
        - Applies lung mask to restrict activation areas
        - Uses custom pink colormap for visualization
        - Adds color legend to output images
    """
    idx = []
    for abnormality in abnormalities:
        # Scale the bounding box coordinates.
        x1, y1, x2, y2 = abnormality["bbox"]
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

        for i in range(4, 13):
            dice = await compute_dice(masks[i], (x1, y1, x2, y2))
            if dice > 0:
                idx.append(i)

    # Take union of masks with the selected indices
    union_mask = np.zeros_like(masks[0], dtype=bool)
    for i in idx:
        union_mask = np.logical_or(union_mask, masks[i] > 0)

    # Apply morphological dilation to smooth the mask
    lung_mask = dilation(union_mask, square(5))

    resized_mean_maps = []
    for data in results:
        mean_feature_map = np.mean(data, axis=0)
        im = Image.fromarray(mean_feature_map.astype(np.float32), mode="F")
        im_resized = im.resize((1024, 1024), resample=Image.BILINEAR)
        resized_map = np.array(im_resized)
        resized_mean_maps.append(resized_map)

    stacked_maps = np.stack(resized_mean_maps, axis=0)
    global_mean_feature_map = np.mean(stacked_maps, axis=0)

    mean_val = np.mean(global_mean_feature_map)
    std_val = np.std(global_mean_feature_map)
    standard_normalized_global_mean = (global_mean_feature_map - mean_val) / std_val

    threshold = np.percentile(standard_normalized_global_mean, 60)

    # Load background image
    background_image = (
        input_image.squeeze(0).permute(1, 2, 0).cpu().numpy()
    )  # (1024, 1024, 3)

    if background_image.max() <= 1.0:
        background_image = (background_image * 255).astype(np.uint8)

    background_image = cv2.cvtColor(background_image, cv2.COLOR_RGB2BGR)

    bg_height, bg_width, _ = background_image.shape

    modified_map = standard_normalized_global_mean.copy()
    modified_map[modified_map >= threshold] *= 10  # Amplify high-intensity values

    # Convert lung mask to uint8 and resize
    lung_mask_resized = lung_mask.astype(np.uint8) * 255
    lung_mask_resized = cv2.resize(
        lung_mask_resized, (bg_width, bg_height), interpolation=cv2.INTER_NEAREST
    )

    # Apply lung mask to heatmap
    modified_map *= lung_mask

    # Resize heatmap to match background image
    heatmap_resized = cv2.resize(
        modified_map, (bg_width, bg_height), interpolation=cv2.INTER_LINEAR
    )

    # Normalize heatmap
    heatmap_norm = cv2.normalize(heatmap_resized, None, 0, 255, cv2.NORM_MINMAX).astype(
        np.uint8
    )

    # Custom colormap for heatmap
    custom_colormap = np.zeros((256, 1, 3), dtype=np.uint8)

    # Define starting and ending colors in BGR order.
    start_color = (0, 0, 0)  # Black
    end_color = (255, 51, 255)  # Converted from hex #FF4DFF

    # Fill the LUT by linearly interpolating between the two colors.
    for i in range(256):
        ratio = i / 255.0
        blue = int(start_color[0] + (end_color[0] - start_color[0]) * ratio)
        green = int(start_color[1] + (end_color[1] - start_color[1]) * ratio)
        red = int(start_color[2] + (end_color[2] - start_color[2]) * ratio)

        custom_colormap[i, 0, 0] = blue
        custom_colormap[i, 0, 1] = green
        custom_colormap[i, 0, 2] = red

    # Apply colormap
    heatmap_color = cv2.applyColorMap(heatmap_norm, custom_colormap)

    # Compute threshold dynamically
    nonzero_pixels = modified_map[modified_map > 0]
    min_intensity_threshold = (
        np.mean(nonzero_pixels) * 7 if len(nonzero_pixels) > 0 else 10
    )

    # Zero out low-intensity values inside the mask
    low_intensity_mask = heatmap_norm < min_intensity_threshold
    heatmap_color[low_intensity_mask] = [0, 0, 0]

    # Blend heatmap with background image
    overlay = cv2.addWeighted(background_image, 0.5, heatmap_color, 0.5, 0)

    # Add the color legend
    heatmap_with_legend = add_color_legend(heatmap_color, custom_colormap)
    overlay_with_legend = add_color_legend(overlay, custom_colormap)

    return heatmap_with_legend, overlay_with_legend


def boxes_to_tensor(boxes: Any) -> torch.Tensor:
    """
    Convert a Boxes object to a tensor of shape [N, 6] where each row is
    [x1, y1, x2, y2, confidence, class].
    """
    # Assuming boxes.xyxy is a tensor of shape (N, 4),
    # boxes.conf is a tensor of shape (N,) and boxes.cls is a tensor of shape (N,)
    xyxy = boxes.xyxy  # shape: [N, 4]
    conf = boxes.conf.unsqueeze(1)  # shape: [N, 1]
    cls = boxes.cls.unsqueeze(1)  # shape: [N, 1]
    return torch.cat([xyxy, conf, cls], dim=1)


async def rtdetr_infer(
    original_images: List[np.ndarray], maskss: List[np.ndarray]
) -> Tuple[List[Dict[str, Any]], List[np.ndarray], List[np.ndarray]]:
    """
    Performs RT-DETR model inference on an input image tensor, detects abnormalities from two models
    (detection_model and ribfracture_model), and generates corresponding heatmaps and overlays.

    Args:
        original_images (List[np.ndarray]): Input image array of shape (H, W, 3).
        maskss (List[np.ndarray]): Binary segmentation masks array of shape (N, H, W), where N represents the number of masks.

    Returns:
        Tuple[List[Dict[str, Any]], List[np.ndarray], List[np.ndarray]]:
            - List of dictionaries containing filtered detections
            - List of heatmap arrays
            - List of overlay image arrays
    """

    image_tensors = [
        torch.from_numpy(original_image).permute(2, 0, 1).unsqueeze(0).float() / 255.0
        for original_image in original_images
    ]

    # Load models
    detection_model = model_container.get_model("detection_model")
    ribfracture_model = model_container.get_model("ribfracture_model")

    detection_model.eval()
    ribfracture_model.eval()

    # Define the new combined class names list
    # combined_class_labels = [
    #     "Lung Nodules",
    #     "Consolidation",
    #     "Pleural Effusion",
    #     "Opacity",
    #     "Rib Fractures",
    #     "Pneumothorax",
    #     "Cardiomegaly",
    # ]

    # Run inference on both models
    with torch.inference_mode():
        results1 = detection_model(original_images, augment=True, visualize=False)
        results2 = ribfracture_model(
            original_images, augment=True, visualize=False, conf=0.25
        )

    # TODO: Handle results2 as well
    visualization_features_batch = []
    for i in range(len(original_images)):
        visualization_features = [feature[i] for feature in results1[-1]]
        visualization_features_batch.append(visualization_features)

    detectionss = []
    heatmaps = []
    overlays = []

    for result1, result2, masks, image_tensor, visualization_features in zip(
        results1[:-1],
        results2[:-1],
        maskss,
        image_tensors,
        visualization_features_batch,
    ):
        # Initialize the dictionary to store results
        detections = []

        # Process detection results from detection_model
        for box in result1.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()  # Bounding box coordinates
            conf = box.conf[0].item()  # Confidence score
            cls = int(box.cls[0].item())  # Class index

            # Adjust abnormality_id to match the new combined order
            # Since the detection model classes are in the first five positions of combined_class_labels
            abnormality_id = cls  # No change needed since it directly maps
            if abnormality_id >= 4:
                abnormality_id += 1

            detection_entry = {
                "abnormality_id": abnormality_id,
                "confidence": round(conf, 2),
                "bbox": [x1, y1, x2, y2],
            }
            detections.append(detection_entry)

        # Process detection results from ribfracture_model
        for box in result2.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()  # Bounding box coordinates
            conf = box.conf[0].item()  # Confidence score
            cls = int(box.cls[0].item())  # Class index

            # Rib fracture model has only one class, we map it to index 4 in combined_class_labels
            abnormality_id = 4  # "Rib Fractures" is at index 4

            detection_entry = {
                "abnormality_id": abnormality_id,
                "confidence": round(conf, 2),
                "bbox": [x1, y1, x2, y2],
            }
            detections.append(detection_entry)

        # ----- Class-wise NMS Implementation -----
        # Group detections by abnormality_id (class)
        detections_by_class = collections.defaultdict(list)
        for det in detections:
            detections_by_class[det["abnormality_id"]].append(det)

        final_detections = []
        iou_threshold = 0.5  # Adjust the IoU threshold as needed

        # Process each group separately
        for cls_id, dets in detections_by_class.items():
            if len(dets) == 0:
                continue
            # Create tensors for bounding boxes and confidence scores
            boxes = torch.tensor([d["bbox"] for d in dets])
            scores = torch.tensor([d["confidence"] for d in dets])
            # Apply NMS for the current class group
            keep_indices = ops.nms(boxes, scores, iou_threshold)
            # Add the detections that survived NMS
            for i in keep_indices:
                final_detections.append(dets[i])

        # Replace original detections with the NMS-filtered ones
        detections = final_detections

        # Clamp all the bboxes
        for det in detections:
            # Clamp bbox values between 0 and 1024
            det["bbox"] = [max(0, min(1024, x)) for x in det["bbox"]]

        detectionss.append(detections)

        # Generate heatmap and overlay
        heatmap, overlay = await generate_rtdetr_heatmap_with_mask(
            input_image=image_tensor,
            abnormalities=detections,
            masks=masks,
            results=visualization_features,
        )
        heatmaps.append(heatmap)
        overlays.append(overlay)

    return detectionss, heatmaps, overlays


async def get_ctr(
    original_images: np.ndarray, lungs_bbox_list: list, maskss: np.ndarray
) -> tuple[List[np.ndarray], List[float]]:
    """
    Calculate the cardiothoracic ratio (CTR) for a batch of chest X-ray images.

    Args:
        original_images (np.ndarray): Array of original chest X-ray images.
        lungs_bbox_list (list): List of bounding boxes for the lungs in each image.
        maskss (np.ndarray): Array of segmentation masks for anatomical structures.

    Returns:
        tuple[List[np.ndarray], List[float]]:
            - List of annotated images with CTR visualization.
            - List of calculated CTR values.
    """

    cardiothoracic_ratios = []
    output_ctr_images = []
    for i, (original_image, lungs_bbox, masks) in enumerate(
        zip(original_images, lungs_bbox_list, maskss)
    ):
        heart_bbox = []

        # Get heart bbox
        heart_mask = masks[8]  # Heart mask
        try:
            heart_bbox = get_bbox_from_mask(heart_mask)
        except Exception as e:
            print(f"Error getting heart bbox: {e}")
            pass

        # Calculate the cardiothoracic ratio if both heart and chest detections are available
        if heart_bbox and lungs_bbox:
            heart_width = heart_bbox[2] - heart_bbox[0]  # x-direction width of heart
            chest_width = lungs_bbox[2] - lungs_bbox[0]  # x-direction width of chest
            # If it is not able to find the chest width it avoids division by zero
            if chest_width != 0:
                cardiothoracic_ratio = heart_width / chest_width

            # Convert to BGR for OpenCV if needed
            if original_image.shape[-1] == 1:
                original_image = cv2.cvtColor(original_image, cv2.COLOR_GRAY2BGR)
            elif original_image.shape[-1] == 3:
                original_image = cv2.cvtColor(original_image, cv2.COLOR_RGB2BGR)

            # Draw double arrows representing heart and chest widths
            cv2.arrowedLine(
                original_image,
                (int(heart_bbox[0]), int(0.98 * heart_bbox[3])),
                (int(heart_bbox[2]), int(0.98 * heart_bbox[3])),
                (255, 0, 0),
                2,
                tipLength=0.05,
            )
            cv2.arrowedLine(
                original_image,
                (int(heart_bbox[2]), int(0.98 * heart_bbox[3])),
                (int(heart_bbox[0]), int(0.98 * heart_bbox[3])),
                (255, 0, 0),
                2,
                tipLength=0.05,
            )

            cv2.arrowedLine(
                original_image,
                (int(lungs_bbox[0]), int(0.95 * lungs_bbox[3])),
                (int(lungs_bbox[2]), int(0.95 * lungs_bbox[3])),
                (0, 255, 0),
                2,
                tipLength=0.05,
            )
            cv2.arrowedLine(
                original_image,
                (int(lungs_bbox[2]), int(0.95 * lungs_bbox[3])),
                (int(lungs_bbox[0]), int(0.95 * lungs_bbox[3])),
                (0, 255, 0),
                2,
                tipLength=0.05,
            )

            # Annotate text
            ratio_text = f"Cardiothoracic Ratio: {cardiothoracic_ratio:.2f}"

            # Determine condition
            if cardiothoracic_ratio < 0.4:
                condition_text = "Possible Abnormal"
                text_color = (0, 165, 255)
            elif 0.4 <= cardiothoracic_ratio <= 0.51:
                condition_text = "Normal"
                text_color = (0, 255, 0)  # Green
            elif 0.51 < cardiothoracic_ratio < 0.56:
                condition_text = "Possible Abnormal"
                text_color = (0, 165, 255)  # Orange
            else:
                condition_text = "Highly Abnormal (Possible Cardiomegaly)"
                text_color = (0, 0, 255)  # Red

            # Add text annotation
            cv2.putText(
                original_image,
                ratio_text,
                (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 255),
                2,
            )
            cv2.putText(
                original_image,
                condition_text,
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                text_color,
                2,
            )

            # Wrap text properly
            description_text = (
                "Note: The cardiothoracic ratio (CTR) is ideally measured using PA (posteroanterior) chest radiographs. "
                "For hemodialysis patients, a CTR > 0.55 is linked to a greater risk of dying within two years."
            )

            # Split text into lines
            wrapped_text = []
            words = description_text.split(" ")
            current_line = ""
            for word in words:
                temp = current_line + " " + word if current_line else word
                text_size = cv2.getTextSize(temp, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
                if text_size[0] < original_image.shape[1] - 40:
                    current_line = temp
                else:
                    wrapped_text.append(current_line)
                    current_line = word
            wrapped_text.append(current_line)

            # Display wrapped text
            y_offset = 120
            for line in wrapped_text:
                cv2.putText(
                    original_image,
                    line,
                    (20, y_offset),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (255, 255, 255),
                    2,
                )
                y_offset += 30

            # Convert back to RGB before returning
            original_image = cv2.cvtColor(original_image, cv2.COLOR_BGR2RGB)
        else:
            print("Heart or chest not detected. Skipping CTR calculation.")
            original_image, cardiothoracic_ratio = (
                None,
                0.0,
            )  # Return default values if no valid boxes found

        output_ctr_images.append(original_image)
        cardiothoracic_ratios.append(float(round(cardiothoracic_ratio, 2)))

    return output_ctr_images, cardiothoracic_ratios


async def get_bone_suppressed_resnet(
    input_images: List[torch.Tensor], is_inverted_list: List[bool]
) -> np.ndarray:
    """
    Generate bone-suppressed versions of chest X-ray images.

    Args:
        input_images (List[torch.Tensor]): List of input images, each with shape (1, 3, 1024, 1024).
        is_inverted_list (List[bool]): List indicating whether each image is inverted.

    Returns:
        np.ndarray: Bone-suppressed images with shape (N, 1024, 1024, 3) and dtype uint8.

    Note:
        - Assumes input images are in normal (non-inverted) format
        - Inverts images before model processing if needed
        - Returns images in RGB format with values in range [0, 255]
        - Output is converted back to match input image orientation
    """
    input_images = torch.cat(input_images, dim=0)
    bone_supression_model = model_container.get_model("bone_suppression_model")
    # Preprocess the input image
    input_images = process_image_bs(input_images)

    for i in range(len(input_images)):
        if not is_inverted_list[i]:
            input_images[i] = 1 - input_images[i]
    with torch.no_grad():
        bs_images = bone_supression_model(input_images.to(device))
    bs_images = bs_images.cpu().numpy()
    bs_images = np.clip(bs_images, 0, 1)
    # Return the bone supressed image by changing shape of it from [1024,1024] to [1024,1024,3]
    bs_images = 1 - bs_images
    bs_images = np.repeat(bs_images[:, 0, :, :, np.newaxis], 3, axis=-1)
    bs_images = (bs_images * 255).astype(np.uint8)

    return bs_images


async def get_clahe_batch(
    input_images: List[torch.Tensor], is_inverted_list: List[bool]
) -> np.ndarray:
    """
    Apply Contrast Limited Adaptive Histogram Equalization (CLAHE) to a batch of images.

    Args:
        input_images (List[torch.Tensor]): List of input images, each with shape (1, 3, H, W).
        is_inverted_list (List[bool]): List indicating whether each image is inverted.

    Returns:
        List[np.ndarray]: List of CLAHE-enhanced images as uint8 arrays with shape (H, W, 3).

    Note:
        - Handles image inversion before applying CLAHE
        - Processes each image independently and asynchronously
        - Returns images in RGB format with values in range [0, 255]
    """
    clahe_image_tasks = []
    for i in range(len(input_images)):
        if is_inverted_list[i]:
            clahe_image_tasks.append(to_image_array(1 - input_images[i]))
        else:
            clahe_image_tasks.append(to_image_array(input_images[i]))
    return await asyncio.gather(*clahe_image_tasks)


async def batch_inference(input_data: List[dict]) -> List[dict]:
    """Perform comprehensive chest X-ray analysis on a batch of images.

    Args:
        input_data (List[dict]): List of dictionaries containing image information.
            Each dictionary must contain:

            - **url** (*str*): URL of the image (required).

            Optional keys:

            - **isInverted** (*bool*): Manual flag for image inversion.

    Returns:
        List[dict]: List of analysis results for each image. Each dictionary includes:

        - **image_id** (*str*): Unique identifier.
        - **is_inverted** (*bool*): Whether the image was processed as inverted.
        - **lungs_found** (*bool*): Whether lungs were detected.
        - **lungs_bbox** (*List[int]*): Lung bounding box coordinates.
        - **abnormalities** (*List[Dict]*): Detected abnormalities.
        - **is_normal** (*bool*): Whether the image is classified as normal.
        - **tb_score** (*float*): Tuberculosis probability.
        - **heatmap** (*str*): URL to heatmap visualization.
        - **ctr** (*Dict*): Cardiothoracic ratio information:

          - **image** (*str*): URL to CTR visualization.
          - **ratio** (*float*): Calculated CTR value.

        - **bone_suppressed** (*str*): URL to bone-suppressed image.
        - **clahe** (*str*): URL to contrast-enhanced image.
        - **error** (*str*): Error message if processing failed.

    Raises:
        ValueError: If input data list is empty or no valid images were processed.

    Notes:
        **Processing pipeline:**

        1. **Image loading and preprocessing**

           - Loads images from URLs.
           - Resizes to 1024x1024.
           - Applies preprocessing transforms.

        2. **Core analysis**

           - Inversion detection.
           - Lung detection.
           - Abnormality detection.
           - Tuberculosis scoring.
           - Bone suppression.
           - Segmentation.
           - Cardiothoracic ratio calculation.

        3. **Result compilation**

           - Generates visualizations.
           - Uploads results to S3.
           - Compiles output dictionaries.

        **Error handling:**

        - Individual image failures do not stop batch processing.
        - Errors are recorded in the output dictionary.
        - Processing continues where possible.
        - Fallback values are provided for failed computations.
    """

    if not input_data:
        raise ValueError("Input data list cannot be empty")

    batch_size = len(input_data)
    outputs = [
        {
            "image_id": None,
            "is_inverted": None,
            "lungs_found": None,
            "lungs_bbox": None,
            "abnormalities": None,
            "is_normal": None,
            "tb_score": None,
            "heatmap": None,
            "ctr": None,
            "bone_suppressed": None,
            "clahe": None,
            "error": None,  # Add error field
            "converted_png":None
        }
        for _ in range(batch_size)
    ]
    # s3_uploader = S3Uploader()
    s3_uploader = LocalUploader(base_path="/data/output")  # You can customize this path


    try:
        # Process images in batch
        original_images = []
        image_uuids = []
        for i in range(batch_size):
            try:
                image_uuid = str(uuid.uuid4())
                outputs[i]["image_id"] = image_uuid

                # Get image asynchronously
                original_image = await get_image(input_data[i])
                original_image = cv2.resize(
                    original_image, (1024, 1024), interpolation=cv2.INTER_LINEAR
                )
                original_images.append(original_image)
                image_uuids.append(image_uuid)
            except Exception as e:
                outputs[i]["error"] = f"Failed to process image: {str(e)}"
                continue

        if not original_images:
            raise ValueError("No valid images were processed")

        # Preprocess images
        input_images = []
        for i, original_image in enumerate(original_images):
            try:
                input_image = await preprocessing(original_image)
                input_images.append(input_image)
            except Exception as e:
                outputs[i]["error"] = f"Preprocessing failed: {str(e)}"
                continue

        # Continue only if we have valid preprocessed images
        if not input_images:
            raise ValueError("No images survived preprocessing")

        try:
            is_inverted_list = await check_inverted(input_images, input_data)
        except Exception as e:
            print(f"Inversion check failed: {e}")
            is_inverted_list = [False] * len(input_images)

        for i in range(len(input_images)):
            try:
                if is_inverted_list[i]:
                    input_images[i] = 1 - input_images[i]

                outputs[i]["is_inverted"] = bool(is_inverted_list[i])

                # Validate input
                is_valid_input = await check_validation(input_images[i])
                if not is_valid_input:
                    outputs[i]["lungs_found"] = False
                    outputs[i]["error"] = "Invalid input image"
                    continue
            except Exception as e:
                outputs[i]["error"] = f"Validation failed: {str(e)}"
                continue

        # Get lung bounding box with error handling
        try:
            lungs_bbox_list = await get_lung_bbox(input_images)
        except Exception as e:
            print(f"Lung detection failed: {e}")
            lungs_bbox_list = [None] * len(input_images)

        # Launch independent tasks with error handling
        result_tasks = []

        # Add tasks with error handling wrappers
        async def safe_task(coro, error_value):
            try:
                return await coro
            except Exception as e:
                print(f"Task failed: {e}")
                return error_value

        result_tasks.extend(
            [
                safe_task(
                    get_tb_score(original_images, lungs_bbox_list), [0.0] * batch_size
                ),
                safe_task(
                    get_bone_suppressed_resnet(input_images, is_inverted_list), None
                ),
            ]
        )

        # Wait for masks with error handling
        try:
            maskss = await get_lung_segmentation_masks(input_images)
        except Exception as e:
            print(f"Segmentation failed: {e}")
            maskss = [None] * len(input_images)

        # Add dependent tasks with error handling
        result_tasks.extend(
            [
                safe_task(
                    get_ctr(original_images, lungs_bbox_list, maskss),
                    (None, [0.0] * len(input_images)),
                ),
                safe_task(rtdetr_infer(original_images, maskss), ([], [], [])),
            ]
        )

        # Wait for RTDETR results
        try:
            abnormalitiess, heatmaps, overlays = await result_tasks.pop()
        except Exception as e:
            print(f"RTDETR inference failed: {e}")
            abnormalitiess, heatmaps, overlays = [], [], []

        # Add remaining tasks
        result_tasks.extend(
            [
                safe_task(add_segmentation(abnormalitiess, input_images, heatmaps), []),
                safe_task(add_location_id(abnormalitiess, maskss), []),
                safe_task(get_clahe_batch(input_images, is_inverted_list), []),
            ]
        )

        # Gather all results
        try:
            results = await asyncio.gather(*result_tasks)
            tb_scores, bone_suppressed_images, ctr_results, *other_results = results
            abnormalitiess_with_segmentation, abnormalitiess_with_location, clahes = (
                other_results
            )
        except Exception as e:
            print(f"Failed to gather results: {e}")
            return outputs

        # Unpack CTR results safely
        ctrs = []
        ctr_ratios = []
        for i in range(batch_size):
            ctr = ctr_results[0][i]
            ctr_ratio = ctr_results[1][i]
            ctrs.append(ctr)
            ctr_ratios.append(ctr_ratio)

        # Update abnormalities safely
        try:
            for (
                abnormalities,
                abnormalities_with_segmentation,
                abnormalities_with_location,
            ) in zip(
                abnormalitiess,
                abnormalitiess_with_segmentation,
                abnormalitiess_with_location,
            ):
                for i, abnormality in enumerate(abnormalities):
                    if i < len(abnormalities_with_segmentation):
                        abnormality.update(abnormalities_with_segmentation[i])
                    if i < len(abnormalities_with_location):
                        abnormality.update(abnormalities_with_location[i])
        except Exception as e:
            print(f"Failed to update abnormalities: {e}")

        # Prepare upload data
        upload_tasks = []
        for i in range(len(image_uuids)):
            upload_tasks.append(
                s3_uploader.upload_array(overlays[i], image_uuids[i], "global-heatmap")
            )
            upload_tasks.append(
                s3_uploader.upload_array(
                    bone_suppressed_images[i], image_uuids[i], "bone-suppressed"
                )
            )
            upload_tasks.append(
                s3_uploader.upload_array(clahes[i], image_uuids[i], "contrast-enhanced")
            )
            upload_tasks.append(
                s3_uploader.upload_array(ctrs[i], image_uuids[i], "ct-ratio")
            )

        # Execute all upload tasks
        upload_results = await asyncio.gather(*upload_tasks, return_exceptions=True)

        # Reshape results back into groups of 4 (one for each type of image)
        upload_results = [
            upload_results[i : i + 4] for i in range(0, len(upload_results), 4)
        ]

        # Update output dictionary safely
        for i in range(batch_size):
            if not outputs[i].get("error"):  # Only update if no previous errors
                try:
                    outputs[i].update(
                        {
                            "lungs_found": bool(lungs_bbox_list[i] is not None),
                            "lungs_bbox": lungs_bbox_list[i],
                            "abnormalities": (
                                abnormalitiess[i] if i < len(abnormalitiess) else []
                            ),
                            "is_normal": (
                                len(abnormalitiess[i]) == 0
                                if i < len(abnormalitiess)
                                else True
                            ),
                            "tb_score": tb_scores[i],
                            "heatmap": (upload_results[i][0]),
                            "bone_suppressed": (upload_results[i][1]),
                            "clahe": (upload_results[i][2]),
                            "ctr": {
                                "image": (upload_results[i][3]),
                                "ratio": ctr_ratios[i],
                            
                            },
                            "converted_png": input_data[i].get("url", "").replace("file://", ""),
                        }
                    )
                except Exception as e:
                    outputs[i]["error"] = f"Failed to update output: {str(e)}"

        return outputs

    except Exception as e:
        print(f"Critical inference error: {e}")
        # Set error for all outputs that don't already have an error
        for output in outputs:
            if not output.get("error"):
                output["error"] = f"Critical inference error: {str(e)}"
        return outputs
