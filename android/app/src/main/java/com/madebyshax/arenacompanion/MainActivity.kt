package com.madebyshax.arenacompanion

import android.app.Activity
import android.content.res.Configuration
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Base64
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
 * - Qatlam/kolonka soni, nomlar, klip holatlari va miniaturalar REST (WebAPI) orqali yangilanadi.
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
    private var pollCount = 0

    /** Resolume'dagi haqiqiy o'lchamlar (aniqlangan). 0 = hali aniqlanmagan. */
    private var layerTotal = 0
    private var columnTotal = 0

    /** Oxirgi o'qilgan nomlar. Ular kamroq tez-tez yangilanadi. */
    private var layerNames: Map<Int, String> = emptyMap()
    private var columnInfos: Map<Int, ColumnInfo> = emptyMap()

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
        val size = if (layerTotal > 0) " · ${layerTotal}×${columnTotal}" else ""
        val last = if (lastAction.isEmpty()) "" else " · ${t("lastAction")}: $lastAction"
        status.text = "→ ${settings.host}:${settings.port} · $web$size$last"
    }

    /**
     * Resolume holatini REST orqali yangilaydi.
     * force = true bo'lsa: o'lcham qayta aniqlanadi, nomlar va miniaturalar qayta o'qiladi.
     * Bir vaqtda bitta sweep ketadi.
     */
    private fun refresh(force: Boolean) {
        if (refreshing) return
        refreshing = true

        val rest = ArenaRest(settings.host, settings.webPort)
        val withNames = force || layerTotal == 0 || pollCount % NAME_EVERY == 0
        pollCount++

        io.execute {
            try {
                if (force) {
                    screen.thumbnails.clear()
                    thumbRetryAt.clear()
                }
                if (force || layerTotal == 0 || columnTotal == 0) discover(rest)
                if (withNames) readNames(rest)

                val snapshot = readClips(rest)
                runOnUiThread {
                    webState = t("webOk")
                    val resized = snapshot.layerCount != screen.snapshot.layerCount ||
                        snapshot.columnCount != screen.snapshot.columnCount
                    screen.publish(snapshot)
                    if (resized) showPage(currentPage)
                    renderStatus()
                }

                if (settings.thumbnails && loadThumbnails(rest)) {
                    runOnUiThread { screen.publish(snapshot) }
                }
            } catch (e: Exception) {
                val reason = e.message ?: e.javaClass.simpleName
                runOnUiThread {
                    webState = "${t("webFail")} ($reason)"
                    renderStatus()
                }
            } finally {
                runOnUiThread { refreshing = false }
            }
        }
    }

    /** Qatlamlar va kolonkalar sonini aniqlaydi: javob berguncha yoki 404 chiqguncha. */
    private fun discover(rest: ArenaRest) {
        layerTotal = countUntilMissing(MAX_LAYERS) { rest.fetchLayer(it) }
        columnTotal = countUntilMissing(MAX_COLUMNS) { rest.fetchColumn(it) }
        if (layerTotal == 0 || columnTotal == 0) {
            throw IOException("Web API javob bermadi")
        }
    }

    private fun countUntilMissing(max: Int, fetch: (Int) -> String): Int {
        var count = 0
        for (index in 1..max) {
            if (runCatching { fetch(index) }.isFailure) break
            count = index
        }
        return count
    }

    private fun readNames(rest: ArenaRest) {
        layerNames = (1..layerTotal).mapNotNull { layer ->
            runCatching { layer to layerNameFromJson(rest.fetchLayer(layer)) }.getOrNull()
        }.toMap()
        columnInfos = (1..columnTotal).mapNotNull { column ->
            runCatching { column to ColumnInfo.fromJson(rest.fetchColumn(column)) }.getOrNull()
        }.toMap()
    }

    /** Har bir klipning holatini o'qiydi. Javob bermagan klip bo'sh hisoblanadi. */
    private fun readClips(rest: ArenaRest): ArenaSnapshot {
        var answered = 0
        val clips = mutableMapOf<Pair<Int, Int>, ClipInfo>()
        for (layer in 1..layerTotal) {
            for (column in 1..columnTotal) {
                val info = runCatching { ClipInfo.fromJson(rest.fetchClip(layer, column)) }
                    .onSuccess { answered++ }
                    .getOrDefault(ClipInfo("", ClipState.EMPTY))
                clips[layer to column] = info
            }
        }
        if (answered == 0) throw IOException("Klip javoblari yo'q")
        return ArenaSnapshot(layerNames, clips, columnInfos, layerTotal, columnTotal)
    }

    /**
     * Yo'q miniaturalarni yuklaydi. Har so'rov orasida pauza bor, shuning uchun Resolume qotib qolmaydi.
     * Xato bo'lsa THUMB_RETRY_MS dan keyin qayta urinadi. Yangi miniatura yuklangan bo'lsa true.
     */
    private fun loadThumbnails(rest: ArenaRest): Boolean {
        var loaded = false
        val now = System.currentTimeMillis()
        for (layer in 1..layerTotal) {
            for (column in 1..columnTotal) {
                val key = "$layer/$column"
                if (screen.thumbnails.containsKey(key)) continue
                if ((thumbRetryAt[key] ?: 0L) > now) continue

                Thread.sleep(THUMB_GAP_MS)
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
        /** Holatni so'rash oralig'i. Kam so'rov Resolume'ni qiynamaydi. */
        private const val POLL_MS = 3000L

        /** Nomlar har shuncha so'rovda bir marta yangilanadi. */
        private const val NAME_EVERY = 10

        /** Miniatura so'rovlari orasidagi pauza. */
        private const val THUMB_GAP_MS = 300L

        /** Miniatura xatosidan keyin qayta urinish oralig'i. */
        private const val THUMB_RETRY_MS = 15_000L

        /** Qidiruv chegarasi (Arena odatda bundan kam ishlatadi). */
        private const val MAX_LAYERS = 16
        private const val MAX_COLUMNS = 40
    }
}
