package com.madebyshax.arenacompanion.arena

import com.madebyshax.arenacompanion.osc.OscArg
import com.madebyshax.arenacompanion.osc.OscMessage
import com.madebyshax.arenacompanion.osc.OscSender

/**
 * ArenaCommands'ni Resolume'ga yuboradi.
 *
 * Bu yerda ikki narsa qo'shiladi:
 * 1. Pulse: 1 yuborilgandan keyin 50 ms o'tib 0 yuboriladi (Companion moduli kabi).
 * 2. Holat: toggle (yoqish/o'chirish) va guruh kolonkasi (next/prev) uchun oxirgi qiymat.
 *    Resolume'dan teskari aloqa (feedback) yo'q, shuning uchun bu holat telefonda saqlanadi.
 */
class ArenaClient(private val sender: OscSender) {

    private val flags = mutableMapOf<String, Boolean>()
    private val groupColumns = mutableMapOf<Int, Int>()

    fun run(cmd: ArenaCmd) {
        sender.send(cmd.message)
        if (cmd.pulse) {
            val release = OscMessage(cmd.message.address, listOf(OscArg.I(0)))
            sender.sendAfter(release, PULSE_RELEASE_MS)
        }
    }

    /** Berilgan kalit bo'yicha holatni teskarilaydi va komandani yuboradi. */
    fun toggle(key: String, build: (Boolean) -> ArenaCmd) {
        val next = !(flags[key] ?: false)
        flags[key] = next
        run(build(next))
    }

    /** Guruh kolonkasini oldinga suradi. Companion moduli bilan bir xil: birinchi chaqiriq 1 ni tanlaydi. */
    fun groupNextColumn(group: Int, lastColumn: Int) {
        val current = groupColumns[group]
        var next = if (current == null) 1 else current + 1
        if (next > lastColumn) next = 1
        groupColumns[group] = next
        run(ArenaCommands.groupTriggerColumn(group, next))
    }

    /** Guruh kolonkasini orqaga suradi. */
    fun groupPreviousColumn(group: Int, lastColumn: Int) {
        val current = groupColumns[group]
        var previous = if (current == null) 1 else current - 1
        if (previous < 1) previous = lastColumn
        groupColumns[group] = previous
        run(ArenaCommands.groupTriggerColumn(group, previous))
    }

    companion object {
        const val PULSE_RELEASE_MS = 50L
    }
}
