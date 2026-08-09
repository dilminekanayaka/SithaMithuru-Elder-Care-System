#!/usr/bin/env python3
"""
augment_elderly_audio.py

Specialized Audio Augmentation Pipeline for SithaMithuru Elderly Voice Models.
Addresses Presbyphonia (elderly vocal aging characteristics) and realistic
home acoustic environments (television, fan noise, distance attenuation).

Author: SithaMithuru AI & ML Architecture Team
"""

import os
import math
import numpy as np
import scipy.signal as signal
import scipy.io.wavfile as wavfile
from typing import Tuple, List, Optional


class ElderlyVoiceAugmenter:
    """
    Simulates elderly vocal tract characteristics (presbyphonia) and realistic
    ambient home environments for training robust Keyword Spotting (KWS) models.
    """

    def __init__(self, sample_rate: int = 16000):
        self.sr = sample_rate

    def apply_presbyphonia(
        self,
        audio: np.ndarray,
        pitch_shift_semitones: float = -1.8,
        breathiness_ratio: float = 0.08,
        tremor_freq_hz: float = 5.5,
        tremor_depth: float = 0.15,
    ) -> np.ndarray:
        """
        Applies elderly vocal tract simulation:
        1. Pitch lowering (-1.0 to -2.5 semitones)
        2. Vocal tremor (5-6 Hz amplitude modulation)
        3. Breathiness (high-passed aspirated white noise mixing)
        """
        # Ensure 1D float32 array normalized [-1.0, 1.0]
        y = audio.astype(np.float32)

        # 1. Vocal Tremor (AM modulation at tremor_freq_hz)
        num_samples = len(y)
        t = np.arange(num_samples) / float(self.sr)
        tremor_mod = 1.0 - tremor_depth * (1.0 - np.cos(2.0 * np.pi * tremor_freq_hz * t)) / 2.0
        y_tremor = y * tremor_mod

        # 2. Breathiness (Aspirated noise component around speech harmonics)
        noise = np.random.normal(0, 1.0, size=num_samples).astype(np.float32)
        # High-pass filter above 1800 Hz to simulate breathy airflow
        sos_hp = signal.butter(4, 1800, 'hp', fs=self.sr, output='sos')
        breathy_noise = signal.sosfilt(sos_hp, noise)
        # Scale breathy noise by envelope of the speech signal
        speech_env = np.abs(signal.hilbert(y_tremor))
        breathy_noise = breathy_noise * speech_env * breathiness_ratio

        y_out = y_tremor + breathy_noise

        # 3. Simple Time-Domain Resampling Pitch Shift Approximation
        if abs(pitch_shift_semitones) > 0.05:
            factor = 2.0 ** (pitch_shift_semitones / 12.0)
            target_len = int(num_samples / factor)
            y_resampled = signal.resample(y_out, target_len)
            # Truncate or pad back to original length
            if len(y_resampled) > num_samples:
                y_out = y_resampled[:num_samples]
            else:
                y_out = np.pad(y_resampled, (0, num_samples - len(y_resampled)), mode='constant')

        return np.clip(y_out, -1.0, 1.0)

    def apply_room_acoustics(
        self,
        audio: np.ndarray,
        distance_meters: float = 3.5,
        reverberation_ms: float = 220.0,
    ) -> np.ndarray:
        """
        Simulates room reverberation and distance attenuation from microphone (3m - 5m).
        Uses exponential decay impulse response filter.
        """
        y = audio.astype(np.float32)

        # Distance Attenuation (Inverse square approximation in enclosed room)
        attenuation = max(0.2, 1.0 / (1.0 + 0.35 * (distance_meters - 1.0)))
        y_att = y * attenuation

        # Exponential decay room impulse response
        rt60_samples = int((reverberation_ms / 1000.0) * self.sr)
        t_ir = np.arange(rt60_samples) / float(self.sr)
        ir = np.exp(-t_ir * 15.0) * np.random.normal(0, 0.3, size=rt60_samples)
        ir[0] = 1.0  # Direct path impulse
        ir = ir / np.sum(np.abs(ir))

        y_rev = signal.fftconvolve(y_att, ir, mode='same')
        return np.clip(y_rev, -1.0, 1.0)

    def inject_ambient_noise(
        self,
        speech: np.ndarray,
        noise_type: str = 'television',
        target_snr_db: float = 5.0,
    ) -> np.ndarray:
        """
        Injects realistic home background noise at specified Signal-to-Noise Ratio (SNR dB).
        Supports: 'television', 'fan_hum', 'street_traffic', 'white_noise'.
        """
        y = speech.astype(np.float32)
        num_samples = len(y)

        if noise_type == 'television':
            # Simulates fluctuating speech-like background TV spectrum
            raw_noise = np.random.normal(0, 1.0, size=num_samples).astype(np.float32)
            sos = signal.butter(3, [300, 3400], 'bp', fs=self.sr, output='sos')
            noise = signal.sosfilt(sos, raw_noise)
            # Add subtle amplitude gating
            mod = 0.5 * (1.0 + np.sin(2.0 * np.pi * 1.5 * (np.arange(num_samples) / self.sr)))
            noise = noise * mod
        elif noise_type == 'fan_hum':
            # Low-frequency continuous hum (60 Hz / 120 Hz harmonics + low-passed turbulence)
            t = np.arange(num_samples) / float(self.sr)
            hum = 0.6 * np.sin(2 * np.pi * 60 * t) + 0.3 * np.sin(2 * np.pi * 120 * t)
            raw_noise = np.random.normal(0, 0.4, size=num_samples)
            sos = signal.butter(2, 400, 'lp', fs=self.sr, output='sos')
            noise = (hum + signal.sosfilt(sos, raw_noise)).astype(np.float32)
        elif noise_type == 'street_traffic':
            # Low-end rumble with random traffic surge
            raw_noise = np.random.normal(0, 1.0, size=num_samples).astype(np.float32)
            sos = signal.butter(2, 250, 'lp', fs=self.sr, output='sos')
            noise = signal.sosfilt(sos, raw_noise)
        else:
            noise = np.random.normal(0, 1.0, size=num_samples).astype(np.float32)

        # Compute RMS power
        speech_rms = np.sqrt(np.mean(y ** 2)) + 1e-8
        noise_rms = np.sqrt(np.mean(noise ** 2)) + 1e-8

        # Calculate desired noise scalar from SNR equation: SNR_dB = 20 * log10(speech_rms / (scalar * noise_rms))
        snr_linear = 10.0 ** (target_snr_db / 20.0)
        noise_scale = speech_rms / (snr_linear * noise_rms)

        y_noisy = y + (noise * noise_scale)
        return np.clip(y_noisy, -1.0, 1.0)

    def augment_sample(
        self,
        audio: np.ndarray,
        apply_aging: bool = True,
        apply_reverb: bool = True,
        snr_db: float = 8.0,
        noise_type: str = 'television',
    ) -> np.ndarray:
        """
        Executes full elderly vocal and home acoustic augmentation pipeline.
        """
        out = audio.copy()
        if apply_aging:
            out = self.apply_presbyphonia(out)
        if apply_reverb:
            out = self.apply_room_acoustics(out, distance_meters=3.0, reverberation_ms=180.0)
        out = self.inject_ambient_noise(out, noise_type=noise_type, target_snr_db=snr_db)
        return out


if __name__ == '__main__':
    print("🎙️ Testing ElderlyVoiceAugmenter (Presbyphonia + Home Acoustics)...")
    augmenter = ElderlyVoiceAugmenter(sample_rate=16000)
    test_signal = np.sin(2 * np.pi * 440 * (np.arange(16000) / 16000.0)).astype(np.float32)
    augmented = augmenter.augment_sample(test_signal, snr_db=6.0, noise_type='television')
    print(f"✅ Augmentation successful. Output shape: {augmented.shape}, Peak amplitude: {np.max(np.abs(augmented)):.3f}")
