package com.reversealarm.app

import android.content.Context
import android.media.AudioManager
import com.facebook.react.bridge.*

class VolumeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "VolumeModule"

    private var savedVolume: Int = -1

    private fun audioManager(): AudioManager =
        reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    @ReactMethod
    fun setMaxVolume(promise: Promise) {
        try {
            val am = audioManager()
            savedVolume = am.getStreamVolume(AudioManager.STREAM_ALARM)
            val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            am.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("VOLUME_FAILED", e.message)
        }
    }

    @ReactMethod
    fun restoreVolume(promise: Promise) {
        try {
            if (savedVolume >= 0) {
                audioManager().setStreamVolume(AudioManager.STREAM_ALARM, savedVolume, 0)
                savedVolume = -1
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RESTORE_FAILED", e.message)
        }
    }

    @ReactMethod
    fun setVolume(level: Int, promise: Promise) {
        try {
            val am = audioManager()
            val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM)
            val scaled = (level / 100f * maxVol).toInt().coerceIn(0, maxVol)
            am.setStreamVolume(AudioManager.STREAM_ALARM, scaled, 0)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("VOLUME_FAILED", e.message)
        }
    }
}
