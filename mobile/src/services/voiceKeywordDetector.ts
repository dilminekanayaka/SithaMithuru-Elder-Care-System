import { Audio } from 'expo-av';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { emergencySOS } from '../modules/EmergencySOSModule';

// ─── Emergency Keywords Database (Trilingual) ──────────────────────────────────
// NOTE ON REAL-WORLD COVERAGE: the on-device speech engine (Vosk,
// vosk-model-small-en-us-0.15 — see mobile/android/app/src/main/java/com/
// sithamithuru/voice/VoiceKeywordModule.kt) only recognizes ENGLISH speech.
// The Sinhala/Tamil keyword lists below remain configured for future
// languages, but real-time detection currently only fires for `en` — there
// is no bundled Sinhala/Tamil speech model in this repo. Do not assume si/ta
// detection is functional; it is not, and nothing here fakes it.
export const EMERGENCY_KEYWORDS = {
  si: ['බේරගන්න', 'හදිසියක්', 'උදව් කරන්න', 'අනේ බේරගන්න', 'අම්මෝ'],
  en: ['help', 'emergency', 'save me', 'help me', 'doctor', 'sos'],
  ta: ['காப்பாற்றுங்கள்', 'உதவி', 'காப்பாத்துங்க'],
};

export type SupportedKeywordLanguage = keyof typeof EMERGENCY_KEYWORDS;

export interface VoiceDetectionTelemetry {
  confidenceScore: number;
  modelTag: string;
  snrDb: number;
  rmsDb: number;
}

export interface VoiceDetectionCallbacks {
  onKeywordDetected: (keyword: string, language: string, telemetry?: VoiceDetectionTelemetry) => void;
  onError?: (error: string) => void;
  onStatusChange?: (isListening: boolean) => void;
}

/**
 * Whole-word (not substring) match of `recognizedText` against the
 * configured emergency phrases for `language`. Pure function, no RN/native
 * dependencies, so it can be unit-tested directly under plain Node/ts-node.
 *
 * Whole-word matching prevents false positives like "helper"/"helpful"
 * triggering on the keyword "help".
 */
export const matchEmergencyKeyword = (
  recognizedText: string,
  language: SupportedKeywordLanguage = 'en'
): string | null => {
  if (!recognizedText) return null;
  const words = recognizedText.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  for (const phrase of EMERGENCY_KEYWORDS[language]) {
    const phraseWords = phrase.toLowerCase().split(/\s+/).filter(Boolean);
    for (let i = 0; i <= words.length - phraseWords.length; i++) {
      let matched = true;
      for (let j = 0; j < phraseWords.length; j++) {
        if (words[i + j] !== phraseWords[j]) {
          matched = false;
          break;
        }
      }
      if (matched) return phrase;
    }
  }
  return null;
};

interface NativeRecognitionResultEvent {
  text: string;
  isFinal: boolean;
  confidence: number; // real per-word confidence average reported by Vosk, 0 if unavailable
}

const KEYWORD_TRIGGER_COOLDOWN_MS = 3000;
const MODEL_TAG = 'vosk-small-en-us-0.15';

/**
 * On-Device English Voice Keyword Detector.
 *
 * Real microphone audio is captured natively (android.media.AudioRecord,
 * 16kHz mono 16-bit PCM) inside VoiceKeywordModule.kt via Vosk's
 * SpeechService, decoded by Vosk's real offline ASR engine (grammar
 * constrained to this file's EMERGENCY_KEYWORDS.en list), and the
 * recognized text is emitted here over the RN bridge for whole-word keyword
 * matching. There is no synthetic/simulated audio anywhere in this path —
 * `simulateEmergencySpeech()` below is a separate, explicitly-labeled
 * manual test hook that bypasses the real pipeline entirely and must never
 * be called from production trigger logic.
 */
class VoiceKeywordDetector {
  private isListening: boolean = false;
  private callbacks: VoiceDetectionCallbacks | null = null;
  private eventEmitter: NativeEventEmitter | null = null;
  private subscriptions: { remove: () => void }[] = [];
  private lastTriggerAt: number = 0;

  private getNativeModule() {
    return NativeModules.VoiceKeywordModule;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Audio permission error:', error);
      return false;
    }
  }

  public async startListening(callbacks: VoiceDetectionCallbacks) {
    if (this.isListening) return;

    if (Platform.OS !== 'android') {
      callbacks.onError?.(
        'Real voice keyword detection is only implemented for Android in this build (no native speech engine wired up for iOS).'
      );
      return;
    }

    const nativeModule = this.getNativeModule();
    if (!nativeModule) {
      callbacks.onError?.(
        'VoiceKeywordModule native module is not available. The app must be rebuilt ' +
        '(expo prebuild + a real Android build — a Metro/Expo Go reload is not enough) ' +
        'to include the native Vosk speech engine.'
      );
      return;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      callbacks.onError?.('Microphone permission not granted');
      return;
    }

    this.callbacks = callbacks;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Foreground service (keeps the process + mic access alive while
      // backgrounded) — now backed by a real native Service, see
      // EmergencyListeningService.kt.
      await emergencySOS.startForegroundService();

      this.eventEmitter = new NativeEventEmitter(nativeModule);
      this.subscriptions.push(
        this.eventEmitter.addListener('VoiceKeywordResult', this.handleRecognitionResult)
      );
      this.subscriptions.push(
        this.eventEmitter.addListener('VoiceKeywordError', (e: { message: string }) => {
          console.error('VoiceKeywordModule error:', e.message);
          this.callbacks?.onError?.(e.message);
        })
      );
      this.subscriptions.push(
        this.eventEmitter.addListener('VoiceKeywordStatus', (e: { isListening: boolean }) => {
          this.isListening = e.isListening;
          this.callbacks?.onStatusChange?.(e.isListening);
        })
      );

      await nativeModule.startListening();

      console.log(`🎙️ Real on-device speech engine (${MODEL_TAG}) listening on real microphone audio.`);
    } catch (error: any) {
      console.error('Failed to start voice detector:', error);
      this.isListening = false;
      this.removeSubscriptions();
      if (this.callbacks) {
        this.callbacks.onStatusChange?.(false);
        this.callbacks.onError?.(error.message || 'Audio engine error');
      }
    }
  }

  private handleRecognitionResult = (event: NativeRecognitionResultEvent) => {
    const matchedKeyword = matchEmergencyKeyword(event.text, 'en');
    if (!matchedKeyword || !this.callbacks) return;

    const now = Date.now();
    if (now - this.lastTriggerAt < KEYWORD_TRIGGER_COOLDOWN_MS) {
      // Same utterance is still being finalized across multiple partial/
      // final events — don't re-trigger SOS for every one of them.
      return;
    }
    this.lastTriggerAt = now;

    console.log(
      `🚨 Real speech keyword match: "${matchedKeyword}" in recognized text "${event.text}" ` +
      `(confidence: ${event.confidence.toFixed(2)}, final: ${event.isFinal})`
    );

    this.callbacks.onKeywordDetected(matchedKeyword, 'en', {
      confidenceScore: event.confidence,
      modelTag: MODEL_TAG,
      // Not derived from real DSP in this pipeline: Vosk performs its own
      // internal (native, Kaldi-based) feature extraction and never hands
      // raw PCM back across the bridge, so there is no JS-side signal to
      // compute SNR/RMS from. Reporting 0 rather than a fabricated number.
      snrDb: 0,
      rmsDb: 0,
    });
  };

  private removeSubscriptions() {
    this.subscriptions.forEach((s) => s.remove());
    this.subscriptions = [];
    this.eventEmitter = null;
  }

  public async stopListening() {
    if (!this.isListening && this.subscriptions.length === 0) return;

    this.isListening = false;
    this.removeSubscriptions();

    if (this.callbacks) {
      this.callbacks.onStatusChange?.(false);
    }

    try {
      const nativeModule = this.getNativeModule();
      if (nativeModule) {
        await nativeModule.stopListening();
      }
      await emergencySOS.stopForegroundService();
    } catch (error) {
      console.error('Error stopping voice keyword detector:', error);
    }
    console.log('🎙️ Voice keyword detector stopped.');
  }

  /**
   * Manual test-only hook (used by TestEmergencyDetectionScreen). Bypasses
   * the real microphone/Vosk pipeline entirely and directly invokes the
   * detection callback — it does NOT exercise real audio capture or real
   * recognition, and must never be wired into any code path that decides a
   * real emergency happened.
   */
  public simulateEmergencySpeech(keyword: string, language: SupportedKeywordLanguage = 'en') {
    if (!this.callbacks) return;
    console.log(`🧪 [SIMULATED — not real audio] keyword "${keyword}" (${language})`);
    this.callbacks.onKeywordDetected(keyword, language, {
      confidenceScore: 1.0,
      modelTag: 'simulated',
      snrDb: 0,
      rmsDb: 0,
    });
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const voiceDetector = new VoiceKeywordDetector();
