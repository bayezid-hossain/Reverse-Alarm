package com.reversealarm.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.database.ContentObserver
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.content.pm.ServiceInfo
import android.provider.Settings
import androidx.core.app.NotificationCompat

class AlarmForegroundService : Service() {

    companion object {
        var isRunning = false
        const val CHANNEL_ID = "reverse_alarm_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_STOP_ALARM = "com.reversealarm.app.ACTION_STOP_ALARM"
    }

    private var mediaPlayer: MediaPlayer? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var currentAlarmId: String = ""
    private var volumeObserver: ContentObserver? = null
    private var isNormal: Boolean = false
    private var snoozeIntervalMinutes: Int = 5
    private var maxSnoozeCount: Int = 3
    private var snoozeCount: Int = 0

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        if (action == ACTION_STOP_ALARM) {
            stopSelf()
            return START_NOT_STICKY
        }

        // START_STICKY restart with null intent — only continue if alarm is still active
        if (intent == null) {
            val prefs = getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)
            val activeId = prefs.getString("triggered_alarm_id", null)
            if (activeId.isNullOrEmpty()) {
                stopSelf()
                return START_NOT_STICKY
            }
            currentAlarmId = activeId
        } else {
            currentAlarmId = intent.getStringExtra("alarmId") ?: ""
            isNormal = intent.getBooleanExtra("isNormal", false)
            snoozeIntervalMinutes = intent.getIntExtra("snoozeIntervalMinutes", 5)
            maxSnoozeCount = intent.getIntExtra("maxSnoozeCount", 3)
            snoozeCount = intent.getIntExtra("snoozeCount", 0)
        }

        val label = if (intent != null) intent.getStringExtra("label") ?: "ALARM" else "ALARM"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                buildNotification(label, currentAlarmId),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, buildNotification(label, currentAlarmId))
        }
        startAlarmAudio()
        registerVolumeObserver()

        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        unregisterVolumeObserver()
        stopAlarmAudio()
        releaseWakeLock()
    }

    private fun startAlarmAudio() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()

            val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            am.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0)

            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )
                val alarmUri = Settings.System.DEFAULT_ALARM_ALERT_URI
                setDataSource(this@AlarmForegroundService, alarmUri)
                isLooping = true
                prepare()
                start()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun stopAlarmAudio() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun registerVolumeObserver() {
        val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
        val handler = Handler(Looper.getMainLooper())

        volumeObserver = object : ContentObserver(handler) {
            override fun onChange(selfChange: Boolean) {
                val current = am.getStreamVolume(AudioManager.STREAM_ALARM)
                if (current < maxVol) {
                    am.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0)
                }
            }
        }
        contentResolver.registerContentObserver(
            Settings.System.CONTENT_URI,
            true,
            volumeObserver!!
        )
    }

    private fun unregisterVolumeObserver() {
        volumeObserver?.let { contentResolver.unregisterContentObserver(it) }
        volumeObserver = null
    }

    private fun acquireWakeLock() {
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "ReverseAlarm::ForegroundService"
        )
        wakeLock?.acquire(30 * 60 * 1000L)
    }

    private fun releaseWakeLock() {
        if (wakeLock?.isHeld == true) wakeLock?.release()
        wakeLock = null
    }

    private fun buildNotification(label: String, alarmId: String): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra("alarmId", alarmId)
        }
        val contentPi = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentIntent(contentPi)
            .setFullScreenIntent(contentPi, true)
            .setOngoing(true)
            .setAutoCancel(false)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setVibrate(longArrayOf(0, 500, 200, 500))

        if (isNormal) {
            builder.setContentTitle("ALARM — $label")
            builder.setContentText(
                if (snoozeCount < maxSnoozeCount)
                    "${maxSnoozeCount - snoozeCount} snooze(s) remaining"
                else
                    "No snoozes left — tap to dismiss"
            )

            if (snoozeCount < maxSnoozeCount) {
                val snoozeIntent = Intent(this, AlarmBroadcastReceiver::class.java).apply {
                    action = AlarmBroadcastReceiver.ACTION_SNOOZE
                    putExtra("alarmId", alarmId)
                }
                val snoozePi = PendingIntent.getBroadcast(
                    this, alarmId.hashCode() + 1, snoozeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                builder.addAction(android.R.drawable.ic_lock_idle_alarm, "SNOOZE ${snoozeIntervalMinutes}m", snoozePi)
            }

            val dismissIntent = Intent(this, AlarmBroadcastReceiver::class.java).apply {
                action = AlarmBroadcastReceiver.ACTION_DISMISS
                putExtra("alarmId", alarmId)
            }
            val dismissPi = PendingIntent.getBroadcast(
                this, alarmId.hashCode() + 2, dismissIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.addAction(android.R.drawable.ic_delete, "DISMISS", dismissPi)
        } else {
            builder.setContentTitle("ALARM — $label")
            builder.setContentText("Complete your mission to deactivate.")

            val missionIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("alarmId", alarmId)
            }
            val missionPi = PendingIntent.getActivity(
                this, 2, missionIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.addAction(android.R.drawable.ic_menu_send, "GO TO MISSION", missionPi)
        }

        return builder.build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Reverse Alarm",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Active alarm notifications"
                setBypassDnd(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }
}
