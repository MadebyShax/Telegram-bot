package com.madebyshax.arenacompanion

import com.madebyshax.arenacompanion.arena.ArenaCommands
import com.madebyshax.arenacompanion.arena.Direction
import com.madebyshax.arenacompanion.osc.OscArg
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ArenaCommandsTest {

    @Test
    fun connectClipIsPulseOnCorrectAddress() {
        val cmd = ArenaCommands.connectClip(1, 2)
        assertTrue(cmd.pulse)
        assertEquals("/composition/layers/1/clips/2/connect", cmd.message.address)
        assertEquals(listOf<OscArg>(OscArg.I(1)), cmd.message.args)
    }

    @Test
    fun stopAllUsesDisconnectAllAddress() {
        assertEquals("/composition/disconnectall", ArenaCommands.stopAll().message.address)
    }

    @Test
    fun tempoTapUsesTempoControllerAddress() {
        assertEquals("/composition/tempocontroller/tempotap", ArenaCommands.tempoTap().message.address)
    }

    @Test
    fun layerBypassSendsIntegerFlag() {
        val on = ArenaCommands.layerBypass(3, true)
        val off = ArenaCommands.layerBypass(3, false)
        assertFalse(on.pulse)
        assertEquals(listOf<OscArg>(OscArg.I(1)), on.message.args)
        assertEquals(listOf<OscArg>(OscArg.I(0)), off.message.args)
        assertEquals("/composition/layers/3/bypassed", on.message.address)
    }

    @Test
    fun opacityIsFloat() {
        val cmd = ArenaCommands.layerOpacity(2, 0.5f)
        assertEquals("/composition/layers/2/video/opacity", cmd.message.address)
        assertEquals(listOf<OscArg>(OscArg.F(0.5f)), cmd.message.args)
    }

    @Test
    fun directionCodesMatchResolume() {
        assertEquals(0, Direction.BACKWARD.code)
        assertEquals(1, Direction.PAUSE.code)
        assertEquals(2, Direction.FORWARD.code)
    }

    @Test
    fun clipSpeedFormulaMatchesCompanionModule() {
        // getSpeedValue(100) = (100/10)^(log4/log10) = 4
        assertEquals(4.0f, ArenaCommands.clipSpeedValue(100f), 0.0001f)
        assertEquals(1.0f, ArenaCommands.clipSpeedValue(10f), 0.0001f)
    }
}
