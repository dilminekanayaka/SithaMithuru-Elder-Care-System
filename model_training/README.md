# SithaMithuru AI Model Training Studio (Phase 10 Architecture)

This directory contains the complete Python machine learning pipeline for training, augmenting, quantizing, and exporting the **SithaMithuru Trilingual Emergency Keyword Spotting (KWS)** model for elderly users.

---

## 1. Architectural Overview

```
[ Clean Speech / Dataset ]
            │
            ▼
[ augment_elderly_audio.py ] ──► Simulates Presbyphonia (Vocal Aging), Reverb & Home SNR (-5dB to +15dB)
            │
            ▼
 [ train_kws_model.py ]       ──► Trains CNN/GRU KWS Network on 40x49 log-Mel MFCC Spectrograms
            │
            ▼
[ export_tflite_int8.py ]    ──► Full-Integer INT8 Calibration & Export (<2 MB .tflite)
            │
            ▼
[ Mobile App On-Device ]     ──► Dynamic Confidence Matrix (si: 0.65, en: 0.85, ta: 0.70)
```

---

## 2. Presbyphonia & Home Acoustics Augmentation (`augment_elderly_audio.py`)
Elderly voices exhibit physiological changes known as **presbyphonia**, including pitch lowering, breathiness, and vocal tremor. Additionally, elders often live in environments with ambient home noise.

Our augmentation pipeline applies:
- **Pitch Lowering**: `-1.0` to `-2.5` semitones.
- **Vocal Tremor**: `5–6 Hz` amplitude modulation.
- **Breathiness**: Aspirated high-passed white noise mixing.
- **Room Acoustics**: 3m–5m distance attenuation & exponential decay reverberation.
- **Ambient Noise Injection**: Television broadcast, fan hum, and street traffic at SNR `-5dB` to `+15dB`.

---

## 3. Training & Quantization Workflow

### Step 1: Install Dependencies
```bash
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Step 2: Train the CNN/GRU KWS Model
```bash
python train_kws_model.py
```
This trains `SithaMithuru_KWS_v1.2` across 4 classes:
- `0`: `si_emergency` (Sinhala: "බේරගන්න", "උදව් කරන්න")
- `1`: `en_emergency` (English: "help", "emergency", "sos")
- `2`: `ta_emergency` (Tamil: "காப்பாற்றுங்கள்", "உதவி")
- `3`: `background_noise`

### Step 3: Export to INT8 Quantized TFLite (`<2 MB`)
```bash
python export_tflite_int8.py
```
Outputs `kws_elder_v1.2_int8.tflite` calibrated for integer-only execution on ARM NEON / Hexagon DSP mobile CPUs.

---

## 4. Over-The-Air (OTA) Deployment Protocol

1. The exported `kws_elder_v1.2_int8.tflite` model is hosted securely on SithaMithuru AWS S3 / OTA CDN.
2. The React Native mobile app (`mobile/src/services/aiModelManager.ts`) periodically checks the API endpoint for model version updates.
3. Every triggered SOS event tags the alert payload with `triggered_by_model: "v1.2_int8_kws"` for clinical audit trails and medical liability compliance.
