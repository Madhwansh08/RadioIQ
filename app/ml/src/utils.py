import gc
import io
import os
from typing import List

import boto3
import cv2
import numpy as np
import torch
from PIL import Image
from torchvision import transforms

import uuid
from datetime import datetime
import pydicom
import sys
from icecream import ic
from tqdm import tqdm

class DICOMBatchProcessor:
    def __init__(self, output_folder: str, image_size=(1024, 1024)):
        """
        Initializes the batch processor for converting DICOM images to PNG.

        Args:
            input_folder (str): Path to the folder containing DICOM images.
            output_folder (str): Path to save the converted PNG images.
            image_size (tuple): Target size (H, W) for the output images.
        """
        self.output_folder = output_folder
        self.image_size = image_size
        self.converter = DICOMConverter()

        os.makedirs(self.output_folder, exist_ok=True)

    def convert_batch(self, input_image) -> str:
        """
        Converts a DICOM or regular image to resized PNG format.

        Returns:
            str: Path to converted/resized PNG image.
        """
        image_uuid = str(uuid.uuid4())  # Generate UUID
        png_filename = f"{image_uuid}.png"
        png_path = os.path.join(self.output_folder, png_filename)
        # png_filename = os.path.splitext(os.path.basename(input_image))[0] + ".png"
        # png_path = os.path.join(self.output_folder, png_filename)
        self.converter.convert_dicom_to_png(input_image, png_path)
        return png_path



class DICOMConverter:
    def __init__(self, output_size=(1024, 1024)):
        """Initialize the converter with the desired output image size."""
        self.output_size = output_size

    # def convert_dicom_to_png(self, dicom_path: str, output_path: str):
    #     """Convert a single DICOM file to PNG format with resizing."""
    #     pd_image = pydicom.dcmread(dicom_path)
    #     image = pd_image.pixel_array.astype(np.float32)

    #     # Normalize pixel values to [0, 1]
    #     image = (image - image.min()) / (image.max() - image.min())

    #     # Handle MONOCHROME1 (inverted grayscale)
    #     if pd_image[0x28, 0x04].value == 'MONOCHROME1':
    #         image = 1 - image

    #     # Convert to 8-bit grayscale
    #     image = (image * 255).astype(np.uint8)
    #     image = Image.fromarray(image)

    #     # Resize to 1024x1024 while maintaining aspect ratio
    #     image = image.resize(self.output_size, Image.LANCZOS)

    #     # Ensure output directory exists
    #     os.makedirs(os.path.dirname(output_path), exist_ok=True)

    #     # Save image as PNG
    #     image.save(output_path)

    #     # Print image details
    #     file_size = os.path.getsize(output_path) / 1024  # KB
    #     print(f"Saved: {output_path} | Size: {file_size:.2f} KB | Resolution: {image.size}")

    def convert_dicom_to_png(self, input_path: str, output_path: str):
        """
        Convert and resize DICOM or standard image to PNG.

        Args:
            input_path (str): Path to input file (.dcm, .png, .jpg, etc.)
            output_path (str): Path where the resized PNG will be saved.
        """
        ext = os.path.splitext(input_path)[1].lower()

        if ext in (".dcm", ".dicom", ".dic"):
            # DICOM conversion
            pd_image = pydicom.dcmread(input_path)
            image = pd_image.pixel_array.astype(np.float32)

            # Normalize and invert if MONOCHROME1
            image = (image - image.min()) / (image.max() - image.min())
            if pd_image[0x28, 0x04].value == 'MONOCHROME1':
                image = 1 - image

            image = (image * 255).astype(np.uint8)
            image = Image.fromarray(image).resize(self.output_size, Image.LANCZOS)

        else:
            # Standard image handling
            image = Image.open(input_path).convert("RGB")
            image = image.resize(self.output_size, Image.LANCZOS)

        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Save as PNG
        image.save(output_path)

        file_size = os.path.getsize(output_path) / 1024  # KB
        print(f"Saved: {output_path} | Size: {file_size:.2f} KB | Resolution: {image.size}")

    # def convert_dicom_folder(self, input_folder: str, output_folder: str):
    #     """Convert all DICOM files in a folder (including subfolders) to PNG."""
    #     for root, _, files in os.walk(input_folder):
    #         for file in tqdm(files, desc="Processing DICOMs"):
    #             if file.endswith((".dcm", ".dicom", ".dic")):
    #                 dicom_path = os.path.join(root, file)
    #                 relative_path = os.path.relpath(dicom_path, input_folder)
    #                 output_path = os.path.join(output_folder, relative_path)
    #                 output_path = os.path.splitext(output_path)[0] + ".png"

    #                 # Convert and save
    #                 self.convert_dicom_to_png(dicom_path, output_path)
    def convert_dicom_folder(self, input_folder: str, output_folder: str):
        for root, _, files in os.walk(input_folder):
            for file in tqdm(files, desc="Processing Images"):
                input_path = os.path.join(root, file)
                relative_path = os.path.relpath(input_path, input_folder)
                output_path = os.path.join(output_folder, os.path.splitext(relative_path)[0] + ".png")

                self.convert_dicom_to_png(input_path, output_path)

               


class CLAHE:
    """
    Contrast Limited Adaptive Histogram Equalization (CLAHE) transform for PyTorch tensors.

    Args:
        clip_limit (float, optional): Threshold for contrast limiting. Defaults to 2.0.
        grid_size (tuple, optional): Size of grid for histogram equalization. Defaults to (8, 8).

    Note:
        Implements __call__ method for direct use in transform pipelines.
    """

    def __init__(self, clip_limit=2.0, grid_size=(8, 8)):
        self.clip_limit = clip_limit
        self.grid_size = grid_size
        self.clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=grid_size)

    def __call__(self, img_tensor: torch.Tensor) -> torch.Tensor:
        """
        Apply CLAHE to input tensor.

        Args:
            img_tensor (torch.Tensor): Input image tensor in range [0, 1].

        Returns:
            torch.Tensor: CLAHE-enhanced image tensor.
        """
        img_tensor_scaled = (img_tensor * 255).to(torch.uint8)
        img = img_tensor_scaled.squeeze().numpy()
        img_clahe = self.clahe.apply(img)
        img_tensor = transforms.ToTensor()(img_clahe)
        img_tensor = img_tensor.float()
        return img_tensor


class HistogramEqualizationTransform:
    """
    Histogram equalization transform for PyTorch tensors.

    Implements histogram equalization using CDF-based mapping.
    """

    def __call__(self, img_tensor: torch.Tensor) -> torch.Tensor:
        """
        Apply histogram equalization to input tensor.

        Args:
            img_tensor (torch.Tensor): Input image tensor in range [0, 1].

        Returns:
            torch.Tensor: Histogram-equalized image tensor.
        """
        img_tensor_scaled = (img_tensor * 255).to(torch.int64)
        hist = torch.histc(img_tensor_scaled.float(), bins=256, min=0, max=255)
        cdf = torch.cumsum(hist, dim=0)
        cdf_normalized = cdf / cdf[-1]
        img_equalized = cdf_normalized[img_tensor_scaled].reshape(img_tensor.shape)
        return img_equalized


class S3Uploader:
    """
    Handles asynchronous upload of images to AWS S3.

    Args:
        content_type (str, optional): Content type for uploaded files.
            Defaults to "application/octet-stream".

    Note:
        Requires AWS credentials in environment variables:
        - AWS_ACCESS_KEY_ID
        - AWS_SECRET_ACCESS_KEY
        - AWS_S3_BUCKET
        - AWS_S3_REGION
    """

    def __init__(self, content_type="application/octet-stream"):
        self.AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
        self.AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET")
        self.AWS_REGION = os.getenv("AWS_S3_REGION")
        self.content_type = content_type
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=self.AWS_ACCESS_KEY,
            aws_secret_access_key=self.AWS_SECRET_KEY,
            region_name=self.AWS_REGION,
        )

    async def upload_array(
        self, image_array: np.ndarray, image_uuid: str, folder: str = ""
    ) -> str:
        """
        Upload a numpy array as PNG to AWS S3.

        Args:
            image_array (np.ndarray): Image array of shape (H, W, 3).
            image_uuid (str): Unique identifier for the image.
            folder (str, optional): Folder name inside the bucket. Defaults to "".

        Returns:
            str: S3 URof the uploaded file, or None if upload fails.

        Raises:
            ValueError: If image encoding fails.
        """
        try:
            success, encoded_image = cv2.imencode(".png", image_array)
            if not success:
                raise ValueError("Failed to encode image")

            image_bytes = io.BytesIO(encoded_image.tobytes())
            folder = folder.rstrip("/")
            object_name = (
                f"{folder}/{image_uuid}.png" if folder else f"{image_uuid}.png"
            )

            self.s3_client.upload_fileobj(
                image_bytes,
                self.S3_BUCKET_NAME,
                object_name,
                ExtraArgs={"ContentType": "image/png"},
            )

            file_url = f"https://{self.S3_BUCKET_NAME}.s3.{self.AWS_REGION}.amazonaws.com/{object_name}"
            return file_url

        except Exception as e:
            print(f"Error uploading array to S3: {e}")
            return None


def add_color_legend(
    image: np.ndarray,
    colormap=cv2.COLORMAP_INFERNO,
    legend_size=(10, 200),
    position=(10, 10),
) -> np.ndarray:
    """
    Add a vertical color legend to an image.

    Args:
        image (np.ndarray): Input image array.
        colormap (int, optional): OpenCV colormap. Defaults to cv2.COLORMAP_INFERNO.
        legend_size (tuple, optional): Width and height of legend. Defaults to (10, 200).
        position (tuple, optional): X,Y position of legend. Defaults to (10, 10).

    Returns:
        np.ndarray: Image with added color legend.

    Note:
        Adds "High" and "Low" labels at top and bottom of legend.
    """
    legend_width, legend_height = legend_size
    x, y = position

    gradient = np.linspace(1, 0, legend_height).reshape(-1, 1)
    gradient = np.tile(gradient, (1, legend_width))
    gradient = (gradient * 255).astype(np.uint8)

    color_legend = cv2.applyColorMap(gradient, colormap)

    # Overlay the legend on the image
    image_with_legend = image.copy()
    image_with_legend[y : y + legend_height, x : x + legend_width] = color_legend

    # Add labels ("High" at top, "Low" at bottom)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    thickness = 1
    text_color = (255, 255, 255)

    cv2.putText(
        image_with_legend,
        "High",
        (x + legend_width + 5, y + 10),
        font,
        font_scale,
        text_color,
        thickness,
        cv2.LINE_AA,
    )
    cv2.putText(
        image_with_legend,
        "Low",
        (x + legend_width + 5, y + legend_height - 5),
        font,
        font_scale,
        text_color,
        thickness,
        cv2.LINE_AA,
    )

    return image_with_legend


class LocalUploader:
    """
    Saves images locally instead of uploading to S3.

    Args:
        base_path (str): Base directory where images will be saved.
        create_timestamp_folder (bool): Whether to organize images by timestamp folders.
    """

    def __init__(self, base_path="./output", create_timestamp_folder=True):
        self.base_path = base_path
        self.create_timestamp_folder = create_timestamp_folder
        os.makedirs(self.base_path, exist_ok=True)

    async def upload_array(self, image_array: np.ndarray, image_uuid: str, folder: str = "") -> str:
        """
        Save a numpy array as PNG to a local directory.

        Args:
            image_array (np.ndarray): Image array of shape (H, W, 3).
            image_uuid (str): Unique identifier for the image.
            folder (str, optional): Subfolder name inside base directory.

        Returns:
            str: File path of the saved image.
        """
        try:
            # Validate image shape
            if image_array is None or not isinstance(image_array, np.ndarray):
                raise ValueError("Invalid image array")

            # Construct local path
            folder_path = os.path.join(self.base_path, folder.strip("/"))
            if self.create_timestamp_folder:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                folder_path = os.path.join(folder_path, timestamp)

            os.makedirs(folder_path, exist_ok=True)

            file_path = os.path.join(folder_path, f"{image_uuid}.png")

            # Save image
            success = cv2.imwrite(file_path, image_array)
            if not success:
                raise ValueError(f"Failed to write image to {file_path}")

            print(f"Image saved locally at: {file_path}")
            return f"{file_path}"

        except Exception as e:
            print(f"Error saving image locally: {e}")
            return None


class ClaheTransform:
    """
    CLAHE transform for PIL Images.

    Implements contrast-limited adaptive histogram equalization using OpenCV.
    """

    def __call__(self, img: Image.Image) -> Image.Image:
        """
        Apply CLAHE to input PIL Image.

        Args:
            img (Image.Image): Input PIL Image.

        Returns:
            Image.Image: CLAHE-enhanced image.
        """
        img_np = np.array(img)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        img_np = clahe.apply(img_np)
        return Image.fromarray(img_np)


def process_image_bs(image_tensor: torch.Tensor) -> torch.Tensor:
    """
    Process image tensor for bone suppression model.

    Args:
        image_tensor (torch.Tensor): Input tensor of shape [B, 3, 1024, 1024].

    Returns:
        torch.Tensor: Processed tensor of shape [B, 1, 1024, 1024].

    Raises:
        TypeError: If input is not a torch.Tensor.
        ValueError: If input tensor has incorrect shape.

    Note:
        Converts RGB to grayscale using ITU-R BT.601 coefficients.
    """
    if not isinstance(image_tensor, torch.Tensor):
        raise TypeError("Input must be a torch.Tensor")

    if (
        len(image_tensor.shape) != 4
        or image_tensor.shape[2:] != (1024, 1024)
        or image_tensor.shape[1] != 3
    ):
        raise ValueError("Expected input tensor shape [B, 3, 1024, 1024]")

    grayscale_weights = (
        torch.tensor([0.299, 0.587, 0.114]).view(1, 3, 1, 1).to(image_tensor.device)
    )
    return (image_tensor * grayscale_weights).sum(dim=1, keepdim=True)


def get_bbox_from_mask(mask: np.ndarray) -> List[int]:
    """
    Extract bounding box coordinates from a binary mask.

    Args:
        mask (np.ndarray): Binary mask with shape (H, W).

    Returns:
        List[int]: Bounding box coordinates [x_min, y_min, x_max, y_max].

    Note:
        Returns coordinates of the minimum rectangle containing all non-zero pixels.
    """
    rows = mask.any(1)
    cols = mask.any(0)
    y_min, y_max = np.where(rows)[0][[0, -1]]
    x_min, x_max = np.where(cols)[0][[0, -1]]
    return [x_min, y_min, x_max, y_max]


def cleanup_gpu_memory() -> None:
    """
    Clean up GPU memory by collecting garbage and emptying CUDA cache.

    Note:
        Should be called periodically to prevent memory leaks.
    """
    gc.collect()
    torch.cuda.empty_cache()
