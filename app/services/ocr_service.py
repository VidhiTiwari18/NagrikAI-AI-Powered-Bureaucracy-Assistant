import easyocr

# Initializing ocr model once only
reader = easyocr.Reader(['en'], gpu=False)


def extract_text(image_path: str) -> str:
    """
    Extract text from an image using EasyOCR.
    """

    result = reader.readtext(image_path)

    extracted_text = "\n".join(
        [item[1] for item in result]
    )

    return extracted_text