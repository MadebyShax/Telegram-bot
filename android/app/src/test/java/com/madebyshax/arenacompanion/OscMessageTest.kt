package com.madebyshax.arenacompanion

import com.madebyshax.arenacompanion.osc.OscArg
import com.madebyshax.arenacompanion.osc.OscMessage
import org.junit.Assert.assertArrayEquals
import org.junit.Test

class OscMessageTest {

    @Test
    fun encodesIntegerArgument() {
        // "/a" + 2 NUL, ",i" + 2 NUL, int 1 (big endian)
        val expected = byteArrayOf(
            0x2F, 0x61, 0, 0,
            0x2C, 0x69, 0, 0,
            0, 0, 0, 1,
        )
        assertArrayEquals(expected, OscMessage("/a", listOf(OscArg.I(1))).encode())
    }

    @Test
    fun encodesFloatArgument() {
        // 1.0f = 0x3F800000
        val expected = byteArrayOf(
            0x2F, 0x63, 0, 0,
            0x2C, 0x66, 0, 0,
            0x3F, 0x80.toByte(), 0, 0,
        )
        assertArrayEquals(expected, OscMessage("/c", listOf(OscArg.F(1.0f))).encode())
    }

    @Test
    fun addressThatFillsWordGetsFourNulBytes() {
        // "/abcd" is 5 bytes -> padded to 8, so 3 NUL bytes follow it
        val encoded = OscMessage("/abcd").encode()
        assertArrayEquals(
            byteArrayOf(0x2F, 0x61, 0x62, 0x63, 0x64, 0, 0, 0),
            encoded.copyOfRange(0, 8),
        )
    }

    @Test
    fun stringArgumentIsPadded() {
        // address "/s" + 2 NUL, tags ",s" + 2 NUL, then "x" + 3 NUL
        val expected = byteArrayOf(
            0x2F, 0x73, 0, 0,
            0x2C, 0x73, 0, 0,
            0x78, 0, 0, 0,
        )
        assertArrayEquals(expected, OscMessage("/s", listOf(OscArg.S("x"))).encode())
    }
}
