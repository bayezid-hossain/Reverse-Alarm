package com.reversealarm.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

class AlarmBroadcastReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_SNOOZE = "com.reversealarm.app.ACTION_SNOOZE"
        const val ACTION_DISMISS = "com.reversealarm.app.ACTION_DISMISS"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("alarmId") ?: return

        when (intent.action) {
            ACTION_SNOOZE -> handleSnooze(context, alarmId)
            ACTION_DISMISS -> handleDismiss(context, alarmId)
            else -> handleAlarmFired(context, intent, alarmId)
        }
    }

    private fun handleAlarmFired(context: Context, intent: Intent, alarmId: String) {
        val label = intent.getStringExtra("label") ?: "ALARM"
        val prefs = context.getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)

        prefs.edit().putString("triggered_alarm_id", alarmId).apply()

        // Read stored extras
        val extrasJson = prefs.getString("alarm_extras_$alarmId", null)
        val extras = extrasJson?.let { JSONObject(it) }
        val isNormal = extras?.optBoolean("isNormal", false) ?: false
        val snoozeIntervalMinutes = extras?.optInt("snoozeIntervalMinutes", 5) ?: 5
        val maxSnoozeCount = extras?.optInt("maxSnoozeCount", 3) ?: 3
        val ringtoneUri = extras?.let { if (it.has("ringtoneUri") && !it.isNull("ringtoneUri")) it.getString("ringtoneUri") else null }
        val snoozeCount = prefs.getInt("snooze_count_$alarmId", 0)

        //android.util.Log.d("AlarmReceiver", "handleAlarmFired: alarmId=$alarmId, extrasJson=$extrasJson, ringtoneUri=$ringtoneUri")

        val serviceIntent = Intent(context, AlarmForegroundService::class.java).apply {
            putExtra("alarmId", alarmId)
            putExtra("label", label)
            putExtra("isNormal", isNormal)
            putExtra("snoozeIntervalMinutes", snoozeIntervalMinutes)
            putExtra("maxSnoozeCount", maxSnoozeCount)
            putExtra("snoozeCount", snoozeCount)
            if (!ringtoneUri.isNullOrEmpty()) putExtra("ringtoneUri", ringtoneUri)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        emitEvent(context, "AlarmTriggered", alarmId)
    }

    private fun handleSnooze(context: Context, alarmId: String) {
        val prefs = context.getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)
        val extrasJson = prefs.getString("alarm_extras_$alarmId", null)
        val snoozeIntervalMinutes = extrasJson?.let { JSONObject(it).optInt("snoozeIntervalMinutes", 5) } ?: 5
        val snoozeCount = prefs.getInt("snooze_count_$alarmId", 0)

        // Increment snooze count
        prefs.edit().putInt("snooze_count_$alarmId", snoozeCount + 1).apply()

        // Stop the foreground service
        context.stopService(Intent(context, AlarmForegroundService::class.java))

        // Reschedule alarm via AlarmManager
        val triggerAtMs = System.currentTimeMillis() + snoozeIntervalMinutes * 60_000L
        val fireIntent = Intent(context, AlarmBroadcastReceiver::class.java).apply {
            putExtra("alarmId", alarmId)
            putExtra("label", prefs.getString("alarm_label_$alarmId", "ALARM") ?: "ALARM")
        }
        val pi = PendingIntent.getBroadcast(
            context,
            alarmId.hashCode(),
            fireIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && am.canScheduleExactAlarms()) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi)
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMs, pi)
        }

        // Emit to JS for store update
        val params = Arguments.createMap().apply {
            putString("alarmId", alarmId)
            putInt("snoozeCount", snoozeCount + 1)
            putDouble("nextTriggerAt", triggerAtMs.toDouble())
        }
        emitEventMap(context, "AlarmSnoozedFromNotification", params)
    }

    private fun handleDismiss(context: Context, alarmId: String) {
        // Stop the foreground service
        context.stopService(Intent(context, AlarmForegroundService::class.java))

        // Clear triggered state so service won't restart via START_STICKY
        context.getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)
            .edit().remove("triggered_alarm_id").apply()

        // Emit to JS for store update
        emitEvent(context, "AlarmDismissedFromNotification", alarmId)
    }

    private fun emitEvent(context: Context, event: String, alarmId: String) {
        val params = Arguments.createMap().apply { putString("alarmId", alarmId) }
        emitEventMap(context, event, params)
    }

    private fun emitEventMap(context: Context, event: String, params: com.facebook.react.bridge.WritableMap) {
        try {
            val app = context.applicationContext as ReactApplication
            val reactContext = app.reactHost?.currentReactContext
            if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(event, params)
                return
            }
        } catch (_: Exception) {}
        try {
            val app = context.applicationContext as ReactApplication
            val host = app.reactNativeHost
            if (!host.hasInstance()) return
            val reactContext = host.reactInstanceManager.currentReactContext ?: return
            if (!reactContext.hasActiveCatalystInstance()) return
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(event, params)
        } catch (_: Exception) {}
    }
}
