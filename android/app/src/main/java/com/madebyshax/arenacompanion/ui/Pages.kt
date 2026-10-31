package com.madebyshax.arenacompanion.ui

import android.content.Context
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.Color
import android.text.TextUtils
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import com.madebyshax.arenacompanion.arena.ArenaClient
import com.madebyshax.arenacompanion.arena.ArenaCommands
import com.madebyshax.arenacompanion.arena.ArenaSnapshot
import com.madebyshax.arenacompanion.arena.ClipInfo
import com.madebyshax.arenacompanion.arena.ClipState
import com.madebyshax.arenacompanion.arena.Direction
import com.madebyshax.arenacompanion.osc.OscSender
import java.util.concurrent.ConcurrentHashMap

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
) {
    /** Resolume'ning oxirgi holati (REST orqali). */
    var snapshot: ArenaSnapshot = ArenaSnapshot.EMPTY
        private set

    /** Klip miniatyuralari. Kalit: "qatlam/kolonka". Fon oqimidan to'ldiriladi. */
    val thumbnails = ConcurrentHashMap<String, Bitmap>()

    /** Ma'lumot yangilanganda sahifa yozuvlarini qayta chizuvchi funksiyalar. Sahifa almashganda tozalanadi. */
    val listeners = mutableListOf<() -> Unit>()

    /** UI oqimida chaqiriladi. */
    fun publish(next: ArenaSnapshot) {
        snapshot = next
        listeners.forEach { it() }
    }
}

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

/**
 * Klip qatori. Landshaftda ekranga teng bo'linadi.
 * Vertikalda katakchalar eni belgilangan, qator gorizontal aylantiriladi.
 */
private fun Screen.gridRow(views: List<View>): View {
    val landscape = ctx.resources.configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
    if (landscape) return ctx.row(*views.toTypedArray())

    val inner = LinearLayout(ctx).apply { orientation = LinearLayout.HORIZONTAL }
    views.forEach { view ->
        inner.addView(
            view,
            LinearLayout.LayoutParams(ctx.dp(118), ctx.dp(84)).apply {
                setMargins(ctx.dp(3), ctx.dp(3), ctx.dp(3), ctx.dp(3))
            },
        )
    }
    return HorizontalScrollView(ctx).apply { addView(inner) }
}

private fun Screen.layerLabel(layer: Int): String =
    snapshot.layerName(layer)?.let { "${t("layer")} $layer\n$it" } ?: "${t("layer")} $layer"

private fun Screen.columnLabel(column: Int): String =
    snapshot.columnName(column)?.let { "${t("column")} $column\n$it" } ?: "${t("column")} $column"

private fun stateText(state: ClipState?): String = when (state) {
    ClipState.CONNECTED -> t("connected")
    ClipState.PREVIEW -> t("preview")
    else -> t("empty")
}

private fun Screen.clipTitle(layer: Int, column: Int): String {
    val info = snapshot.clip(layer, column)
    val name = info?.name?.takeIf { it.isNotBlank() } ?: "$layer/$column"
    return "$name · ${stateText(info?.state)}"
}

/** Klip katakchasi: miniatura, nom va holat rangi. */
private class ClipCell(ctx: Context, private val baseColor: Int) {

    private val image = ImageView(ctx).apply {
        scaleType = ImageView.ScaleType.CENTER_CROP
        alpha = 0.9f
    }

    private val label = TextView(ctx).apply {
        setTextColor(Color.WHITE)
        textSize = 12f
        gravity = Gravity.CENTER
        maxLines = 2
        ellipsize = TextUtils.TruncateAt.END
        setBackgroundColor(Color.argb(150, 0, 0, 0))
        setPadding(ctx.dp(4), ctx.dp(2), ctx.dp(4), ctx.dp(2))
    }

    val view: FrameLayout = FrameLayout(ctx).apply {
        setBackgroundColor(baseColor)
        foreground = ctx.rippleForeground()
        minimumHeight = ctx.dp(84)
        addView(
            image,
            FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT),
        )
        addView(
            label,
            FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM),
        )
    }

    fun update(info: ClipInfo?, thumbnail: Bitmap?, column: Int) {
        label.text = info?.name?.takeIf { it.isNotBlank() } ?: "$column"
        image.setImageBitmap(thumbnail)
        view.setBackgroundColor(
            when (info?.state) {
                ClipState.CONNECTED -> Palette.ON
                ClipState.PREVIEW -> Palette.PREVIEW
                else -> baseColor
            },
        )
    }
}

// ─── Klipler: qatlamlar × kolonkalar to'ri ─────────────────────────

fun Screen.clipsPage(): View = page {
    place(ctx.button(t("stopAll"), Palette.STOP) { client.run(ArenaCommands.stopAll()) })

    val columnButtons = (1..COLUMNS).map { column ->
        ctx.button(columnLabel(column)) { client.run(ArenaCommands.triggerColumn(column)) }
            .also { button -> listeners += { button.text = columnLabel(column) } }
    }
    place(gridRow(columnButtons))

    for (layer in 1..LAYERS) {
        val color = Palette.LAYER[(layer - 1) % Palette.LAYER.size]
        val layerButton = ctx.button(layerLabel(layer), color) {
            sel.layer = layer
            client.run(ArenaCommands.layerSelect(layer))
        }
        listeners += { layerButton.text = layerLabel(layer) }

        val cells = mutableListOf<View>(layerButton)
        for (column in 1..COLUMNS) {
            val cell = ClipCell(ctx, Palette.dim(color))
            cell.view.setOnClickListener {
                sel.layer = layer
                sel.column = column
                client.run(ArenaCommands.connectClip(layer, column))
            }
            listeners += { cell.update(snapshot.clip(layer, column), thumbnails["$layer/$column"], column) }
            cells += cell.view
        }
        place(gridRow(cells))
    }
}

// ─── Qatlam ────────────────────────────────────────────────────────

fun Screen.layerPage(): View = page {
    val caption = ctx.text("")
    place(caption)
    fun refreshCaption() {
        caption.text = snapshot.layerName(sel.layer)?.let { "${t("layer")} ${sel.layer}: $it" } ?: "${t("layer")} ${sel.layer}"
    }
    refreshCaption()
    listeners += { refreshCaption() }

    place(ctx.stepper(t("layer"), sel.layer, 1, LAYERS) {
        sel.layer = it
        refreshCaption()
    })
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
    val caption = ctx.text("")
    place(caption)
    fun refreshCaption() {
        caption.text = clipTitle(sel.layer, sel.column)
    }
    refreshCaption()
    listeners += { refreshCaption() }

    place(ctx.stepper(t("layer"), sel.layer, 1, LAYERS) {
        sel.layer = it
        refreshCaption()
    })
    place(ctx.stepper(t("column"), sel.column, 1, COLUMNS) {
        sel.column = it
        refreshCaption()
    })

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
    val caption = ctx.text("")
    place(caption)
    fun refreshCaption() {
        caption.text = snapshot.columnName(sel.column)?.let { "${t("column")} ${sel.column}: $it" }
            ?: "${t("column")} ${sel.column}"
    }
    refreshCaption()
    listeners += { refreshCaption() }

    place(ctx.stepper(t("group"), sel.group, 1, 99) { sel.group = it })
    place(ctx.stepper(t("column"), sel.column, 1, 99) {
        sel.column = it
        refreshCaption()
    })

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
    val webPortField = ctx.field(t("webPort"), settings.webPort.toString(), numeric = true)
    val lastField = ctx.field(t("lastColumn"), settings.lastColumn.toString(), numeric = true)
    val saved = ctx.text("")

    place(hostField)
    place(portField)
    place(webPortField)
    place(lastField)
    place(
        ctx.button(t("save"), Palette.TAP) {
            settings.host = hostField.text.toString().trim()
            settings.port = portField.text.toString().toIntOrNull() ?: 7000
            settings.webPort = webPortField.text.toString().toIntOrNull() ?: 8080
            settings.lastColumn = lastField.text.toString().toIntOrNull() ?: 10
            sender.host = settings.host
            sender.port = settings.port
            onConnectionChanged()
            saved.text = t("saved")
        },
    )
    place(saved)
}
