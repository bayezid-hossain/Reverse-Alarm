package com.reversealarm.app

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SpeechRecognitionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SpeechRecognitionModule"

    private var recognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var lastPartial: String? = null

    private fun emit(event: String, payload: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, payload)
    }

    @ReactMethod
    fun startListening(locale: String, promise: Promise) {
        mainHandler.post {
            try {
                destroyRecognizer()
                recognizer = SpeechRecognizer.createSpeechRecognizer(reactContext).apply {
                    setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) {
                            emit("SpeechStart", Arguments.createMap())
                        }
                        override fun onBeginningOfSpeech() {}
                        override fun onRmsChanged(rmsdB: Float) {
                            Arguments.createMap().apply { putDouble("value", rmsdB.toDouble()) }
                                .let { emit("SpeechVolumeChanged", it) }
                        }
                        override fun onBufferReceived(buffer: ByteArray?) {}
                        override fun onEndOfSpeech() {
                            emit("SpeechEnd", Arguments.createMap())
                        }
                        override fun onError(error: Int) {
                            // If recognition timed out or found no match but we captured partials,
                            // treat the partial as the final result instead of emitting an error
                            val partial = lastPartial
                            if ((error == SpeechRecognizer.ERROR_NO_MATCH ||
                                 error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) &&
                                !partial.isNullOrBlank()) {
                                val valueArr = Arguments.createArray().apply { pushString(partial) }
                                val confArr = Arguments.createArray().apply { pushDouble(0.75) }
                                Arguments.createMap().apply {
                                    putArray("value", valueArr)
                                    putArray("confidence", confArr)
                                }.let { emit("SpeechResults", it) }
                                emit("SpeechEnd", Arguments.createMap())
                                return
                            }
                            val msg = speechErrorString(error)
                            Arguments.createMap().apply { putString("message", msg) }
                                .let { emit("SpeechError", it) }
                        }
                        override fun onResults(results: Bundle?) {
                            val matches = results
                                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                                ?: return
                            val confidences = results
                                .getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES)

                            val valueArr = Arguments.createArray()
                            matches.forEach { valueArr.pushString(it) }

                            val confArr = Arguments.createArray()
                            confidences?.forEach { confArr.pushDouble(it.toDouble()) }
                                ?: matches.forEach { confArr.pushDouble(0.0) }

                            Arguments.createMap().apply {
                                putArray("value", valueArr)
                                putArray("confidence", confArr)
                            }.let { emit("SpeechResults", it) }

                            emit("SpeechEnd", Arguments.createMap())
                        }
                        override fun onPartialResults(partial: Bundle?) {
                            val matches = partial
                                ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                                ?: return
                            if (matches.isNotEmpty()) lastPartial = matches[0]
                            val arr = Arguments.createArray()
                            matches.forEach { arr.pushString(it) }
                            Arguments.createMap().apply { putArray("value", arr) }
                                .let { emit("SpeechPartialResults", it) }
                        }
                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                }

                lastPartial = null
                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                    // Allow up to 25 seconds of continuous speech before silence detection ends it
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 25_000L)
                    // Wait 3 seconds of silence before considering speech complete
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 3_000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2_000L)
                    // Force online recognition for better accuracy
                    putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, false)
                }
                recognizer?.startListening(intent)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("START_FAILED", e.message)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        mainHandler.post {
            recognizer?.stopListening()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun cancel(promise: Promise) {
        mainHandler.post {
            recognizer?.cancel()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun destroy(promise: Promise) {
        mainHandler.post {
            destroyRecognizer()
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    private fun destroyRecognizer() {
        recognizer?.destroy()
        recognizer = null
    }

    private fun speechErrorString(code: Int) = when (code) {
        SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
        SpeechRecognizer.ERROR_CLIENT -> "Client error"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
        SpeechRecognizer.ERROR_NETWORK -> "Network error"
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
        SpeechRecognizer.ERROR_NO_MATCH -> "No speech match"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognizer busy"
        SpeechRecognizer.ERROR_SERVER -> "Server error"
        SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Speech timeout"
        else -> "Unknown error ($code)"
    }

    override fun onCatalystInstanceDestroy() {
        mainHandler.post { destroyRecognizer() }
    }
}
