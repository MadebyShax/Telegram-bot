package com.madebyshax.arenacompanion.ui

/** OSC so'zlarini tilga mos matnga o'girish. Ma'nosiz so'zlar (video, audio, transport...) tashlab yuboriladi. */
private val ACTIONS = mapOf(
    "connect" to "connect",
    "select" to "select",
    "clear" to "clear",
    "bypassed" to "bypass",
    "solo" to "solo",
    "opacity" to "opacity",
    "volume" to "volume",
    "master" to "master",
    "speed" to "speed",
    "direction" to "direction",
    "position" to "position",
    "tempotap" to "tap",
    "resync" to "resync",
    "disconnectall" to "stopAll",
    "disconnect-all" to "stopAll",
    "disconnectlayers" to "groupClear",
    "connectnextclip" to "nextClip",
    "connectprevclip" to "prevClip",
    "connectnextcolumn" to "nextColumn",
    "connectprevcolumn" to "prevColumn",
    "selectnextdeck" to "nextDeck",
    "selectprevdeck" to "prevDeck",
)

/**
 * OSC manzilni qisqa, odam o'qiydigan matnga aylantiradi.
 * Masalan: "/composition/layers/2/clips/3/connect" -> "Qatlam 2 · Klip 3 · Ishga tushirish".
 */
fun describeOsc(address: String): String {
    val parts = address.trim('/').split('/').filter { it.isNotEmpty() }
    val out = mutableListOf<String>()
    var i = 0
    while (i < parts.size) {
        val word = parts[i]
        val number = parts.getOrNull(i + 1)?.toIntOrNull()
        val label = when {
            word == "layers" && number != null -> "${t("layer")} $number"
            word == "groups" && number != null -> "${t("group")} $number"
            word == "clips" && number != null -> "${t("clip")} $number"
            word == "columns" && number != null -> "${t("column")} $number"
            word == "decks" && number != null -> "${t("deck")} $number"
            else -> null
        }
        if (label != null) {
            out += label
            i += 2
            continue
        }
        ACTIONS[word]?.let { out += t(it) }
        i++
    }
    return if (out.isEmpty()) address else out.joinToString(" · ")
}
