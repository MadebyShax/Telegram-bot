package com.madebyshax.arenacompanion.ui

import android.content.Context

/** Ulanish sozlamalari. SharedPreferences'da saqlanadi. */
class AppSettings(context: Context) {

    private val prefs = context.getSharedPreferences("arena_companion", Context.MODE_PRIVATE)

    var host: String
        get() = prefs.getString("host", "192.168.1.10") ?: "192.168.1.10"
        set(value) = prefs.edit().putString("host", value).apply()

    var port: Int
        get() = prefs.getInt("port", 7000)
        set(value) = prefs.edit().putInt("port", value).apply()

    /** Guruh kolonkalari next/prev uchun oxirgi kolonka raqami. */
    var lastColumn: Int
        get() = prefs.getInt("lastColumn", 10)
        set(value) = prefs.edit().putInt("lastColumn", value).apply()
}
