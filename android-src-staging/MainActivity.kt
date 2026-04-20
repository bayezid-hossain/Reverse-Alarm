package com.reversealarm.app

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.modules.core.DeviceEventManagerModule
import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {

    companion object {
        var isAlarmLocked = false
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
            DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
        )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        handleAlarmIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAlarmIntent(intent)
    }

    private fun handleAlarmIntent(intent: Intent?) {
        val alarmId = intent?.getStringExtra("alarmId") ?: return
        isAlarmLocked = true

        // Wake screen
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        // Persist so checkPendingAlarmTrigger picks it up on fresh start
        getSharedPreferences("ReverseAlarmPrefs", android.content.Context.MODE_PRIVATE)
            .edit()
            .putString("triggered_alarm_id", alarmId)
            .apply()

        // If JS is already running (notification tap while app alive), emit direct navigation event
        emitToJS("AlarmNotificationTapped", alarmId)
    }

    private fun emitToJS(eventName: String, alarmId: String) {
        val params = Arguments.createMap().apply { putString("alarmId", alarmId) }
        try {
            val app = applicationContext as ReactApplication
            val reactContext = app.reactHost?.currentReactContext
            if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, params)
                return
            }
        } catch (_: Exception) {}
        try {
            val app = applicationContext as ReactApplication
            val host = app.reactNativeHost
            if (!host.hasInstance()) return
            val reactContext = host.reactInstanceManager.currentReactContext ?: return
            if (!reactContext.hasActiveCatalystInstance()) return
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (isAlarmLocked) return
        @Suppress("DEPRECATION")
        super.onBackPressed()
    }
}
