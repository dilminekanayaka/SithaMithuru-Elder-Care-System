package com.sithamithuru.voice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Minimal Android foreground service (type "microphone") that keeps the
 * process alive and mic-capable while the Elder app is monitoring for
 * emergency keywords in the background. This did not previously exist —
 * mobile/src/modules/EmergencySOSModule.ts already called
 * startForegroundService()/stopForegroundService(), but NativeModules
 * .EmergencySOSModule was undefined, so those calls were silent no-ops.
 *
 * Actual microphone capture happens in VoiceKeywordModule/Vosk's
 * SpeechService; this service's only job is to hold the required Android
 * foreground-service-with-microphone-type state so the OS doesn't kill
 * mic access once the app is backgrounded (required on Android 9+, and a
 * declared foregroundServiceType is required on Android 14+).
 */
class EmergencyListeningService : Service() {

  companion object {
    const val CHANNEL_ID = "sithamithuru_emergency_listening"
    const val NOTIFICATION_ID = 4201
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
    return START_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    super.onDestroy()
  }

  private fun buildNotification(): Notification {
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("SithaMithuru")
      .setContentText("Listening for emergency keywords")
      .setSmallIcon(android.R.drawable.ic_btn_speak_now)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_MIN)
      .build()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Emergency Keyword Listening",
        NotificationManager.IMPORTANCE_MIN
      ).apply {
        description = "Ongoing notification while SithaMithuru listens for emergency keywords"
      }
      val manager = getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
  }
}
