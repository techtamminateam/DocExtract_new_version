from PIL import Image
import pytesseract
import cv2
import numpy as np
import os

# 🔧 Set Tesseract path (Windows)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# -------------------------------
# 1. DPI Scaling (REAL IMPROVEMENT)
# -------------------------------
def set_dpi(pil_img, target_dpi=300):
    width, height = pil_img.size

    # Assume original ~72 DPI (common for images)
    scale = target_dpi / 72
    new_size = (int(width * scale), int(height * scale))

    return pil_img.resize(new_size, Image.LANCZOS)


# -------------------------------
# 2. Image Preprocessing
# -------------------------------
def preprocess_image(pil_img):
    # Convert PIL → OpenCV
    img = np.array(pil_img)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise
    gray = cv2.fastNlMeansDenoising(gray, None, 30, 7, 21)

    # Adaptive threshold (better than simple threshold)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        31, 2
    )

    return thresh


# -------------------------------
# 3. OCR Function
# -------------------------------
def fast_ocr(pil_img: Image.Image) -> str:
    # Step 1: Increase DPI
    pil_img = set_dpi(pil_img, 300)

    # Step 2: Preprocess
    processed = preprocess_image(pil_img)

    # Step 3: OCR config
    config = "--oem 3 --psm 6"

    text = pytesseract.image_to_string(
        processed,
        lang="eng+hin+fra",
        config=config
    )

    return text


# -------------------------------
# 4. Main Execution
# -------------------------------
img_path = "image.png"
output_file = "extracted_invoice_text.txt"

try:
    with Image.open(img_path) as img:
        text = fast_ocr(img)

        # Save output
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(text)

        print(f"✅ Success! Text saved to: {os.path.abspath(output_file)}")

except FileNotFoundError:
    print("❌ Error: Could not find the image file.")
except Exception as e:
    print(f"❌ An error occurred: {e}")