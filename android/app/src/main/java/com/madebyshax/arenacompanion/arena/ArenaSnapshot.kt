package com.madebyshax.arenacompanion.arena

import org.json.JSONArray
import org.json.JSONObject

/** Klipning holati. Resolume "connected" qiymatidan olinadi. */
enum class ClipState { EMPTY, CONNECTED, PREVIEW }

data class ClipInfo(val name: String, val state: ClipState)

/**
 * Resolume kompozitsiyasining bir paytdagi nusxasi (REST: GET /api/v1/composition).
 *
 * Qatlam, klip va kolonka indekslari 1 dan boshlanadi. Bu OSC yo'llaridagi raqamlar bilan bir xil.
 */
class ArenaSnapshot private constructor(
    private val layerNames: Map<Int, String>,
    private val clips: Map<Pair<Int, Int>, ClipInfo>,
    private val columnNames: Map<Int, String>,
) {
    fun clip(layer: Int, column: Int): ClipInfo? = clips[layer to column]

    fun clipKeys(): List<Pair<Int, Int>> = clips.keys.toList()

    fun layerName(layer: Int): String? = layerNames[layer]?.takeIf { it.isNotBlank() }

    fun columnName(column: Int): String? = columnNames[column]?.takeIf { it.isNotBlank() }

    companion object {
        val EMPTY = ArenaSnapshot(emptyMap(), emptyMap(), emptyMap())

        fun parse(json: String): ArenaSnapshot {
            val root = JSONObject(json)

            val layerNames = mutableMapOf<Int, String>()
            val clips = mutableMapOf<Pair<Int, Int>, ClipInfo>()
            val layers = root.optJSONArray("layers") ?: JSONArray()
            for (l in 0 until layers.length()) {
                val layer = layers.getJSONObject(l)
                val layerIndex = l + 1
                layerNames[layerIndex] = paramValue(layer.optJSONObject("name"))

                val layerClips = layer.optJSONArray("clips") ?: JSONArray()
                for (c in 0 until layerClips.length()) {
                    val clip = layerClips.getJSONObject(c)
                    clips[layerIndex to (c + 1)] = ClipInfo(
                        name = paramValue(clip.optJSONObject("name")),
                        state = clipStateOf(paramValue(clip.optJSONObject("connected"))),
                    )
                }
            }

            val columnNames = mutableMapOf<Int, String>()
            val columns = root.optJSONArray("columns") ?: JSONArray()
            for (c in 0 until columns.length()) {
                columnNames[c + 1] = paramValue(columns.getJSONObject(c).optJSONObject("name"))
            }

            return ArenaSnapshot(layerNames, clips, columnNames)
        }
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
