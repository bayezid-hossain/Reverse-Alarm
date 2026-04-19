package com.reversealarm.app

import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.*

class ForegroundServiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ForegroundServiceModule"

    @ReactMethod
    fun startService(params: ReadableMap, promise: Promise) {
        try {
            val alarmId = params.getString("alarmId") ?: ""
            val label = params.getString("label") ?: "ALARM"

            val intent = Intent(reactContext, AlarmForegroundService::class.java).apply {
                putExtra("alarmId", alarmId)
                putExtra("label", label)
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("START_FAILED", e.message)
        }
    }

    @ReactMethod
    fun stopService(promise: Promise) {
        try {
            reactContext.stopService(Intent(reactContext, AlarmForegroundService::class.java))
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("STOP_FAILED", e.message)
        }
    }

    @ReactMethod
    fun isRunning(promise: Promise) {
        promise.resolve(AlarmForegroundService.isRunning)
    }
}
