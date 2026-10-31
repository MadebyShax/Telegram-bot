package com.madebyshax.arenacompanion.ui

import android.content.Context
import android.graphics.drawable.Drawable
import android.graphics.Color
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.SeekBar
import android.widget.TextView

/** Ranglar: Arena'ning qorong'i mavzusiga yaqin. */
object Palette {
    val BG: Int = Color.parseColor("#161616")
    val PANEL: Int = Color.parseColor("#262626")
    val BUTTON: Int = Color.parseColor("#3A3A3A")
    val STOP: Int = Color.parseColor("#9C3030")
    val TAP: Int = Color.parseColor("#2F6F8F")
    val ON: Int = Color.parseColor("#2F8052")
    val PREVIEW: Int = Color.parseColor("#B8A02A")
    val MUTED: Int = Color.parseColor("#9A9A9A")
    val LAYER: List<Int> = listOf(
        Color.parseColor("#2F5F9E"),
        Color.parseColor("#2F8052"),
        Color.parseColor("#A8782A"),
        Color.parseColor("#7D4696"),
        Color.parseColor("#A84545"),
    )

    /** Rangni xiraytiradi. Klip katakchalari qatlam rangining xira varianti bo'ladi. */
    fun dim(color: Int, factor: Float = 0.55f): Int = Color.rgb(
        (Color.red(color) * factor).toInt(),
        (Color.green(color) * factor).toInt(),
        (Color.blue(color) * factor).toInt(),
    )
}

fun Context.dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

/** Bosilganda ko'rinadigan effekt (ripple). Tugma bosilganini ko'rsatadi. */
fun Context.rippleForeground(): Drawable? {
    val attrs = obtainStyledAttributes(intArrayOf(android.R.attr.selectableItemBackground))
    val drawable = attrs.getDrawable(0)
    attrs.recycle()
    return drawable
}

/** Bosiladigan tugma. */
fun Context.button(label: String, color: Int = Palette.BUTTON, onClick: () -> Unit): Button =
    Button(this).apply {
        text = label
        isAllCaps = false
        textSize = 13f
        setTextColor(Color.WHITE)
        setBackgroundColor(color)
        stateListAnimator = null
        foreground = rippleForeground()
        minHeight = dp(48)
        setOnClickListener { onClick() }
    }

fun Context.text(label: String, size: Float = 14f, color: Int = Color.WHITE): TextView =
    TextView(this).apply {
        text = label
        textSize = size
        setTextColor(color)
        setPadding(dp(6), dp(4), dp(6), dp(4))
    }

/** Raqam yoki matn kiritish maydoni. */
fun Context.field(hintText: String, initial: String, numeric: Boolean = false): EditText =
    EditText(this).apply {
        hint = hintText
        setText(initial)
        setTextColor(Color.WHITE)
        setHintTextColor(Color.GRAY)
        inputType = if (numeric) {
            InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL or InputType.TYPE_NUMBER_FLAG_SIGNED
        } else {
            InputType.TYPE_CLASS_TEXT
        }
        minWidth = dp(140)
    }

/** Teng bo'lingan gorizontal qator. */
fun Context.row(vararg views: View): LinearLayout = LinearLayout(this).apply {
    orientation = LinearLayout.HORIZONTAL
    gravity = Gravity.CENTER_VERTICAL
    views.forEach { view ->
        addView(
            view,
            LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(dp(3), dp(3), dp(3), dp(3))
            },
        )
    }
}

/** Vertikal ustun, har bir element to'liq kenggacha. */
fun Context.column(vararg views: View): LinearLayout = LinearLayout(this).apply {
    orientation = LinearLayout.VERTICAL
    views.forEach { view ->
        addView(
            view,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT,
            ).apply { setMargins(dp(4), dp(4), dp(4), dp(4)) },
        )
    }
}

/**
 * Sarlavhali slayder. Qiymat 0..max oralig'ida, onChange har o'zgarishda chaqiriladi.
 * decimals va suffix faqat ko'rinish uchun (masalan "%").
 */
fun Context.slider(
    label: String,
    initial: Float,
    max: Float = 1f,
    decimals: Int = 2,
    suffix: String = "",
    onChange: (Float) -> Unit,
): LinearLayout {
    fun render(v: Float) = "$label: " + String.format("%.${decimals}f%s", v, suffix)

    val caption = text(render(initial))
    val seek = SeekBar(this).apply {
        this.max = 1000
        progress = ((initial / max) * 1000).toInt().coerceIn(0, 1000)
        setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(bar: SeekBar, p: Int, fromUser: Boolean) {
                if (!fromUser) return
                val v = p / 1000f * max
                caption.text = render(v)
                onChange(v)
            }

            override fun onStartTrackingTouch(bar: SeekBar) {}
            override fun onStopTrackingTouch(bar: SeekBar) {}
        })
    }
    return column(caption, seek)
}

/** [−] qiymat [+] boshqaruvi. Qiymat min..max oralig'ida. */
fun Context.stepper(label: String, initial: Int, min: Int, max: Int, onChange: (Int) -> Unit): LinearLayout {
    var value = initial.coerceIn(min, max)
    val caption = text("$label: $value", size = 15f)
    val minus = button("−") {
        if (value > min) {
            value--
            caption.text = "$label: $value"
            onChange(value)
        }
    }
    val plus = button("+") {
        if (value < max) {
            value++
            caption.text = "$label: $value"
            onChange(value)
        }
    }
    return row(minus, caption, plus)
}
