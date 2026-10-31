package com.madebyshax.arenacompanion

import android.app.Activity
import android.os.Bundle
import android.view.View
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.LinearLayout
import android.widget.TextView
import com.madebyshax.arenacompanion.arena.ArenaClient
import com.madebyshax.arenacompanion.osc.OscSender
import com.madebyshax.arenacompanion.ui.AppSettings
import com.madebyshax.arenacompanion.ui.Palette
import com.madebyshax.arenacompanion.ui.Screen
import com.madebyshax.arenacompanion.ui.Selection
import com.madebyshax.arenacompanion.ui.button
import com.madebyshax.arenacompanion.ui.clipPage
import com.madebyshax.arenacompanion.ui.clipsPage
import com.madebyshax.arenacompanion.ui.compositionPage
import com.madebyshax.arenacompanion.ui.groupsPage
import com.madebyshax.arenacompanion.ui.layerPage
import com.madebyshax.arenacompanion.ui.settingsPage
import com.madebyshax.arenacompanion.ui.t
import com.madebyshax.arenacompanion.ui.text

/**
 * Asosiy ekran: yuqorida sahifa tugmalari, pastda ulanish holati.
 * Har bir sahifa Ui/Pages.kt da yasaladi.
 */
class MainActivity : Activity() {

    private lateinit var sender: OscSender
    private lateinit var screen: Screen
    private lateinit var content: FrameLayout
    private lateinit var status: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val settings = AppSettings(this)
        status = text("", 12f, Palette.MUTED)

        sender = OscSender().apply {
            host = settings.host
            port = settings.port
            onError = { message -> runOnUiThread { status.text = "${t("error")}: $message" } }
        }

        fun showStatus() {
            status.text = "→ ${settings.host}:${settings.port}"
        }

        screen = Screen(this, ArenaClient(sender), sender, Selection(), settings) { showStatus() }
        showStatus()

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

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Palette.BG)
            addView(HorizontalScrollView(this@MainActivity).apply { addView(tabs) })
            addView(content, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
            addView(status)
        }
        setContentView(root)
        showPage(pages.first().second)
    }

    private fun showPage(factory: (Screen) -> View) {
        content.removeAllViews()
        content.addView(factory(screen))
    }

    override fun onDestroy() {
        sender.shutdown()
        super.onDestroy()
    }
}
