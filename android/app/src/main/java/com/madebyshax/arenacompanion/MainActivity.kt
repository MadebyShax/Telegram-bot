package com.madebyshax.arenacompanion

import android.app.Activity
import android.content.res.Configuration
import android.graphics.BitmapFactory
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
import com.madebyshax.arenacompanion.osc.OscSender
import com.madebyshax.arenacompanion.ui.*
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

    /** Miniatura so'ralgan kalitlar. Muvaffaqiyatsiz bo'lsa qayta so'ralmaydi (yangilash bosilmaguncha). */
    private val thumbnailsRequested = ConcurrentHashMap.newKeySet<String>()

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
     * Resolume holatini REST orqali yangilaydi. force = true bo'lsa miniaturalar ham qayta yuklanadi.
     * Bir vaqtning o'zida bitta so'rov ketadi.
     */
    private fun refresh(force: Boolean) {
        if (refreshing) return
        refreshing = true

        val host = settings.host
        val webPort = settings.webPort
        val rest = ArenaRest(host, webPort)

        io.execute {
            try {
                val snapshot = ArenaSnapshot.parse(rest.fetchComposition())
                runOnUiThread {
                    webState = t("webOk")
                    screen.publish(snapshot)
                    renderStatus()
                }

                if (force) {
                    screen.thumbnails.clear()
                    thumbnailsRequested.clear()
                }
                var loaded = false
                for ((layer, column) in snapshot.clipKeys()) {
                    val key = "$layer/$column"
                    if (screen.thumbnails.containsKey(key) || !thumbnailsRequested.add(key)) continue
                    val bytes = runCatching { rest.fetchThumbnail(layer, column) }.getOrNull() ?: continue
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)?.let {
                        screen.thumbnails[key] = it
                        loaded = true
                    }
                }
                if (loaded) runOnUiThread { screen.publish(snapshot) }
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

    override fun onDestroy() {
        handler.removeCallbacks(poll)
        io.shutdownNow()
        sender.shutdown()
        super.onDestroy()
    }

    companion object {
        private const val POLL_MS = 2000L
    }
}
