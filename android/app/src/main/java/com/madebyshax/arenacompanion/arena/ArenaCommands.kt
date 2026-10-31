package com.madebyshax.arenacompanion.arena

import com.madebyshax.arenacompanion.osc.OscArg
import com.madebyshax.arenacompanion.osc.OscMessage
import kotlin.math.ln
import kotlin.math.pow

/** Klip yo'nalishi. Resolume kodlari: 0 = orqaga, 1 = pauza, 2 = oldinga. */
enum class Direction(val code: Int) {
    BACKWARD(0),
    PAUSE(1),
    FORWARD(2),
}

/**
 * Bitta Resolume buyrug'i.
 * pulse = true bo'lsa, u avval 1 yuboriladi, keyin 0 (Companion moduli shunday ishlaydi).
 */
data class ArenaCmd(val message: OscMessage, val pulse: Boolean = false)

/**
 * Resolume Arena OSC komandalari katalogi.
 *
 * Manzillar va argument turlari bitfocus/companion-module-resolume-arena
 * moduli (src/actions/osc-transport va src/arena-api/osc.ts) dan olingan.
 * Bu yerda faqat OSC orqali ishlaydigan komandalar bor. Ular REST yoki
 * WebSocket talab qilmaydi.
 */
object ArenaCommands {

    private fun i(value: Int) = OscArg.I(value)
    private fun f(value: Float) = OscArg.F(value)
    private fun flag(on: Boolean) = i(if (on) 1 else 0)

    private fun pulse(address: String) = ArenaCmd(OscMessage(address, listOf(i(1))), pulse = true)

    private fun set(address: String, value: Float) = ArenaCmd(OscMessage(address, listOf(f(value))))

    private fun setInt(address: String, value: Int) = ArenaCmd(OscMessage(address, listOf(i(value))))

    // ─── Kompozitsiya ───────────────────────────────────────────────

    fun compositionMaster(value: Float) = set("/composition/master", value)
    fun compositionOpacity(value: Float) = set("/composition/video/opacity", value)
    fun compositionVolume(value: Float) = set("/composition/audio/volume", value)
    fun compositionSpeed(value: Float) = set("/composition/speed", value)
    fun compositionTempo(bpm: Float) = set("/composition/tempocontroller/tempo", bpm)
    fun compositionDirection(direction: Direction) =
        setInt("/composition/direction", direction.code)

    fun tempoTap() = pulse("/composition/tempocontroller/tempotap")
    fun tempoResync() = pulse("/composition/tempocontroller/resync")

    /** Barcha qatlamlarni to'xtatadi (Stop All). */
    fun stopAll() = pulse("/composition/disconnectall")

    fun nextColumn() = pulse("/composition/connectnextcolumn")
    fun previousColumn() = pulse("/composition/connectprevcolumn")

    fun nextDeck() = pulse("/composition/selectnextdeck")
    fun previousDeck() = pulse("/composition/selectprevdeck")
    fun selectDeck(deck: Int) = ArenaCmd(OscMessage("/composition/decks/$deck/select", listOf(i(1))))

    // ─── Kolonkalar ─────────────────────────────────────────────────

    /** Butun kolonkani ishga tushiradi. */
    fun triggerColumn(column: Int) = pulse("/composition/columns/$column/connect")

    fun selectColumn(column: Int) =
        ArenaCmd(OscMessage("/composition/columns/$column/select", listOf(i(1))))

    // ─── Qatlamlar ──────────────────────────────────────────────────

    fun layerSelect(layer: Int) = ArenaCmd(OscMessage("/composition/layers/$layer/select", listOf(i(1))))
    fun layerClear(layer: Int) = pulse("/composition/layers/$layer/clear")
    fun layerBypass(layer: Int, on: Boolean) =
        ArenaCmd(OscMessage("/composition/layers/$layer/bypassed", listOf(flag(on))))
    fun layerSolo(layer: Int, on: Boolean) =
        ArenaCmd(OscMessage("/composition/layers/$layer/solo", listOf(flag(on))))
    fun layerNextClip(layer: Int) = pulse("/composition/layers/$layer/connectnextclip")
    fun layerPreviousClip(layer: Int) = pulse("/composition/layers/$layer/connectprevclip")
    fun layerOpacity(layer: Int, value: Float) = set("/composition/layers/$layer/video/opacity", value)
    fun layerVolume(layer: Int, value: Float) = set("/composition/layers/$layer/audio/volume", value)
    fun layerMaster(layer: Int, value: Float) = set("/composition/layers/$layer/master", value)
    fun layerSpeed(layer: Int, value: Float) = set("/composition/layers/$layer/speed", value)
    fun layerTransitionDuration(layer: Int, seconds: Float) =
        set("/composition/layers/$layer/transition/duration", seconds)
    fun layerDirection(layer: Int, direction: Direction) =
        setInt("/composition/layers/$layer/direction", direction.code)

    // ─── Klip ───────────────────────────────────────────────────────

    fun connectClip(layer: Int, column: Int) = pulse("/composition/layers/$layer/clips/$column/connect")

    fun selectClip(layer: Int, column: Int) =
        ArenaCmd(OscMessage("/composition/layers/$layer/clips/$column/select", listOf(i(1))))

    fun clipOpacity(layer: Int, column: Int, value: Float) =
        set("/composition/layers/$layer/clips/$column/video/opacity", value)

    fun clipVolume(layer: Int, column: Int, value: Float) =
        set("/composition/layers/$layer/clips/$column/audio/volume", value)

    /** Foiz (0..200) bo'yicha tezlik. Formula Companion modulidagi getSpeedValue bilan bir xil. */
    fun clipSpeed(layer: Int, column: Int, percent: Float) = set(
        "/composition/layers/$layer/clips/$column/transport/position/behaviour/speed",
        clipSpeedValue(percent),
    )

    /** Normallashtirilgan pozitsiya (0.0 boshi, 1.0 oxiri). */
    fun clipPosition(layer: Int, column: Int, normalized: Float) =
        set("/composition/layers/$layer/clips/$column/transport/position", normalized)

    fun clipDirection(layer: Int, column: Int, direction: Direction) = setInt(
        "/composition/layers/$layer/clips/$column/transport/position/behaviour/direction",
        direction.code,
    )

    /** Klipni boshidan qayta ijro etadi. */
    fun clipRestart(layer: Int, column: Int) = clipPosition(layer, column, 0f)

    // ─── Guruhlar (layer groups) ────────────────────────────────────

    fun groupTriggerColumn(group: Int, column: Int) =
        pulse("/composition/groups/$group/columns/$column/connect")

    fun groupClear(group: Int) = pulse("/composition/groups/$group/disconnectlayers")
    fun groupSelect(group: Int) = ArenaCmd(OscMessage("/composition/groups/$group/select", listOf(i(1))))

    fun groupSelectColumn(group: Int, column: Int) =
        ArenaCmd(OscMessage("/composition/groups/$group/columns/$column/select", listOf(i(1))))

    fun groupBypass(group: Int, on: Boolean) =
        ArenaCmd(OscMessage("/composition/groups/$group/bypassed", listOf(flag(on))))

    fun groupSolo(group: Int, on: Boolean) =
        ArenaCmd(OscMessage("/composition/groups/$group/solo", listOf(flag(on))))

    fun groupMaster(group: Int, value: Float) = set("/composition/groups/$group/master", value)
    fun groupOpacity(group: Int, value: Float) = set("/composition/groups/$group/video/opacity", value)
    fun groupVolume(group: Int, value: Float) = set("/composition/groups/$group/audio/volume", value)
    fun groupSpeed(group: Int, value: Float) = set("/composition/groups/$group/speed", value)
    fun groupDirection(group: Int, direction: Direction) =
        setInt("/composition/groups/$group/direction", direction.code)

    // ─── Maxsus ─────────────────────────────────────────────────────

    /** Istalgan OSC manzilga float yoki int yuborish (Companion'dagi "Custom OSC Command" kabi). */
    fun custom(address: String, value: Float) = set(address, value)

    /** Companion moduli formulasi: foiz (0..200) -> Resolume tezlik qiymati. */
    fun clipSpeedValue(percent: Float): Float {
        val base = (percent / 10.0).pow(ln(4.0) / ln(10.0))
        return base.toFloat()
    }
}
