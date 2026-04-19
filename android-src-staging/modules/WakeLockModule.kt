package com.reversealarm.app

import android.content.Context
import android.os.PowerManager
import com.facebook.react.bridge.*

class WakeLockModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WakeLockModule"

    private var wakeLock: PowerManager.WakeLock? = null

    @ReactMethod
    fun acquire(tag: String, promise: Promise) {
        try {
            val pm = reactContext.getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock?.release()
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ReverseAlarm::$tag")
            wakeLock?.acquire(30 * 60 * 1000L) // 30 min max
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("WAKELOCK_FAILED", e.message)
        }
    }

    @ReactMethod
    fun release(promise: Promise) {
        try {
            if (wakeLock?.isHeld == true) wakeLock?.release()
            wakeLock = null
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RELEASE_FAILED", e.message)
        }
    }
}
