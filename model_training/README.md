# AI Model Training

Python environment for training the emergency keyword detection model.

## Overview

This directory will contain the TensorFlow-based AI model training pipeline for detecting emergency keywords in Sinhala, Tamil, and English.

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Planned Features

- ⏳ CNN-based keyword spotting model
- ⏳ MFCC audio feature extraction
- ⏳ Multi-language support (Sinhala, Tamil, English)
- ⏳ Data augmentation pipeline
- ⏳ Model evaluation and testing
- ⏳ TensorFlow Lite conversion
- ⏳ Model optimization for mobile

## Tech Stack

- TensorFlow 2.15
- Python 3.8+
- librosa (audio processing)
- NumPy, Pandas
- Jupyter Notebooks

## Development

The AI model training will begin once sufficient audio data is collected. The trained model will be converted to TensorFlow Lite format for deployment on the mobile app.
