package com.madebyshax.arenacompanion

import com.madebyshax.arenacompanion.arena.ArenaSnapshot
import com.madebyshax.arenacompanion.arena.ClipInfo
import com.madebyshax.arenacompanion.arena.ClipState
import com.madebyshax.arenacompanion.arena.ColumnInfo
import com.madebyshax.arenacompanion.arena.clipStateOf
import com.madebyshax.arenacompanion.arena.layerNameFromJson
import org.junit.Assert.assertEquals
import org.junit.Test

class ArenaSnapshotTest {

    @Test
    fun clipStatusJsonGivesNameAndState() {
        val info = ClipInfo.fromJson(
            """{"id":3,"name":{"value":"Ring A"},"connected":{"value":"Connected","index":1,"options":["Empty","Connected"]}}""",
        )
        assertEquals(ClipInfo("Ring A", ClipState.CONNECTED), info)
    }

    @Test
    fun emptyClipHasNoName() {
        val info = ClipInfo.fromJson("""{"name":{"value":""},"connected":{"value":"Disconnected"}}""")
        assertEquals(ClipInfo("", ClipState.EMPTY), info)
    }

    @Test
    fun layerAndColumnNamesParse() {
        assertEquals("Rings", layerNameFromJson("""{"name":{"value":"Rings"}}"""))
        assertEquals(
            ColumnInfo("Column 1", ClipState.CONNECTED),
            ColumnInfo.fromJson("""{"name":{"value":"Column 1"},"connected":{"value":"Connected"}}"""),
        )
    }

    @Test
    fun snapshotLooksUpByOneBasedIndex() {
        val snapshot = ArenaSnapshot(
            layerNames = mapOf(1 to "Rings"),
            clips = mapOf((1 to 1) to ClipInfo("Ring A", ClipState.PREVIEW)),
            columns = mapOf(1 to ColumnInfo("Column 1", ClipState.EMPTY)),
        )
        assertEquals("Rings", snapshot.layerName(1))
        assertEquals("Ring A", snapshot.clip(1, 1)!!.name)
        assertEquals(ClipState.PREVIEW, snapshot.clip(1, 1)!!.state)
        assertEquals(null, snapshot.layerName(2))
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
