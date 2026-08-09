/**
 * mfccExtractor.ts
 *
 * On-Device Mel-Frequency Cepstral Coefficient (MFCC) & Log-Mel Spectrogram Feature Extractor.
 * Transforms 16kHz mono audio samples into a 40x49 log-Mel spectrogram tensor
 * ready for INT8 TensorFlow Lite Keyword Spotting (KWS) inference.
 */

export class MfccExtractor {
  private readonly SAMPLE_RATE = 16000;
  private readonly NUM_MEL_BINS = 40;
  private readonly NUM_TIME_STEPS = 49;
  private readonly WINDOW_SIZE_SAMPLES = 400; // 25ms window at 16kHz
  private readonly HOP_SIZE_SAMPLES = 160;    // 10ms hop at 16kHz
  private readonly FFT_SIZE = 512;

  /**
   * Generates a Hamming window of given length.
   */
  private getHammingWindow(length: number): Float32Array {
    const window = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (length - 1));
    }
    return window;
  }

  /**
   * Converts Hz to Mel frequency scale.
   */
  private hzToMel(hz: number): number {
    return 2595.0 * Math.log10(1.0 + hz / 700.0);
  }

  /**
   * Converts Mel to Hz frequency scale.
   */
  private melToHz(mel: number): number {
    return 700.0 * (Math.pow(10.0, mel / 2595.0) - 1.0);
  }

  /**
   * Computes triangular Mel-scale filterbank matrix (FFT_BINS x NUM_MEL_BINS).
   */
  private buildMelFilterbank(): Float32Array[] {
    const numFftBins = this.FFT_SIZE / 2 + 1;
    const minMel = this.hzToMel(80);
    const maxMel = this.hzToMel(7600);

    const melPoints = new Float32Array(this.NUM_MEL_BINS + 2);
    for (let i = 0; i < melPoints.length; i++) {
      melPoints[i] = minMel + (i * (maxMel - minMel)) / (melPoints.length - 1);
    }

    const binIndices = new Int32Array(melPoints.length);
    for (let i = 0; i < melPoints.length; i++) {
      const hz = this.melToHz(melPoints[i]);
      binIndices[i] = Math.floor(((this.FFT_SIZE + 1) * hz) / this.SAMPLE_RATE);
    }

    const filterbank: Float32Array[] = [];
    for (let m = 1; m <= this.NUM_MEL_BINS; m++) {
      const filter = new Float32Array(numFftBins);
      const left = binIndices[m - 1];
      const center = binIndices[m];
      const right = binIndices[m + 1];

      for (let k = left; k < center; k++) {
        if (center !== left) {
          filter[k] = (k - left) / (center - left);
        }
      }
      for (let k = center; k <= right; k++) {
        if (right !== center) {
          filter[k] = (right - k) / (right - center);
        }
      }
      filterbank.push(filter);
    }
    return filterbank;
  }

  /**
   * Extracts a 40x49 log-Mel spectrogram tensor from 1-second PCM audio samples.
   * If input is shorter than required, pads with zeros; if longer, truncates.
   *
   * @param pcmAudio Float32Array of audio samples [-1.0, 1.0]
   * @returns 2D array of shape [NUM_TIME_STEPS][NUM_MEL_BINS] (49 x 40)
   */
  public extractLogMelSpectrogram(pcmAudio: Float32Array | number[]): number[][] {
    const requiredSamples =
      (this.NUM_TIME_STEPS - 1) * this.HOP_SIZE_SAMPLES + this.WINDOW_SIZE_SAMPLES;

    const audioBuffer = new Float32Array(requiredSamples);
    const copyLength = Math.min(pcmAudio.length, requiredSamples);
    for (let i = 0; i < copyLength; i++) {
      audioBuffer[i] = pcmAudio[i];
    }

    const hamming = this.getHammingWindow(this.WINDOW_SIZE_SAMPLES);
    const melBank = this.buildMelFilterbank();
    const spectrogram: number[][] = [];

    for (let step = 0; step < this.NUM_TIME_STEPS; step++) {
      const startIdx = step * this.HOP_SIZE_SAMPLES;
      const windowed = new Float32Array(this.FFT_SIZE);

      // Apply Hamming window
      for (let i = 0; i < this.WINDOW_SIZE_SAMPLES; i++) {
        windowed[i] = audioBuffer[startIdx + i] * hamming[i];
      }

      // Compute power spectrum approximation (real FFT magnitude squared)
      const numFftBins = this.FFT_SIZE / 2 + 1;
      const powerSpectrum = new Float32Array(numFftBins);
      for (let k = 0; k < numFftBins; k++) {
        // Discrete Fourier transform bin energy approximation for KWS feature extraction
        let re = 0.0;
        let im = 0.0;
        const freqRad = (2.0 * Math.PI * k) / this.FFT_SIZE;
        for (let n = 0; n < this.WINDOW_SIZE_SAMPLES; n += 2) {
          const angle = freqRad * n;
          re += windowed[n] * Math.cos(angle);
          im -= windowed[n] * Math.sin(angle);
        }
        powerSpectrum[k] = (re * re + im * im) / this.FFT_SIZE;
      }

      // Apply Mel-filterbank and log scaling
      const melFeatures: number[] = [];
      for (let m = 0; m < this.NUM_MEL_BINS; m++) {
        let melEnergy = 0.0;
        const filter = melBank[m];
        for (let k = 0; k < numFftBins; k++) {
          melEnergy += powerSpectrum[k] * filter[k];
        }
        // Log-Mel scaling with epsilon stabilization
        const logMel = Math.log(Math.max(1e-5, melEnergy));
        melFeatures.push(logMel);
      }
      spectrogram.push(melFeatures);
    }

    return spectrogram;
  }
}

export const mfccExtractor = new MfccExtractor();
