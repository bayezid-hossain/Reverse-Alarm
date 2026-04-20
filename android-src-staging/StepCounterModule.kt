package com.reversealarm.app

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class StepCounterModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    override fun getName() = "StepCounterModule"

    private var sensorManager: SensorManager? = null
    private var stepSensor: Sensor? = null
    private var accelSensor: Sensor? = null
    private var stepCount = 0
    private var listening = false
    private var lastStepTime = 0L
    private var latestMagnitude = 0.0f

    companion object {
        private const val MIN_STEP_INTERVAL_MS = 400L
        private const val SHAKE_THRESHOLD = 22.0f // m/s^2
    }

    @ReactMethod
    fun startCounting(promise: Promise) {
        if (listening) { promise.resolve(null); return }
        sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        stepSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
        accelSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

        if (stepSensor == null) {
            promise.reject("NO_SENSOR", "Step detector not available on this device")
            return
        }

        stepCount = 0
        lastStepTime = 0L
        
        sensorManager?.registerListener(this, stepSensor, SensorManager.SENSOR_DELAY_FASTEST)
        sensorManager?.registerListener(this, accelSensor, SensorManager.SENSOR_DELAY_GAME)
        
        listening = true
        promise.resolve(null)
    }

    @ReactMethod
    fun stopCounting(promise: Promise) {
        if (listening) {
            sensorManager?.unregisterListener(this)
            listening = false
        }
        promise.resolve(null)
    }

    @ReactMethod
    fun resetCount(promise: Promise) {
        stepCount = 0
        promise.resolve(null)
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_ACCELEROMETER) {
            val x = event.values[0]
            val y = event.values[1]
            val z = event.values[2]
            latestMagnitude = kotlin.math.sqrt(x * x + y * y + z * z.toDouble()).toFloat()
            return
        }

        if (event.sensor.type == Sensor.TYPE_STEP_DETECTOR) {
            val now = System.currentTimeMillis()
            
            // Filter 1: Temporal (Human pace limit)
            if (now - lastStepTime < MIN_STEP_INTERVAL_MS) return
            
            // Filter 2: Magnitude (Reject violent shaking)
            // Normal walking is ~15 m/s^2. Violent shaking is > 25.
            if (latestMagnitude > SHAKE_THRESHOLD) return

            lastStepTime = now
            stepCount++
            
            val params = Arguments.createMap().apply { putInt("count", stepCount) }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("StepDetected", params)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
