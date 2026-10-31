package com.madebyshax.arenacompanion.ui

import android.content.Context
import android.view.View
import android.widget.LinearLayout
import android.widget.ScrollView
import com.madebyshax.arenacompanion.arena.ArenaClient
import com.madebyshax.arenacompanion.arena.ArenaCommands
import com.madebyshax.arenacompanion.arena.Direction
import com.madebyshax.arenacompanion.osc.OscSender

/** Arena layoutidagi qatlamlar va kolonkalar soni (TouchOSC layout bilan bir xil). */
const val LAYERS = 5
const val COLUMNS = 8

/** Tanlangan qatlam, klip, guruh va dek. Barcha sahifalar bir xil tanlovdan foydalanadi. */
class Selection {
    var layer = 1
    var column = 1
    var group = 1
    var deck = 1
}

class Screen(
    val ctx: Context,
    val client: ArenaClient,
    val sender: OscSender,
    val sel: Selection,
    val settings: AppSettings,
    val onConnectionChanged: () -> Unit,
)

/** Sahifa: vertikal, aylantiriladigan. */
private fun Screen.page(build: LinearLayout.() -> Unit): View {
    val body = ctx.column().apply {
        setPadding(ctx.dp(6), ctx.dp(6), ctx.dp(6), ctx.dp(6))
        build()
    }
    return ScrollView(ctx).apply {
        setBackgroundColor(Palette.BG)
        addView(body)
    }
}

private fun LinearLayout.place(view: View) {
    addView(
        view,
        LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT,
        ).apply { setMargins(context.dp(2), context.dp(4), context.dp(2), context.dp(4)) },
    )
}

// ─── Klipler: qatlamlar × kolonkalar to'ri ─────────────────────────

fun Screen.clipsPage(): View = page {
    place(ctx.button(t("stopAll"), Palette.STOP) { client.run(ArenaCommands.stopAll()) })

    val columnButtons = (1..COLUMNS).map { column ->
        ctx.button("${t("column")} $column") { client.run(ArenaCommands.triggerColumn(column)) }
    }
    place(ctx.row(*columnButtons.toTypedArray()))

    for (layer in 1..LAYERS) {
        val color = Palette.LAYER[(layer - 1) % Palette.LAYER.size]
        val cells = mutableListOf<View>(
            ctx.button("${t("layer")} $layer", color) {
                sel.layer = layer
                client.run(ArenaCommands.layerSelect(layer))
            },
        )
        for (column in 1..COLUMNS) {
            cells += ctx.button("$column", Palette.dim(color)) {
                sel.layer = layer
                sel.column = column
                client.run(ArenaCommands.connectClip(layer, column))
            }
        }
        place(ctx.row(*cells.toTypedArray()))
    }
}

// ─── Qatlam ────────────────────────────────────────────────────────

fun Screen.layerPage(): View = page {
    place(ctx.stepper(t("layer"), sel.layer, 1, LAYERS) { sel.layer = it })

    place(
        ctx.row(
            ctx.button(t("select")) { client.run(ArenaCommands.layerSelect(sel.layer)) },
            ctx.button(t("clear"), Palette.STOP) { client.run(ArenaCommands.layerClear(sel.layer)) },
            ctx.button(t("bypass")) {
                client.toggle("bypass:${sel.layer}") { on -> ArenaCommands.layerBypass(sel.layer, on) }
            },
            ctx.button(t("solo")) {
                client.toggle("solo:${sel.layer}") { on -> ArenaCommands.layerSolo(sel.layer, on) }
            },
        ),
    )
    place(
        ctx.row(
            ctx.button(t("prevClip")) { client.run(ArenaCommands.layerPreviousClip(sel.layer)) },
            ctx.button(t("nextClip")) { client.run(ArenaCommands.layerNextClip(sel.layer)) },
        ),
    )
    place(
        ctx.row(
            ctx.button(t("backward")) { client.run(ArenaCommands.layerDirection(sel.layer, Direction.BACKWARD)) },
            ctx.button(t("pause")) { client.run(ArenaCommands.layerDirection(sel.layer, Direction.PAUSE)) },
            ctx.button(t("forward")) { client.run(ArenaCommands.layerDirection(sel.layer, Direction.FORWARD)) },
        ),
    )

    place(ctx.slider(t("opacity"), 1f) { client.run(ArenaCommands.layerOpacity(sel.layer, it)) })
    place(ctx.slider(t("volume"), 1f) { client.run(ArenaCommands.layerVolume(sel.layer, it)) })
    place(ctx.slider(t("master"), 1f) { client.run(ArenaCommands.layerMaster(sel.layer, it)) })
    place(ctx.slider(t("speed"), 0.5f) { client.run(ArenaCommands.layerSpeed(sel.layer, it)) })
    place(
        ctx.slider(t("transition"), 0.5f, max = 10f) {
            client.run(ArenaCommands.layerTransitionDuration(sel.layer, it))
        },
    )
}

// ─── Klip sozlamalari ──────────────────────────────────────────────

fun Screen.clipPage(): View = page {
    place(ctx.stepper(t("layer"), sel.layer, 1, LAYERS) { sel.layer = it })
    place(ctx.stepper(t("column"), sel.column, 1, COLUMNS) { sel.column = it })

    place(
        ctx.row(
            ctx.button(t("connect"), Palette.ON) { client.run(ArenaCommands.connectClip(sel.layer, sel.column)) },
            ctx.button(t("select")) { client.run(ArenaCommands.selectClip(sel.layer, sel.column)) },
            ctx.button(t("restart")) { client.run(ArenaCommands.clipRestart(sel.layer, sel.column)) },
        ),
    )
    place(
        ctx.row(
            ctx.button(t("backward")) {
                client.run(ArenaCommands.clipDirection(sel.layer, sel.column, Direction.BACKWARD))
            },
            ctx.button(t("pause")) {
                client.run(ArenaCommands.clipDirection(sel.layer, sel.column, Direction.PAUSE))
            },
            ctx.button(t("forward")) {
                client.run(ArenaCommands.clipDirection(sel.layer, sel.column, Direction.FORWARD))
            },
        ),
    )

    place(ctx.slider(t("opacity"), 1f) { client.run(ArenaCommands.clipOpacity(sel.layer, sel.column, it)) })
    place(ctx.slider(t("volume"), 1f) { client.run(ArenaCommands.clipVolume(sel.layer, sel.column, it)) })
    place(
        ctx.slider(t("speed"), 100f, max = 200f, decimals = 0, suffix = "%") {
            client.run(ArenaCommands.clipSpeed(sel.layer, sel.column, it))
        },
    )
    place(
        ctx.slider(t("position"), 0f) {
            client.run(ArenaCommands.clipPosition(sel.layer, sel.column, it))
        },
    )
}

// ─── Guruhlar ──────────────────────────────────────────────────────

fun Screen.groupsPage(): View = page {
    place(ctx.stepper(t("group"), sel.group, 1, 99) { sel.group = it })
    place(ctx.stepper(t("column"), sel.column, 1, 99) { sel.column = it })

    place(
        ctx.row(
            ctx.button(t("trigger"), Palette.ON) {
                client.run(ArenaCommands.groupTriggerColumn(sel.group, sel.column))
            },
            ctx.button(t("select")) { client.run(ArenaCommands.groupSelect(sel.group)) },
            ctx.button(t("selectColumn")) {
                client.run(ArenaCommands.groupSelectColumn(sel.group, sel.column))
            },
        ),
    )
    place(
        ctx.row(
            ctx.button(t("prevColumn")) { client.groupPreviousColumn(sel.group, settings.lastColumn) },
            ctx.button(t("nextColumn")) { client.groupNextColumn(sel.group, settings.lastColumn) },
            ctx.button(t("groupClear"), Palette.STOP) { client.run(ArenaCommands.groupClear(sel.group)) },
        ),
    )
    place(
        ctx.row(
            ctx.button(t("bypass")) {
                client.toggle("gbypass:${sel.group}") { on -> ArenaCommands.groupBypass(sel.group, on) }
            },
            ctx.button(t("solo")) {
                client.toggle("gsolo:${sel.group}") { on -> ArenaCommands.groupSolo(sel.group, on) }
            },
        ),
    )

    place(ctx.slider(t("master"), 1f) { client.run(ArenaCommands.groupMaster(sel.group, it)) })
    place(ctx.slider(t("opacity"), 1f) { client.run(ArenaCommands.groupOpacity(sel.group, it)) })
    place(ctx.slider(t("volume"), 1f) { client.run(ArenaCommands.groupVolume(sel.group, it)) })
    place(ctx.slider(t("speed"), 0.5f) { client.run(ArenaCommands.groupSpeed(sel.group, it)) })
    place(
        ctx.row(
            ctx.button(t("backward")) { client.run(ArenaCommands.groupDirection(sel.group, Direction.BACKWARD)) },
            ctx.button(t("pause")) { client.run(ArenaCommands.groupDirection(sel.group, Direction.PAUSE)) },
            ctx.button(t("forward")) { client.run(ArenaCommands.groupDirection(sel.group, Direction.FORWARD)) },
        ),
    )
}

// ─── Kompozitsiya ──────────────────────────────────────────────────

fun Screen.compositionPage(): View = page {
    place(ctx.slider(t("master"), 1f) { client.run(ArenaCommands.compositionMaster(it)) })
    place(ctx.slider(t("opacity"), 1f) { client.run(ArenaCommands.compositionOpacity(it)) })
    place(ctx.slider(t("volume"), 1f) { client.run(ArenaCommands.compositionVolume(it)) })
    place(ctx.slider(t("speed"), 0.5f) { client.run(ArenaCommands.compositionSpeed(it)) })

    var bpm = 120
    place(ctx.stepper(t("tempo"), bpm, 20, 300) { bpm = it })
    place(
        ctx.row(
            ctx.button(t("setTempo"), Palette.TAP) { client.run(ArenaCommands.compositionTempo(bpm.toFloat())) },
            ctx.button(t("tap"), Palette.TAP) { client.run(ArenaCommands.tempoTap()) },
            ctx.button(t("resync")) { client.run(ArenaCommands.tempoResync()) },
        ),
    )

    place(
        ctx.row(
            ctx.button(t("backward")) { client.run(ArenaCommands.compositionDirection(Direction.BACKWARD)) },
            ctx.button(t("pause")) { client.run(ArenaCommands.compositionDirection(Direction.PAUSE)) },
            ctx.button(t("forward")) { client.run(ArenaCommands.compositionDirection(Direction.FORWARD)) },
        ),
    )
    place(
        ctx.row(
            ctx.button(t("prevColumn")) { client.run(ArenaCommands.previousColumn()) },
            ctx.button(t("nextColumn")) { client.run(ArenaCommands.nextColumn()) },
        ),
    )

    place(ctx.stepper(t("deck"), sel.deck, 1, 9) { sel.deck = it })
    place(
        ctx.row(
            ctx.button(t("prevDeck")) { client.run(ArenaCommands.previousDeck()) },
            ctx.button(t("selectDeck")) { client.run(ArenaCommands.selectDeck(sel.deck)) },
            ctx.button(t("nextDeck")) { client.run(ArenaCommands.nextDeck()) },
        ),
    )

    place(
        ctx.row(
            ctx.button(t("blackout"), Palette.STOP) { client.run(ArenaCommands.compositionOpacity(0f)) },
            ctx.button(t("restore"), Palette.ON) { client.run(ArenaCommands.compositionOpacity(1f)) },
            ctx.button(t("stopAll"), Palette.STOP) { client.run(ArenaCommands.stopAll()) },
        ),
    )

    val addressField = ctx.field(t("address"), "/composition/")
    val valueField = ctx.field(t("value"), "1", numeric = true)
    place(
        ctx.row(
            addressField,
            valueField,
            ctx.button(t("send"), Palette.TAP) {
                val address = addressField.text.toString().trim()
                val value = valueField.text.toString().toFloatOrNull() ?: 0f
                if (address.startsWith("/")) client.run(ArenaCommands.custom(address, value))
            },
        ),
    )
}

// ─── Sozlamalar ────────────────────────────────────────────────────

fun Screen.settingsPage(): View = page {
    val hostField = ctx.field(t("host"), settings.host)
    val portField = ctx.field(t("port"), settings.port.toString(), numeric = true)
    val lastField = ctx.field(t("lastColumn"), settings.lastColumn.toString(), numeric = true)
    val saved = ctx.text("")

    place(hostField)
    place(portField)
    place(lastField)
    place(
        ctx.button(t("save"), Palette.TAP) {
            settings.host = hostField.text.toString().trim()
            settings.port = portField.text.toString().toIntOrNull() ?: 7000
            settings.lastColumn = lastField.text.toString().toIntOrNull() ?: 10
            sender.host = settings.host
            sender.port = settings.port
            onConnectionChanged()
            saved.text = t("saved")
        },
    )
    place(saved)
}
