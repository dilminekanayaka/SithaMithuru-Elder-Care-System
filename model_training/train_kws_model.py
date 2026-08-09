#!/usr/bin/env python3
"""
train_kws_model.py

TensorFlow/Keras Training Studio for SithaMithuru Trilingual Emergency Keyword Spotting (KWS).
Trains a lightweight, INT8-quantizable CNN/GRU network on 40x49 log-Mel MFCC spectrograms.

Classes:
  0: si_emergency (Sinhala - e.g. "බේරගන්න", "උදව් කරන්න")
  1: en_emergency (English - e.g. "help", "emergency", "sos")
  2: ta_emergency (Tamil - e.g. "காப்பாற்றுங்கள்", "உதவி")
  3: background_noise (TV, speech, silence)

Author: SithaMithuru AI & ML Architecture Team
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from typing import Tuple


def build_kws_model(
    input_shape: Tuple[int, int, int] = (49, 40, 1),
    num_classes: int = 4,
) -> tf.keras.Model:
    """
    Builds a lightweight MobileNet-inspired CNN-GRU architecture optimized for
    INT8 quantization on mobile CPU vector extensions (NEON/Hexagon).
    """
    inputs = layers.Input(shape=input_shape, name="mfcc_input")

    # 1. Spatial Convolution Feature Extraction
    x = layers.Conv2D(32, (3, 3), padding="same", use_bias=False)(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU(max_value=6.0)(x)  # ReLU6 is standard for INT8 TFLite compatibility
    x = layers.MaxPooling2D(pool_size=(2, 2))(x)

    # 2. Depthwise Separable Convolution Block
    x = layers.DepthwiseConv2D((3, 3), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU(max_value=6.0)(x)
    x = layers.Conv2D(64, (1, 1), padding="same", use_bias=False)(x)
    x = layers.BatchNormalization()(x)
    x = layers.ReLU(max_value=6.0)(x)
    x = layers.MaxPooling2D(pool_size=(2, 2))(x)

    # 3. Reshape for Temporal Recurrent Processing (Time x Features)
    # Shape after pool: (12, 10, 64) -> flatten spatial freq bins
    shape_after_pool = x.shape
    time_steps = shape_after_pool[1]
    feature_dim = shape_after_pool[2] * shape_after_pool[3]
    x = layers.Reshape((time_steps, feature_dim))(x)

    # 4. Temporal Gated Recurrent Block (GRU)
    x = layers.GRU(48, return_sequences=False, dropout=0.2)(x)

    # 5. Classification Dense Head
    x = layers.Dense(32, activation="relu", name="dense_feature")(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="kws_output")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="SithaMithuru_KWS_v1.2")
    return model


def generate_synthetic_dataset(
    num_samples: int = 800,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generates synthetic 40x49 spectrograms for validation/demo pipeline.
    In production, this is replaced by loading .npy spectrograms generated
    by augment_elderly_audio.py across collected speech samples.
    """
    X = np.random.normal(0.5, 0.25, size=(num_samples, 49, 40, 1)).astype(np.float32)
    y = np.random.randint(0, 4, size=num_samples)
    return X, y


def train():
    print("🚀 Initializing SithaMithuru Trilingual KWS Training Pipeline...")
    model = build_kws_model()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()

    X_train, y_train = generate_synthetic_dataset(num_samples=400)
    X_val, y_val = generate_synthetic_dataset(num_samples=100)

    checkpoint_cb = callbacks.ModelCheckpoint(
        "kws_model_best.keras",
        save_best_only=True,
        monitor="val_accuracy",
        mode="max",
    )

    print("📊 Training model for 5 demo epochs on synthetic/augmented spectrograms...")
    model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=5,
        batch_size=32,
        callbacks=[checkpoint_cb],
        verbose=1,
    )

    model.save("kws_model_final.keras")
    print("✅ Model training complete and saved to 'kws_model_final.keras'.")


if __name__ == "__main__":
    train()
