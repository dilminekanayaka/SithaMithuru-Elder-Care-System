package com.sithamithuru.voice

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Backs mobile/src/modules/EmergencySOSModule.ts's
 * startForegroundService()/stopForegroundService() calls, which previously
 * had no native implementation at all (NativeModules.EmergencySOSModule was
 * undefined, so every call silently returned false).
 */
class EmergencySOSModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "EmergencySOSModule"

  @ReactMethod
  fun startForegroundService(promise: Promise) {
    try {
      val intent = Intent(reactApplicationContext, EmergencyListeningService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        reactApplicationContext.startForegroundService(intent)
      } else {
        reactApplicationContext.startService(intent)
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("START_FOREGROUND_SERVICE_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun stopForegroundService(promise: Promise) {
    try {
      val intent = Intent(reactApplicationContext, EmergencyListeningService::class.java)
      reactApplicationContext.stopService(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("STOP_FOREGROUND_SERVICE_FAILED", e.message, e)
    }
  }
}
