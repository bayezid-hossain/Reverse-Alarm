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
            // Add custom raw sounds
            val customSounds = listOf(
                "fire_alarm" to "Fire Alarm (High Pitch)",
                "drunk_arpeggio" to "Drunk Arpeggio",
                "industrial_sequence" to "Industrial Cinematic",
                "siren" to "Emergency Siren",
                "universfield_ringtone" to "High Pitched Ringtone"
            )
            val packageName = reactContext.packageName
            for ((resName, label) in customSounds) {
                val uri = "android.resource://$packageName/raw/$resName"
                //android.util.Log.d("RingtoneModule", "Adding custom sound: title=$label, uri=$uri")
                val map = Arguments.createMap().apply {
                    putString("uri", uri)
                    putString("title", "[Reverse] $label")
                }
                result.pushMap(map)
            }

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
                val parsedUri = Uri.parse(uri)
                previewPlayer = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    
                    if (parsedUri.scheme == "android.resource") {
                        val resName = parsedUri.lastPathSegment
                        val resId = if (resName != null) {
                            reactContext.resources.getIdentifier(resName, "raw", reactContext.packageName)
                        } else 0
                        if (resId > 0) {
                            val afd = reactContext.resources.openRawResourceFd(resId)
                            setDataSource(afd.fileDescriptor, afd.startOffset, afd.declaredLength)
                            afd.close()
                        } else {
                            setDataSource(reactContext, parsedUri)
                        }
                    } else {
                        setDataSource(reactContext, parsedUri)
                    }
                    
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
