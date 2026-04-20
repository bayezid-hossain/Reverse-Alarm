package com.reversealarm.app

import android.graphics.BitmapFactory
import android.graphics.Color
import com.facebook.react.bridge.*

class ImageAnalysisModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "ImageAnalysisModule"

    @ReactMethod
    fun getAverageBrightness(filePath: String, promise: Promise) {
        try {
            val cleanPath = filePath.removePrefix("file://")
            val opts = BitmapFactory.Options().apply {
                inSampleSize = 8 // downsample 8× — plenty for brightness, fast
            }
            val bitmap = BitmapFactory.decodeFile(cleanPath, opts)
                ?: throw Exception("Could not decode image at $cleanPath (Original: $filePath)")

            val pixels = IntArray(bitmap.width * bitmap.height)
            bitmap.getPixels(pixels, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
            bitmap.recycle()

            var totalLuminance = 0.0
            for (pixel in pixels) {
                val r = Color.red(pixel) / 255.0
                val g = Color.green(pixel) / 255.0
                val b = Color.blue(pixel) / 255.0
                // ITU-R BT.709 relative luminance
                totalLuminance += 0.2126 * r + 0.7152 * g + 0.0722 * b
            }

            promise.resolve(totalLuminance / pixels.size) // 0.0–1.0
        } catch (e: Exception) {
            promise.reject("ANALYSIS_FAILED", e.message)
        }
    }
}
