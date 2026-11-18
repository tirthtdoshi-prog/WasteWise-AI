"""
WasteWise AI — Standalone Streamlit Web App (Python)
Run with: streamlit run app_streamlit.py
"""

import tempfile
from pathlib import Path
import streamlit as st
from PIL import Image

from wastewise_classifier import classify_waste_image

st.set_page_config(
    page_title="WasteWise AI — Smart Waste Classification",
    layout="wide",
)

st.title("WasteWise AI — Smart Waste Classification")
st.write(
    "Upload a photograph of plastic, paper, metal, glass, or organic waste to receive "
    "category predictions, confidence scores, disposal instructions, and environmental impact."
)

uploaded = st.file_uploader("Upload waste image (JPG, PNG, WEBP)", type=["jpg", "jpeg", "png", "webp"])

if uploaded is not None:
    col_img, col_res = st.columns([1, 1], gap="large")

    with col_img:
        image = Image.open(uploaded)
        st.image(image, caption="Uploaded Waste Sample", use_container_width=True)

    with col_res:
        with st.spinner("Analyzing waste material..."):
            suffix = Path(uploaded.name).suffix or ".jpg"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(uploaded.getvalue())
                tmp_path = tmp.name

            result = classify_waste_image(tmp_path)

        st.subheader(f"{result.category} — {result.item_detected}")
        st.metric(label="Prediction Confidence", value=f"{result.confidence}%")
        st.progress(result.confidence / 100.0)

        st.markdown(f"**Target Bin:** {result.bin_type}")
        st.markdown(f"**Disposal Recommendation:** {result.disposal_recommendation}")
        st.markdown(f"**Environmental Impact:** {result.environmental_impact}")
        st.info(f"Contamination Prevention: {result.contamination_tip}")

        st.markdown("#### After Recycling — What We Make & Uses")
        for prod in result.recycled_products:
            st.write(f"- {prod}")
        st.markdown(f"**Real-World Uses:** {result.real_world_uses}")
        st.markdown(f"**Recovery Process:** {result.circular_process_note}")

        st.markdown("#### 5-Class Probability Distribution")
        for score_item in result.category_scores:
            st.write(f"{score_item.category}: {score_item.score}%")
            st.progress(score_item.score / 100.0)
