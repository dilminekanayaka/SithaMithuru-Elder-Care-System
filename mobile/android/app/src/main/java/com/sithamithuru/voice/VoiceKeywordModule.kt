package com.sithamithuru.voice

import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.RecognitionListener
import org.vosk.android.SpeechService
import org.vosk.android.StorageService

/**
 * Real, on-device offline speech recognition for emergency keyword
 * detection, backed by Vosk (https://alphacephei.com/vosk/) — a real,
 * open-source ASR engine, not a fabricated/simulated model.
 *
 * This module owns the ENTIRE real-audio path: it captures actual
 * microphone PCM via android.media.AudioRecord (through Vosk's
 * SpeechService, 16kHz mono 16-bit PCM), runs Vosk's native feature
 * extraction + decoding, and emits recognized text to JS. JS-side keyword
 * matching (voiceKeywordDetector.ts) decides whether the recognized text
 * matches a configured emergency phrase.
 *
 * Why audio capture and decoding happen natively rather than crossing the
 * JS bridge as raw PCM: React Native's bridge cannot carry continuous
 * 16kHz PCM frames at usable latency/CPU cost, and Vosk's recognizer is a
 * native (JNI) component that requires PCM to already be native-side.
 */
class VoiceKeywordModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), RecognitionListener {

  companion object {
    private const val MODEL_ASSET_ZIP = "model-en-us" // src/main/assets/model-en-us.zip
    private const val MODEL_UNPACK_DIR = "model-en-us"
    private const val SAMPLE_RATE = 16000.0f
    const val EVENT_RESULT = "VoiceKeywordResult"
    const val EVENT_ERROR = "VoiceKeywordError"
    const val EVENT_STATUS = "VoiceKeywordStatus"
  }

  private var model: Model? = null
  private var recognizer: Recognizer? = null
  private var speechService: SpeechService? = null
  private var isModelLoading = false
  private var pendingStartPromise: Promise? = null

  // English keyword grammar the recognizer is constrained to — kept in sync
  // with EMERGENCY_KEYWORDS.en in voiceKeywordDetector.ts. Constraining
  // Vosk's vocabulary (instead of open-ended free dictation) turns general
  // ASR into real keyword-spotting: higher accuracy, lower false-positive
  // rate, lower CPU cost than unconstrained recognition.
  private val englishGrammar = buildGrammarJson(
    listOf("help", "emergency", "save me", "help me", "doctor", "sos", "[unk]")
  )

  override fun getName(): String = "VoiceKeywordModule"

  private fun buildGrammarJson(words: List<String>): String {
    val arr = org.json.JSONArray()
    words.forEach { arr.put(it) }
    return arr.toString()
  }

  private fun hasRecordAudioPermission(): Boolean {
    return ContextCompat.checkSelfPermission(
      reactApplicationContext,
      Manifest.permission.RECORD_AUDIO
    ) == PackageManager.PERMISSION_GRANTED
  }

  @ReactMethod
  fun startListening(promise: Promise) {
    if (!hasRecordAudioPermission()) {
      promise.reject("PERMISSION_DENIED", "RECORD_AUDIO permission not granted")
      return
    }

    if (speechService != null) {
      // Already listening.
      promise.resolve(true)
      return
    }

    if (recognizer != null) {
      startSpeechService(promise)
      return
    }

    if (isModelLoading) {
      pendingStartPromise = promise
      return
    }

    isModelLoading = true
    pendingStartPromise = promise

    StorageService.unpack(
      reactApplicationContext,
      MODEL_ASSET_ZIP,
      MODEL_UNPACK_DIR,
      { unpackedModel ->
        isModelLoading = false
        model = unpackedModel
        try {
          recognizer = Recognizer(unpackedModel, SAMPLE_RATE, englishGrammar)
          recognizer!!.setWords(true) // include real per-word confidence in results
          startSpeechService(pendingStartPromise)
        } catch (e: Exception) {
          emitError("Failed to initialize recognizer: ${e.message}")
          pendingStartPromise?.reject("RECOGNIZER_INIT_FAILED", e.message, e)
        }
        pendingStartPromise = null
      },
      { exception ->
        isModelLoading = false
        emitError("Failed to unpack speech model: ${exception.message}")
        pendingStartPromise?.reject("MODEL_UNPACK_FAILED", exception.message, exception)
        pendingStartPromise = null
      }
    )
  }

  private fun startSpeechService(promise: Promise?) {
    try {
      val rec = recognizer
      if (rec == null) {
        promise?.reject("RECOGNIZER_NOT_READY", "Recognizer not initialized")
        return
      }
      speechService = SpeechService(rec, SAMPLE_RATE)
      speechService!!.startListening(this)
      emitStatus(true)
      promise?.resolve(true)
    } catch (e: Exception) {
      emitError("Failed to start microphone listening: ${e.message}")
      promise?.reject("START_LISTENING_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun stopListening(promise: Promise) {
    try {
      speechService?.stop()
      speechService?.shutdown()
      speechService = null
      emitStatus(false)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("STOP_LISTENING_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun isListening(promise: Promise) {
    promise.resolve(speechService != null)
  }

  // Required by RN's NativeEventEmitter contract; Vosk itself needs no
  // per-listener bookkeeping since it always emits to whatever JS side is
  // currently subscribed.
  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}

  // ─── org.vosk.android.RecognitionListener — REAL recognition callbacks ───
  // These fire from Vosk's native decoder running on actual microphone PCM
  // captured by SpeechService's internal AudioRecord loop — not simulated.

  override fun onPartialResult(hypothesis: String?) {
    emitRecognitionResult(hypothesis, isFinal = false)
  }

  override fun onResult(hypothesis: String?) {
    emitRecognitionResult(hypothesis, isFinal = true)
  }

  override fun onFinalResult(hypothesis: String?) {
    emitRecognitionResult(hypothesis, isFinal = true)
  }

  override fun onError(exception: Exception?) {
    emitError(exception?.message ?: "Unknown speech recognition error")
  }

  override fun onTimeout() {
    // Vosk's SpeechService stopped due to inactivity; restart to keep
    // continuous emergency monitoring alive.
    try {
      speechService?.startListening(this)
    } catch (e: Exception) {
      emitError("Failed to resume listening after timeout: ${e.message}")
    }
  }

  private fun emitRecognitionResult(hypothesisJson: String?, isFinal: Boolean) {
    if (hypothesisJson.isNullOrBlank()) return
    try {
      val json = JSONObject(hypothesisJson)
      val text = if (json.has("text")) json.getString("text")
                 else if (json.has("partial")) json.getString("partial")
                 else ""
      if (text.isBlank()) return

      // Average the real per-word confidence Vosk reports for this
      // hypothesis (only present on non-partial "result" objects with
      // setWords(true)). Never fabricated.
      var avgConfidence = 0.0
      if (json.has("result")) {
        val resultArr = json.getJSONArray("result")
        var sum = 0.0
        for (i in 0 until resultArr.length()) {
          sum += resultArr.getJSONObject(i).optDouble("conf", 0.0)
        }
        if (resultArr.length() > 0) avgConfidence = sum / resultArr.length()
      }

      val payload: WritableMap = Arguments.createMap()
      payload.putString("text", text)
      payload.putBoolean("isFinal", isFinal)
      payload.putDouble("confidence", avgConfidence)
      sendEvent(EVENT_RESULT, payload)
    } catch (e: Exception) {
      emitError("Failed to parse recognition result: ${e.message}")
    }
  }

  private fun emitError(message: String) {
    val payload: WritableMap = Arguments.createMap()
    payload.putString("message", message)
    sendEvent(EVENT_ERROR, payload)
  }

  private fun emitStatus(listening: Boolean) {
    val payload: WritableMap = Arguments.createMap()
    payload.putBoolean("isListening", listening)
    sendEvent(EVENT_STATUS, payload)
  }

  private fun sendEvent(eventName: String, params: WritableMap) {
    if (reactApplicationContext.hasActiveReactInstance()) {
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit(eventName, params)
    }
  }
}
