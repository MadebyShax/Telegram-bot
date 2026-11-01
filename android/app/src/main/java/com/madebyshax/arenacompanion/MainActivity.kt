package com.madebyshax.arenacompanion

import android.app.Activity
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import com.madebyshax.arenacompanion.arena.ArenaClient
import com.madebyshax.arenacompanion.arena.ArenaRest
import com.madebyshax.arenacompanion.arena.ArenaSnapshot
import com.madebyshax.arenacompanion.arena.ClipInfo
import com.madebyshax.arenacompanion.arena.ClipState
import com.madebyshax.arenacompanion.arena.ColumnInfo
import com.madebyshax.arenacompanion.arena.layerNameFromJson
import com.madebyshax.arenacompanion.osc.OscSender
import com.madebyshax.arenacompanion.ui.*
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors

/**
 * Asosiy ekran.
 * - OSC komandalari UDP orqali yuboriladi (ArenaClient).
 * - Klip nomlari, holatlar va miniaturalar REST (WebAPI) orqali har POLL_MS da yangilanadi.
 * - Yuqorida sahifa tugmalari, pastda ulanish holati va oxirgi amal.
 */
class MainActivity : Activity() {

    private lateinit var settings: AppSettings
    private lateinit var sender: OscSender
    private lateinit var screen: Screen
    private lateinit var content: FrameLayout
    private lateinit var status: TextView

    private var currentPage: (Screen) -> View = Screen::clipsPage
    private var webState = ""
    private var lastAction = ""
    private var refreshing = false

    /** Miniatura xatosi bo'lgan kliplar: qayta urinish vaqti (ms). */
    private val thumbRetryAt = ConcurrentHashMap<String, Long>()

    private val io = Executors.newSingleThreadExecutor()
    private val handler = Handler(Looper.getMainLooper())

    private val poll = object : Runnable {
        override fun run() {
            refresh(force = false)
            handler.postDelayed(this, POLL_MS)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        settings = AppSettings(this)
        status = text("", 12f, Palette.MUTED)

        sender = OscSender().apply {
            host = settings.host
            port = settings.port
            onError = { message ->
                runOnUiThread {
                    lastAction = "${t("error")}: $message"
                    renderStatus()
                }
            }
        }

        val client = ArenaClient(sender).apply {
            onSent = { cmd ->
                lastAction = describeOsc(cmd.message.address)
                renderStatus()
            }
        }

        screen = Screen(this, client, sender, Selection(), settings) {
            renderStatus()
            refresh(force = true)
        }

        content = FrameLayout(this)

        val tabs = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val pages: List<Pair<String, (Screen) -> View>> = listOf(
            "tabClips" to Screen::clipsPage,
            "tabLayer" to Screen::layerPage,
            "tabClip" to Screen::clipPage,
            "tabGroups" to Screen::groupsPage,
            "tabComp" to Screen::compositionPage,
            "tabSettings" to Screen::settingsPage,
        )
        for ((key, factory) in pages) {
            tabs.addView(button(t(key)) { showPage(factory) })
        }
        tabs.addView(button(t("refresh"), Palette.TAP) { refresh(force = true) })

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Palette.BG)
            addView(HorizontalScrollView(this@MainActivity).apply { addView(tabs) })
            addView(content, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
            addView(status)
        }
        setContentView(root)

        renderStatus()
        showPage(pages.first().second)
    }

    override fun onResume() {
        super.onResume()
        handler.post(poll)
    }

    override fun onPause() {
        handler.removeCallbacks(poll)
        super.onPause()
    }

    /** Ekran aylanganda sahifani yangi o'lchamga qarab qayta chizamiz. */
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        showPage(currentPage)
    }

    private fun showPage(factory: (Screen) -> View) {
        currentPage = factory
        screen.listeners.clear()
        content.removeAllViews()
        content.addView(factory(screen))
        screen.listeners.forEach { it() }
    }

    private fun renderStatus() {
        val web = webState.ifEmpty { "…" }
        val last = if (lastAction.isEmpty()) "" else " · ${t("lastAction")}: $lastAction"
        status.text = "→ ${settings.host}:${settings.port} · $web$last"
    }

    /**
     * Resolume holatini REST orqali yangilaydi: qatlam/kolonka nomlari, klip holatlari va miniaturalar.
     * force = true bo'lsa miniaturalar ham qayta yuklanadi. Bir vaqtda bitta sweep ketadi.
     */
    private fun refresh(force: Boolean) {
        if (refreshing) return
        refreshing = true

        val rest = ArenaRest(settings.host, settings.webPort)
        io.execute {
            try {
                if (force) {
                    screen.thumbnails.clear()
                    thumbRetryAt.clear()
                }
                val snapshot = fetchSnapshot(rest)
                runOnUiThread {
                    webState = t("webOk")
                    screen.publish(snapshot)
                    renderStatus()
                }
                if (loadThumbnails(rest)) {
                    runOnUiThread { screen.publish(snapshot) }
                }
            } catch (e: Exception) {
                runOnUiThread {
                    webState = t("webFail")
                    renderStatus()
                }
            } finally {
                runOnUiThread { refreshing = false }
            }
        }
    }

    /** Ko'rsatiladigan to'rning (LAYERS x COLUMNS) holatini o'qiydi. Bitta ham javob bo'lmasa xato chiqaradi. */
    private fun fetchSnapshot(rest: ArenaRest): ArenaSnapshot {
        var answered = 0
        val layerNames = mutableMapOf<Int, String>()
        val columns = mutableMapOf<Int, ColumnInfo>()
        val clips = mutableMapOf<Pair<Int, Int>, ClipInfo>()

        for (layer in 1..LAYERS) {
            runCatching { layerNameFromJson(rest.fetchLayer(layer)) }.onSuccess {
                layerNames[layer] = it
                answered++
            }
        }
        for (column in 1..COLUMNS) {
            runCatching { ColumnInfo.fromJson(rest.fetchColumn(column)) }.onSuccess {
                columns[column] = it
                answered++
            }
        }
        for (layer in 1..LAYERS) {
            for (column in 1..COLUMNS) {
                val info = runCatching { ClipInfo.fromJson(rest.fetchClip(layer, column)) }
                    .onSuccess { answered++ }
                    .getOrDefault(ClipInfo("", ClipState.EMPTY))
                clips[layer to column] = info
            }
        }

        if (answered == 0) throw IOException("Web API javob bermadi")
        return ArenaSnapshot(layerNames, clips, columns)
    }

    /**
     * Yo'q miniaturalarni yuklaydi. Xato bo'lsa THUMB_RETRY_MS dan keyin qayta urinadi.
     * Yangi miniatura yuklangan bo'lsa true qaytaradi.
     */
    private fun loadThumbnails(rest: ArenaRest): Boolean {
        var loaded = false
        val now = System.currentTimeMillis()
        for (layer in 1..LAYERS) {
            for (column in 1..COLUMNS) {
                val key = "$layer/$column"
                if (screen.thumbnails.containsKey(key)) continue
                if ((thumbRetryAt[key] ?: 0L) > now) continue

                val bitmap = runCatching { rest.fetchThumbnail(layer, column) }.getOrNull()
                    ?.let { decodeThumbnail(it) }
                if (bitmap != null) {
                    screen.thumbnails[key] = bitmap
                    loaded = true
                } else {
                    thumbRetryAt[key] = now + THUMB_RETRY_MS
                }
            }
        }
        return loaded
    }

    /** Miniatura baytlarini rasmga aylantiradi. Javob base64 matn bo'lsa ham ishlaydi. */
    private fun decodeThumbnail(bytes: ByteArray): Bitmap? {
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.let { return it }
        return runCatching {
            val raw = Base64.decode(String(bytes, Charsets.US_ASCII).trim(), Base64.DEFAULT)
            BitmapFactory.decodeByteArray(raw, 0, raw.size)
        }.getOrNull()
    }

    override fun onDestroy() {
        handler.removeCallbacks(poll)
        io.shutdownNow()
        sender.shutdown()
        super.onDestroy()
    }

    companion object {
        private const val POLL_MS = 2000L
        private const val THUMB_RETRY_MS = 15_000L
    }
}
