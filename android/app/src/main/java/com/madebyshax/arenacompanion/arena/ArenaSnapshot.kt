package com.madebyshax.arenacompanion.arena

import org.json.JSONObject

/** Klipning yoki kolonkaning holati. Resolume "connected" qiymatidan olinadi. */
enum class ClipState { EMPTY, CONNECTED, PREVIEW }

data class ClipInfo(val name: String, val state: ClipState) {
    companion object {
        /** GET composition/layers/{l}/clips/{c} javobidan. */
        fun fromJson(json: String): ClipInfo {
            val obj = JSONObject(json)
            return ClipInfo(
                name = paramValue(obj.optJSONObject("name")),
                state = clipStateOf(paramValue(obj.optJSONObject("connected"))),
            )
        }
    }
}

data class ColumnInfo(val name: String, val state: ClipState) {
    companion object {
        /** GET composition/columns/{c} javobidan. */
        fun fromJson(json: String): ColumnInfo {
            val obj = JSONObject(json)
            return ColumnInfo(
                name = paramValue(obj.optJSONObject("name")),
                state = clipStateOf(paramValue(obj.optJSONObject("connected"))),
            )
        }
    }
}

/** GET composition/layers/{l} javobidagi qatlam nomi. */
fun layerNameFromJson(json: String): String =
    paramValue(JSONObject(json).optJSONObject("name"))

/**
 * Ilovaning ko'rsatadigan to'rining bir paytdagi holati.
 * Indekslar 1 dan boshlanadi, OSC yo'llaridagi raqamlar bilan bir xil.
 */
class ArenaSnapshot(
    private val layerNames: Map<Int, String>,
    private val clips: Map<Pair<Int, Int>, ClipInfo>,
    private val columns: Map<Int, ColumnInfo>,
    /** Resolume'dagi haqiqiy qatlamlar soni (0 = noma'lum). */
    val layerCount: Int = 0,
    /** Resolume'dagi haqiqiy kolonkalar soni (0 = noma'lum). */
    val columnCount: Int = 0,
) {
    fun clip(layer: Int, column: Int): ClipInfo? = clips[layer to column]

    fun layerName(layer: Int): String? = layerNames[layer]?.takeIf { it.isNotBlank() }

    fun columnName(column: Int): String? = columns[column]?.name?.takeIf { it.isNotBlank() }

    fun columnState(column: Int): ClipState = columns[column]?.state ?: ClipState.EMPTY

    companion object {
        val EMPTY = ArenaSnapshot(emptyMap(), emptyMap(), emptyMap())
    }
}

/** Resolume parametrining "value" maydoni matn ko'rinishida. Yo'q bo'lsa bo'sh qator. */
internal fun paramValue(parameter: JSONObject?): String {
    val value = parameter?.opt("value")
    return if (value == null || value == JSONObject.NULL) "" else value.toString()
}

/**
 * "connected" qiymatini holatga aylantiradi. Matn ham, raqam ham bo'lishi mumkin.
 * "Disconnected" "Connected" dan oldin tekshiriladi, chunki ikkalasi ham "connect" so'zini o'z ichiga oladi.
 */
internal fun clipStateOf(raw: String): ClipState {
    val s = raw.trim().lowercase()
    return when {
        s.contains("preview") -> ClipState.PREVIEW
        s.contains("disconnect") || s.isEmpty() || s == "0" || s == "false" -> ClipState.EMPTY
        s.contains("connect") || s == "1" || s == "true" -> ClipState.CONNECTED
        else -> ClipState.EMPTY
    }
}
