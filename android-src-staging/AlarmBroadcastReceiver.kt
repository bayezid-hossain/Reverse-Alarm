package com.reversealarm.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

class AlarmBroadcastReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra("alarmId") ?: return
        val label = intent.getStringExtra("label") ?: "ALARM"

        // Persist triggered alarm so JS can pick it up even if app was killed
        context.getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)
            .edit()
            .putString("triggered_alarm_id", alarmId)
            .apply()

        // Start foreground service (audio + wake lock)
        val serviceIntent = Intent(context, AlarmForegroundService::class.java).apply {
            putExtra("alarmId", alarmId)
            putExtra("label", label)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }

        // Emit AlarmTriggered event to JS if app is running
        emitAlarmTriggeredEvent(context, alarmId)
    }

    private fun emitAlarmTriggeredEvent(context: Context, alarmId: String) {
        val params = Arguments.createMap().apply { putString("alarmId", alarmId) }
        try {
            val app = context.applicationContext as ReactApplication
            // New architecture path
            val reactContext = app.reactHost?.currentReactContext
            if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("AlarmTriggered", params)
                return
            }
        } catch (_: Exception) {}

        try {
            val app = context.applicationContext as ReactApplication
            // Legacy architecture path
            val host = app.reactNativeHost
            if (!host.hasInstance()) return
            val reactContext = host.reactInstanceManager.currentReactContext ?: return
            if (!reactContext.hasActiveCatalystInstance()) return
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("AlarmTriggered", params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
