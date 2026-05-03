package com.reversealarm.app

import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*

class RingtoneModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "RingtoneModule"

    private var previewPlayer: MediaPlayer? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    @ReactMethod
    fun getAlarmRingtones(promise: Promise) {
        try {
            val manager = RingtoneManager(reactContext).apply {
                setType(RingtoneManager.TYPE_ALARM)
            }
            val cursor = manager.cursor
            val result = Arguments.createArray()
            while (cursor.moveToNext()) {
                val uri = manager.getRingtoneUri(cursor.position).toString()
                val title = cursor.getString(RingtoneManager.TITLE_COLUMN_INDEX)
                val map = Arguments.createMap().apply {
                    putString("uri", uri)
                    putString("title", title)
                }
                result.pushMap(map)
            }
            cursor.close()
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("RINGTONE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun playPreview(uri: String) {
        mainHandler.post {
            try {
                stopPlayer()
                previewPlayer = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    setDataSource(reactContext, Uri.parse(uri))
                    isLooping = false
                    prepare()
                    start()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    @ReactMethod
    fun stopPreview(promise: Promise) {
        mainHandler.post {
            stopPlayer()
        }
        promise.resolve(null)
    }

    private fun stopPlayer() {
        try {
            previewPlayer?.stop()
            previewPlayer?.release()
            previewPlayer = null
        } catch (_: Exception) {}
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
