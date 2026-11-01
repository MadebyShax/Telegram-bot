package com.madebyshax.arenacompanion.arena

import java.io.IOException
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL

/**
 * Resolume WebAPI (REST) klienti. Arena'da WebServer yoqilgan bo'lishi kerak (standart port 8080).
 *
 * Faqat bitfocus/companion-module-resolume-arena moduli ishlatadigan, tasdiqlangan yo'llar:
 *   composition/layers/{l}                 -> qatlam nomi
 *   composition/columns/{c}                -> kolonka nomi va holati
 *   composition/layers/{l}/clips/{c}       -> klip nomi va holati
 *   composition/layers/{l}/clips/{c}/thumbnail -> miniatura (tana rasm baytlari, modul uni base64 qiladi)
 *
 * Chaqiruvlar fon oqimida bajarilishi kerak.
 */
class ArenaRest(private val host: String, private val port: Int) {

    fun fetchLayer(layer: Int): String = getJson("composition/layers/$layer")

    fun fetchColumn(column: Int): String = getJson("composition/columns/$column")

    fun fetchClip(layer: Int, column: Int): String = getJson("composition/layers/$layer/clips/$column")

    /** Miniatura baytlari. Odatda JPEG yoki PNG, ba'zan base64 matn. */
    fun fetchThumbnail(layer: Int, column: Int): ByteArray =
        get("composition/layers/$layer/clips/$column/thumbnail") { it.readBytes() }

    private fun getJson(path: String): String =
        get(path) { it.bufferedReader().use { reader -> reader.readText() } }

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
