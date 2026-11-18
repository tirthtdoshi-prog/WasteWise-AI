"""
WasteWise AI — Smart Waste Classification Module (Python + Google GenAI SDK)
Identifies plastic, paper, metal, glass, and organic waste from uploaded images.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path
from typing import Literal

from google import genai
from google.genai import types
from PIL import Image
from pydantic import BaseModel, Field


WasteCategory = Literal["Plastic", "Paper", "Metal", "Glass", "Organic", "Other"]


class CategoryScore(BaseModel):
    category: Literal["Plastic", "Paper", "Metal", "Glass", "Organic"]
    score: int = Field(..., ge=0, le=100)


class WasteClassificationResult(BaseModel):
    category: WasteCategory
    confidence: int = Field(..., ge=0, le=100, description="Prediction confidence percentage")
    item_detected: str = Field(..., description="Specific item identified in the image")
    bin_type: str = Field(..., description="Target collection bin")
    disposal_recommendation: str = Field(..., description="Actionable disposal guidance")
    environmental_impact: str = Field(..., description="Ecological benefit of proper sorting")
    contamination_tip: str = Field(..., description="Tip to avoid recycling stream contamination")
    recycled_products: list[str] = Field(..., description="3-4 new products made after recycling or composting")
    real_world_uses: str = Field(..., description="Practical uses of the recycled material in daily life or industry")
    circular_process_note: str = Field(..., description="Summary of how the waste is transformed after collection")
    recyclable: bool
    compostable: bool
    category_scores: list[CategoryScore]


CLASSIFICATION_PROMPT = """
Analyze the uploaded waste image and classify the primary waste item into one of:
Plastic, Paper, Metal, Glass, Organic, or Other.

Return:
- category: Primary waste class
- confidence: Integer 0-100 representing visual certainty
- item_detected: Specific item name (e.g., 'Clear PET Plastic Bottle')
- bin_type: Recommended recycling or compost bin
- disposal_recommendation: Practical 1-2 sentence instruction
- environmental_impact: 1-2 sentence ecological protection summary
- contamination_tip: 1 sentence tip to prevent cross-stream contamination
- recycled_products: 3-4 products manufactured after recycling/composting this item
- real_world_uses: 1-2 sentence explanation of how those recycled products are used
- circular_process_note: 1 sentence describing the recovery/transformation process
- recyclable / compostable flags
- category_scores: Probability distribution across Plastic, Paper, Metal, Glass, and Organic summing to 100
""".strip()


def classify_waste_image(image_path: str | Path, api_key: str | None = None) -> WasteClassificationResult:
    """Classify a waste image file using Gemini Vision with automatic retry and fallback."""
    resolved_key = api_key or os.environ.get("GEMINI_API_KEY")
    if not resolved_key:
        raise EnvironmentError("Set the GEMINI_API_KEY environment variable before running classification.")

    client = genai.Client(api_key=resolved_key)
    image = Image.open(image_path).convert("RGB")
    image.thumbnail((896, 896))

    models_to_try = ["gemini-3.1-flash-lite", "gemini-4-hydrogen", "gemini-3.1-flash-lite"]
    last_error: Exception | None = None

    for idx, model_name in enumerate(models_to_try):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[image, CLASSIFICATION_PROMPT],
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are WasteWise AI, a computer-vision waste sorting classifier. "
                        "Provide accurate segregation and circular upcycling guidance to reduce landfill pollution."
                    ),
                    response_mime_type="application/json",
                    response_schema=WasteClassificationResult,
                ),
            )
            if response.parsed is not None:
                return response.parsed  # type: ignore[return-value]
            return WasteClassificationResult.model_validate_json(response.text)
        except Exception as exc:
            last_error = exc
            msg = str(exc).lower()
            if idx < len(models_to_try) - 1 and any(k in msg for k in ("503", "unavailable", "429", "high demand")):
                time.sleep(0.4 * (idx + 1))
                continue
            raise

    assert last_error is not None
    raise last_error


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python wastewise_classifier.py <path_to_waste_image>")
        sys.exit(1)

    result = classify_waste_image(sys.argv[1])
    print(f"Waste Category:          {result.category}")
    print(f"Item Detected:           {result.item_detected}")
    print(f"Prediction Confidence:   {result.confidence}%")
    print(f"Disposal Recommendation: {result.disposal_recommendation}")
    print(f"Environmental Impact:    {result.environmental_impact}")
    print(f"Made After Recycling:    {', '.join(result.recycled_products)}")
    print(f"Real-World Uses:         {result.real_world_uses}")
