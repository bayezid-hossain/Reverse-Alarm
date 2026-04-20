package com.reversealarm.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import org.json.JSONArray

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != "android.intent.action.LOCKED_BOOT_COMPLETED"
        ) return

        rescheduleAlarms(context)
    }

    private fun rescheduleAlarms(context: Context) {
        val prefs: SharedPreferences = context.getSharedPreferences("ReverseAlarmPrefs", Context.MODE_PRIVATE)
        val pendingJson = prefs.getString("pending_alarms", null) ?: return

        try {
            val arr = JSONArray(pendingJson)
            val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val alarmId = obj.getString("id")
                val triggerAtMs = obj.getLong("triggerAtMs")

                // Skip if trigger is in the past — compute next occurrence
                val scheduledTime = if (triggerAtMs < System.currentTimeMillis()) {
                    System.currentTimeMillis() + 60_000 // fallback: 1 min from now
                } else {
                    triggerAtMs
                }

                val alarmIntent = Intent(context, AlarmBroadcastReceiver::class.java).apply {
                    putExtra("alarmId", alarmId)
                    putExtra("label", "ALARM")
                }
                val pi = PendingIntent.getBroadcast(
                    context,
                    alarmId.hashCode(),
                    alarmIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, scheduledTime, pi)
                } else {
                    am.setExact(AlarmManager.RTC_WAKEUP, scheduledTime, pi)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
