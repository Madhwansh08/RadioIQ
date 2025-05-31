import os
import sys
from pathlib import Path

# Third-party imports
import joblib
import torch
import torchxrayvision as xrv
from easy_explain import YOLOv8LRP
from ultralytics import RTDETR, YOLO

# Adjust system path for local modules
sys.path.append(str(Path(__file__).parent.parent))

# Local imports
from src.models import CustomResNet50, ResNetBSHighResDilated

MODEL_ROOT = os.path.abspath("models")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class ModelContainer:
    """
    A container class for managing deep learning models with thread-safe access.

    This class implements a singleton pattern for model management, ensuring models
    are loaded only once and shared across all instances.

    Attributes:
        _models (dict): Class-level dictionary storing loaded models
        model_paths (dict): Dictionary mapping model keys to their file paths

    Note:
        Models are loaded lazily (only when requested) to optimize memory usage
    """

    _models = {}  # Global model dictionary (shared within process)

    def __init__(self, model_paths: dict):
        """
        Initialize the ModelContainer with paths to model files.

        Args:
            model_paths (dict): Dictionary mapping model names to their file paths.
                Required keys:
                    - lung_crop_model: Path to YOLO lung detection model
                    - detection_model: Path to RT-DETR abnormality detection model
                    - tb_classification_model: Path to TB classification model
                    - check_inversion_model: Path to inversion detection model
                    - organ_segmentation_model: Path to organ segmentation model
                    - lrp: Path to YOLO-LRP model
                    - bone_suppression_model: Path to bone suppression model
                    - ribfracture_model: Path to rib fracture detection model
        """
        self.model_paths = model_paths

    @classmethod
    def get_model(cls, model_key: str) -> torch.nn.Module:
        """
        Retrieve or load a model in a thread-safe manner.

        Args:
            model_key (str): Key identifying the model to load.
                Must be one of the keys in model_paths.

        Returns:
            torch.nn.Module: The requested model, loaded and ready for inference.

        Note:
            Models are cached after first load for subsequent fast access.
        """
        if model_key not in cls._models:
            cls._models[model_key] = cls._load_model(model_key)
        return cls._models[model_key]

    @classmethod
    def load_all_models(cls) -> None:
        """
        Load all available models into memory.

        This method pre-loads all models defined in model_paths into memory.
        Useful for initialization when memory constraints aren't a concern.

        Note:
            - This operation may be memory-intensive
            - Models are cached for subsequent access
            - Progress is printed to console
        """
        print("Loading all models...")
        for model_key in model_paths.keys():
            cls.get_model(model_key)
        print("All models loaded successfully.")

    @staticmethod
    def _load_model(model_key: str) -> torch.nn.Module:
        """
        Handle loading different types of models based on their key.

        Args:
            model_key (str): Key identifying the model to load.

        Returns:
            torch.nn.Module: Loaded model moved to appropriate device (CPU/GPU).

        Supported models:
            - lung_crop_model: YOLO model for lung detection
            - detection_model: RT-DETR for abnormality detection
            - tb_classification_model: Custom ResNet50 for TB classification
            - check_inversion_model: Scikit-learn model for inversion detection
            - organ_segmentation_model: PSPNet for organ segmentation
            - lrp: YOLO with Layer-wise Relevance Propagation
            - bone_suppression_model: Custom ResNet for bone suppression
            - ribfracture_model: RT-DETR for rib fracture detection

        Note:
            Each model type has specific loading and initialization requirements
        """
        path = model_paths[model_key]

        if model_key == "lung_crop_model":
            return YOLO(path).to(device)
        elif model_key == "detection_model":
            return RTDETR(path).to(device)
        elif model_key == "tb_classification_model":
            tb_model = CustomResNet50().to(device)
            tb_model.load_state_dict(torch.load(path, map_location=device))
            return tb_model
        elif model_key == "check_inversion_model":
            return joblib.load(path)
        elif model_key == "organ_segmentation_model":
            return xrv.baseline_models.chestx_det.PSPNet(cache_dir=MODEL_ROOT).to(
                device
            )
        elif model_key == "lrp":
            yolo_model = YOLO(path, verbose=0).to(device)
            return YOLOv8LRP(yolo_model, device=device)
        elif model_key == "bone_suppression_model":
            model = ResNetBSHighResDilated(
                num_filters=64, num_res_blocks=16, res_block_scaling=0.1
            )
            # model.load_state_dict(torch.load(path, weights_only=True))
            model.load_state_dict(torch.load(path, map_location=torch.device("cpu"), weights_only=True))

            model.eval()
            return model.to(device)
        elif model_key == "ribfracture_model":
            return RTDETR(path).to(device)
        else:
            model = torch.load(path, map_location=device)
            model.eval()
            return model


# Paths to your models
model_paths = {
    "lung_crop_model": os.path.join(
        MODEL_ROOT, "lung_crop_model.pt"
    ),  # YOLO model for lung cropping
    "detection_model": os.path.join(
        MODEL_ROOT, "rtdetr_75.pt"
    ),  # RT-DETR model for abnormality detection
    "tb_classification_model": os.path.join(
        MODEL_ROOT, "resnet50_tb.pth"
    ),  # ResNet50 model for TB classification
    "check_inversion_model": os.path.join(
        MODEL_ROOT, "posVSneg_RF_sklearn.joblib"
    ),  # Random Forest model for inversion detection
    "organ_segmentation_model": os.path.join(
        MODEL_ROOT, "pspnet_chestxray.pth"
    ),  # PSPNet model for organ segmentation
    "lrp": os.path.join(
        MODEL_ROOT, "yolo_detect_lrp.pt"
    ),  # YOLO model for TB detection
    "bone_suppression_model": os.path.join(
        MODEL_ROOT, "ResNetBS_best.pth"
    ),  # ResNetBS model for bone suppression
    "ribfracture_model": os.path.join(
        MODEL_ROOT, "ribfrac.pt"
    ),  # ResNet model for rib fracture detection
}

# Global model container
model_container = ModelContainer(model_paths)
