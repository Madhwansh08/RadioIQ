import asyncio
import os
import sys

import pandas as pd
import pytest

sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../cxr-app"))
)

from src.server import batch_process_images

# ✅ Mapped IDs Dictionary
MAPPED_IDS = {
    0: "Lung Nodules",
    1: "Consolidation",
    2: "Pleural Effusion",
    3: "Opacity",
    4: "Rib Fractures",
    5: "Pneumothorax",
    6: "Cardiomegaly",
}

# ✅ Load test images from CSV
TEST_CSV = os.path.abspath("test/uploaded_images.csv")
df = pd.read_csv(TEST_CSV)

# ✅ Track Pass/Fail Count
passed_cases = 0
failed_cases = 0
failed_images = []


@pytest.mark.parametrize("index, row", df.iterrows())
@pytest.mark.asyncio
@pytest.mark.validation
async def test_cloudinary(async_client, index, row):
    """
    Test inference function by passing Cloudinary image URLs.
    """
    global passed_cases, failed_cases

    image_url = row["Cloudinary_URL"]
    expected_class = row["Class"]

    # ✅ Create input data dictionary
    input_data = {"data": {"url": image_url}}

    # ✅ Run inference
    asyncio.create_task(batch_process_images())
    result = await async_client.post("/invocations", json=input_data)
    assert result.status_code == 200
    result = result.json()
    # ✅ Extract predicted class ID and map it
    predicted_labels = result.get("abnormalities", [])
    predicted_label_ids = [
        abnormality["abnormality_id"] for abnormality in predicted_labels
    ]
    predicted_class_names = [
        name for id, name in MAPPED_IDS.items() if id in predicted_label_ids
    ]
    if len(predicted_class_names) == 0:
        predicted_class_names = ["Normal"]

    print("predicted_class_names", predicted_class_names)
    print("expected_class", expected_class)

    # ✅ Check if expected class is in predicted labels
    if expected_class in predicted_class_names:
        passed_cases += 1
    else:
        failed_cases += 1
        failed_images.append(
            {
                "Image": image_url,
                "Expected": expected_class,
                "Predicted": predicted_class_names,
            }
        )

    # ✅ Assert condition
    assert (
        expected_class in predicted_class_names
    ), f"Expected {expected_class}, but got {predicted_class_names}"


# ✅ Run summary after tests
@pytest.mark.validation
def test_summary():
    print("\n===== ✅ Test Summary =====")
    print(f"Total Images: {len(df)}")
    print(f"✔ Passed: {passed_cases}")
    print(f"❌ Failed: {failed_cases}")

    if failed_cases > 0:
        print("\n===== ❌ Failed Cases =====")
        for case in failed_images:
            print(
                f"❌ {case['Image']} | Expected: {case['Expected']} | Predicted: {case['Predicted']}"
            )
