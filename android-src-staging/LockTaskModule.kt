package com.reversealarm.app

import android.app.KeyguardManager
import android.content.Context
import android.os.Build
import android.view.WindowManager
import com.facebook.react.bridge.*

class LockTaskModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "LockTaskModule"

    @ReactMethod
    fun lockScreen(promise: Promise) {
        try {
            val activity = getCurrentActivity() ?: return promise.resolve(null)
            activity.runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                    activity.setShowWhenLocked(true)
                    activity.setTurnScreenOn(true)
                    val km = reactContext.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager
                    km.requestDismissKeyguard(activity, null)
                } else {
                    @Suppress("DEPRECATION")
                    activity.window.addFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    )
                }
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("LOCK_FAILED", e.message)
        }
    }

    @ReactMethod
    fun unlockScreen(promise: Promise) {
        try {
            val activity = getCurrentActivity() ?: return promise.resolve(null)
            activity.runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                    activity.setShowWhenLocked(false)
                    activity.setTurnScreenOn(false)
                } else {
                    @Suppress("DEPRECATION")
                    activity.window.clearFlags(
                        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                    )
                }
            }
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("UNLOCK_FAILED", e.message)
        }
    }
}
