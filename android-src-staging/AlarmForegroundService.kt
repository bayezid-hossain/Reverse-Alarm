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
import android.media.Ringtone
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
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
    private var ringtone: Ringtone? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var currentAlarmId: String = ""
    private var volumeObserver: ContentObserver? = null
    private var isNormal: Boolean = false
    private var snoozeIntervalMinutes: Int = 5
    private var maxSnoozeCount: Int = 3
    private var snoozeCount: Int = 0
    private var ringtoneUri: String? = null
    private var currentlyPlayingUri: String? = null
    private var vibrator: Vibrator? = null

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

        val alarmId = intent?.getStringExtra("alarmId") ?: run {
            val prefs = getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)
            prefs.getString("triggered_alarm_id", null)
        } ?: ""

        currentAlarmId = alarmId

        if (alarmId.isNotEmpty()) {
            val prefs = getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)
            val extrasJson = prefs.getString("alarm_extras_$alarmId", null)
            val extras = extrasJson?.let { org.json.JSONObject(it) }
            
            if (extras != null) {
                isNormal = extras.optBoolean("isNormal", false)
                snoozeIntervalMinutes = extras.optInt("snoozeIntervalMinutes", 5)
                maxSnoozeCount = extras.optInt("maxSnoozeCount", 3)
                ringtoneUri = if (extras.has("ringtoneUri") && !extras.isNull("ringtoneUri")) extras.getString("ringtoneUri") else null
            } else {
                // Fallback to intent extras if SharedPreferences are missing for some reason
                isNormal = intent?.getBooleanExtra("isNormal", false) ?: false
                snoozeIntervalMinutes = intent?.getIntExtra("snoozeIntervalMinutes", 5) ?: 5
                maxSnoozeCount = intent?.getIntExtra("maxSnoozeCount", 3) ?: 3
                ringtoneUri = intent?.getStringExtra("ringtoneUri")
            }
            snoozeCount = prefs.getInt("snooze_count_$alarmId", 0)
        }

        //android.util.Log.d("AlarmService", "onStartCommand: alarmId=$currentAlarmId, ringtoneUri=$ringtoneUri")

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
        // Guard against the literal string "null" that JSONObject.optString can produce
        val safeRingtoneUri = ringtoneUri?.takeIf { it.isNotEmpty() && it != "null" }
        val targetUriStr = safeRingtoneUri ?: Settings.System.DEFAULT_ALARM_ALERT_URI.toString()

        if ((ringtone?.isPlaying == true || mediaPlayer?.isPlaying == true) && currentlyPlayingUri == targetUriStr) {
            //android.util.Log.d("AlarmService", "startAlarmAudio: Already playing $targetUriStr, skipping restart")
            return
        }

        stopAlarmAudio()
        currentlyPlayingUri = targetUriStr

        val am = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        am.setStreamVolume(AudioManager.STREAM_ALARM, am.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0)

        val targetUri: Uri = Uri.parse(targetUriStr)

        //android.util.Log.d("AlarmService", "startAlarmAudio: ringtoneUri=$ringtoneUri, safeUri=$safeRingtoneUri, targetUri=$targetUri")

        val alarmAttrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
            .build()

        // API 28+: Ringtone handles content:// URIs with proper permissions and supports looping.
        // Skip for android.resource:// — RingtoneManager cannot play raw app resources reliably.
        val isRawResource = targetUri.scheme == "android.resource"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && !isRawResource) {
            try {
                //android.util.Log.d("AlarmService", "Attempting RingtoneManager with targetUri=$targetUri")
                ringtone = RingtoneManager.getRingtone(this, targetUri)?.also { rt ->
                    rt.audioAttributes = alarmAttrs
                    rt.isLooping = true
                    //android.util.Log.d("AlarmService", "Ringtone object created, calling play()")
                    rt.play()
                }
                if (ringtone != null) {
                    //android.util.Log.d("AlarmService", "Ringtone playback started successfully")
                    startVibration()
                    return
                } else {
                    //android.util.Log.d("AlarmService", "RingtoneManager returned null")
                }
            } catch (e: Exception) {
                android.util.Log.e("AlarmService", "RingtoneManager failed: ${e.message}")
                e.printStackTrace()
            }
        }

        // API < 28 or Ringtone unavailable: use MediaPlayer, fallback to default if custom URI fails
        fun tryMediaPlayer(uri: Uri): Boolean {
            //android.util.Log.d("AlarmService", "Attempting MediaPlayer with uri=$uri")
            return try {
                mediaPlayer = MediaPlayer().apply {
                    setAudioAttributes(alarmAttrs)
                    setDataSource(this@AlarmForegroundService, uri)
                    isLooping = true
                    prepare()
                    start()
                }
                //android.util.Log.d("AlarmService", "MediaPlayer started successfully")
                true
            } catch (e: Exception) {
                android.util.Log.e("AlarmService", "MediaPlayer failed for $uri: ${e.message}")
                e.printStackTrace()
                mediaPlayer?.release()
                mediaPlayer = null
                false
            }
        }

        val played = tryMediaPlayer(targetUri)
        if (!played && !ringtoneUri.isNullOrEmpty()) {
            //android.util.Log.d("AlarmService", "Custom URI failed, falling back to system default")
            tryMediaPlayer(Settings.System.DEFAULT_ALARM_ALERT_URI)
        }

        startVibration()
    }

    private fun startVibration() {
        try {
            val vibratorService = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }
            vibrator = vibratorService
            val pattern = longArrayOf(0, 1000, 1000)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (_: Exception) {}
    }

    private fun stopAlarmAudio() {
        currentlyPlayingUri = null
        try { ringtone?.stop(); ringtone = null } catch (_: Exception) {}
        try { mediaPlayer?.stop(); mediaPlayer?.release(); mediaPlayer = null } catch (_: Exception) {}
        try { vibrator?.cancel(); vibrator = null } catch (_: Exception) {}
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
                setSound(null, null) // Disable channel sound to use custom player
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            //android.util.Log.d("AlarmService", "Creating/Updating notification channel with sound=null")
            nm.createNotificationChannel(channel)
        }
    }
}
