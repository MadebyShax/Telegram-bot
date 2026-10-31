package com.madebyshax.arenacompanion.osc

import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer

/** OSC argumentining turi. Resolume Arena i (int), f (float) va s (string)ni qabul qiladi. */
sealed class OscArg {
    data class I(val value: Int) : OscArg()
    data class F(val value: Float) : OscArg()
    data class S(val value: String) : OscArg()
}

/**
 * OSC 1.0 xabari: manzil, tur tegi va argumentlar.
 * Hech qanday tashqi kutubxonasiz, to'g'ridan-to'g'ri baytlarga kodlanadi.
 */
data class OscMessage(val address: String, val args: List<OscArg> = emptyList()) {

    fun encode(): ByteArray {
        val out = ByteArrayOutputStream()
        out.writePaddedString(address)

        val tags = StringBuilder(",")
        for (arg in args) {
            tags.append(
                when (arg) {
                    is OscArg.I -> 'i'
                    is OscArg.F -> 'f'
                    is OscArg.S -> 's'
                }
            )
        }
        out.writePaddedString(tags.toString())

        for (arg in args) {
            when (arg) {
                is OscArg.I -> out.write(ByteBuffer.allocate(4).putInt(arg.value).array())
                is OscArg.F -> out.write(ByteBuffer.allocate(4).putFloat(arg.value).array())
                is OscArg.S -> out.writePaddedString(arg.value)
            }
        }
        return out.toByteArray()
    }
}

/** NUL bilan tugaydigan va 4 baytga tekislangan satr. Kamida bitta NUL bo'ladi. */
internal fun ByteArrayOutputStream.writePaddedString(text: String) {
    val bytes = text.toByteArray(Charsets.UTF_8)
    write(bytes)
    val padding = 4 - (bytes.size % 4)
    repeat(padding) { write(0) }
}
