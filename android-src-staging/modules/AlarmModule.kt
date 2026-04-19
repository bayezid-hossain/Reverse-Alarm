package com.reversealarm.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class AlarmModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "AlarmModule"

    private fun getPrefs() =
        reactContext.getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)

    // ── Schedule ──────────────────────────────────────────────────────────────

    @ReactMethod
    fun scheduleAlarm(params: ReadableMap, promise: Promise) {
        try {
            val alarmId = params.getString("alarmId") ?: throw Exception("alarmId required")
            val triggerAtMs = params.getDouble("triggerAtMs").toLong()
            val label = params.getString("label") ?: "ALARM"
            val volume = if (params.hasKey("volume")) params.getInt("volume") else 100

            val am = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                promise.reject("PERMISSION_DENIED", "SCHEDULE_EXACT_ALARM not granted — direct user to Settings")
                return
            }

            val intent = Intent(reactContext, AlarmBroadcastReceiver::class.java).apply {
                putExtra("alarmId", alarmId)
                putExtra("label", label)
                putExtra("volume", volume)
            }

            val pi = PendingIntent.getBroadcast(
                reactContext,
                alarmId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi)
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAtMs, pi)
            }

            // Persist to SharedPreferences so BootReceiver can reschedule after reboot
            savePendingAlarm(alarmId, triggerAtMs)

            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("SCHEDULE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun cancelAlarm(alarmId: String, promise: Promise) {
        try {
            val intent = Intent(reactContext, AlarmBroadcastReceiver::class.java)
            val pi = PendingIntent.getBroadcast(
                reactContext,
                alarmId.hashCode(),
                intent,
                PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            )
            if (pi != null) {
                val am = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
                am.cancel(pi)
                pi.cancel()
            }
            removePendingAlarm(alarmId)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CANCEL_FAILED", e.message)
        }
    }

    @ReactMethod
    fun cancelAllAlarms(promise: Promise) {
        try {
            val prefs = getPrefs()
            val pendingJson = prefs.getString("pending_alarms", "[]") ?: "[]"
            val arr = JSONArray(pendingJson)
            val am = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            for (i in 0 until arr.length()) {
                val alarmId = arr.getJSONObject(i).getString("id")
                val intent = Intent(reactContext, AlarmBroadcastReceiver::class.java)
                val pi = PendingIntent.getBroadcast(
                    reactContext,
                    alarmId.hashCode(),
                    intent,
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                )
                if (pi != null) {
                    am.cancel(pi)
                    pi.cancel()
                }
            }
            prefs.edit().remove("pending_alarms").apply()
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("CANCEL_ALL_FAILED", e.message)
        }
    }

    @ReactMethod
    fun getPendingAlarms(promise: Promise) {
        try {
            val pendingJson = getPrefs().getString("pending_alarms", "[]") ?: "[]"
            val arr = JSONArray(pendingJson)
            val result = Arguments.createArray()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val map = Arguments.createMap().apply {
                    putString("id", obj.getString("id"))
                    putDouble("triggerAtMs", obj.getLong("triggerAtMs").toDouble())
                }
                result.pushMap(map)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.resolve(Arguments.createArray())
        }
    }

    // ── Triggered alarm handoff ───────────────────────────────────────────────

    @ReactMethod
    fun getTriggeredAlarm(promise: Promise) {
        val alarmId = getPrefs().getString("triggered_alarm_id", null)
        if (alarmId != null) {
            val result = Arguments.createMap().apply { putString("alarmId", alarmId) }
            promise.resolve(result)
        } else {
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun clearTriggeredAlarm(promise: Promise) {
        getPrefs().edit().remove("triggered_alarm_id").apply()
        promise.resolve(null)
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private fun savePendingAlarm(alarmId: String, triggerAtMs: Long) {
        val prefs = getPrefs()
        val existing = prefs.getString("pending_alarms", "[]") ?: "[]"
        val arr = JSONArray(existing)
        val filtered = JSONArray()
        for (i in 0 until arr.length()) {
            if (arr.getJSONObject(i).getString("id") != alarmId) {
                filtered.put(arr.getJSONObject(i))
            }
        }
        filtered.put(JSONObject().apply {
            put("id", alarmId)
            put("triggerAtMs", triggerAtMs)
        })
        prefs.edit().putString("pending_alarms", filtered.toString()).apply()
    }

    private fun removePendingAlarm(alarmId: String) {
        val prefs = getPrefs()
        val existing = prefs.getString("pending_alarms", "[]") ?: "[]"
        val arr = JSONArray(existing)
        val filtered = JSONArray()
        for (i in 0 until arr.length()) {
            if (arr.getJSONObject(i).getString("id") != alarmId) {
                filtered.put(arr.getJSONObject(i))
            }
        }
        prefs.edit().putString("pending_alarms", filtered.toString()).apply()
    }

    // ── RN Event Emitter boilerplate ──────────────────────────────────────────

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    fun sendAlarmTriggeredEvent(alarmId: String) {
        val params = Arguments.createMap().apply { putString("alarmId", alarmId) }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AlarmTriggered", params)
    }
}
