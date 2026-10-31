package com.madebyshax.arenacompanion.arena

import java.io.IOException
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Resolume WebAPI (REST) klienti. Arena'da WebServer yoqilgan bo'lishi kerak.
 * Standart port: 8080. Klip nomlari va miniatyuralar shu API'dan olinadi.
 *
 * Yo'llar bitfocus/companion-module-resolume-arena dagi arena-api/rest.ts dan olingan.
 * Chaqiruvlar fon oqimida bajarilishi kerak.
 */
class ArenaRest(private val host: String, private val port: Int) {

    /** Butun kompozitsiya JSON holatida. */
    fun fetchComposition(): String =
        get("composition") { it.bufferedReader().use { reader -> reader.readText() } }

    /** Klip miniatyurasi (rasm baytlari, odatda JPEG/PNG). */
    fun fetchThumbnail(layer: Int, column: Int): ByteArray =
        get("composition/layers/$layer/clips/$column/thumbnail") { it.readBytes() }

    private fun <T> get(path: String, read: (InputStream) -> T): T {
        val connection = URL("http://$host:$port/api/v1/$path").openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "GET"
            connection.connectTimeout = 3000
            connection.readTimeout = 5000
            connection.setRequestProperty("Accept", "application/json")
            val code = connection.responseCode
            if (code !in 200..299) throw IOException("HTTP $code")
            return connection.inputStream.use(read)
        } finally {
            connection.disconnect()
        }
    }
}
