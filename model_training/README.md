# AI Model Training

This directory contains all the code and resources for training the emergency keyword detection model.

## Overview

The emergency detection model is a CNN-based keyword spotting system that can detect emergency phrases in Sinhala, Tamil, and English:

**Sinhala:**
- "උදව් කරන්න" (Help me)
- "අම්මෝ" (Oh my)
- "අනතුරක්" (Danger)

**Tamil:**
- "உதவி செய்யுங்கள்" (Help me)
- "ஆபத்து" (Danger)

**English:**
- "Help me"
- "Emergency"
- "Help"

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Directory Structure

- `notebooks/` - Jupyter notebooks for exploration and experimentation
- `src/data/` - Data preprocessing and augmentation scripts
- `src/models/` - Model architecture definitions
- `src/training/` - Training and evaluation scripts
- `src/utils/` - Utility functions
- `datasets/` - Training data (not tracked in git)
- `models/` - Trained models (TFLite format)

## Workflow

1. **Data Collection**: Collect audio samples of emergency phrases
2. **Preprocessing**: Extract MFCC features from audio
3. **Augmentation**: Apply data augmentation (noise, pitch shift, etc.)
4. **Training**: Train CNN model on processed data
5. **Evaluation**: Test model performance
6. **Conversion**: Convert to TensorFlow Lite format
7. **Optimization**: Quantize model for mobile deployment

## Model Architecture

The model uses a CNN architecture optimized for keyword spotting:
- Input: MFCC features (40 coefficients, variable time steps)
- Conv layers with batch normalization
- MaxPooling for dimensionality reduction
- Dense layers for classification
- Output: Binary classification (emergency/non-emergency)

## Training

Run the training script:
```bash
python src/training/train.py --epochs 50 --batch-size 32
```

## Evaluation

Evaluate the model:
```bash
python src/training/evaluate.py --model-path models/emergency_detection.h5
```

## TFLite Conversion

Convert to TFLite:
```bash
python src/utils/convert_to_tflite.py --input models/emergency_detection.h5 --output models/emergency_detection.tflite
```

## Performance Targets

- **Accuracy**: >95% on test set
- **False Positive Rate**: <2%
- **Inference Time**: <100ms on mobile device
- **Model Size**: <5MB

## Notes

- The model is designed to work offline on mobile devices
- MFCC preprocessing is done on-device for real-time detection
- Model is optimized for low-power consumption
