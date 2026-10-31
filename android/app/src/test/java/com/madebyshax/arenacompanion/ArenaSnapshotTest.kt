package com.madebyshax.arenacompanion

import com.madebyshax.arenacompanion.arena.ArenaSnapshot
import com.madebyshax.arenacompanion.arena.ClipState
import com.madebyshax.arenacompanion.arena.clipStateOf
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class ArenaSnapshotTest {

    private val json = """
        {
          "layers": [
            {
              "name": {"value": "Rings"},
              "clips": [
                {"name": {"value": "Ring A"}, "connected": {"value": "Connected"}},
                {"name": {"value": ""}, "connected": {"value": "Empty"}}
              ]
            }
          ],
          "columns": [ {"name": {"value": "Column 1"}} ]
        }
    """.trimIndent()

    @Test
    fun parsesNamesAndIndexesFromOne() {
        val snapshot = ArenaSnapshot.parse(json)
        assertEquals("Rings", snapshot.layerName(1))
        assertEquals("Column 1", snapshot.columnName(1))
        assertEquals("Ring A", snapshot.clip(1, 1)!!.name)
        assertEquals(ClipState.CONNECTED, snapshot.clip(1, 1)!!.state)
    }

    @Test
    fun emptyNameBecomesNull() {
        val snapshot = ArenaSnapshot.parse(json)
        assertNull(snapshot.layerName(2))
        assertNull(snapshot.clip(1, 2)!!.name.takeIf { it.isNotEmpty() })
        assertEquals(ClipState.EMPTY, snapshot.clip(1, 2)!!.state)
    }

    @Test
    fun clipStateRecognisesPreviewAndDisconnected() {
        assertEquals(ClipState.PREVIEW, clipStateOf("Preview"))
        assertEquals(ClipState.EMPTY, clipStateOf("Disconnected"))
        assertEquals(ClipState.CONNECTED, clipStateOf("connected"))
        assertEquals(ClipState.CONNECTED, clipStateOf("1"))
        assertEquals(ClipState.EMPTY, clipStateOf("0"))
    }
}
