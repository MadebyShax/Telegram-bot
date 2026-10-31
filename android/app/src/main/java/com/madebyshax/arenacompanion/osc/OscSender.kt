package com.madebyshax.arenacompanion.osc

import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/**
 * UDP orqali OSC yuboradi. Hamma tarmoq ishlari fon oqimida bajariladi,
 * shuning uchun UI oqimi hech qachon bloklanmaydi.
 */
class OscSender {

    private val executor = Executors.newSingleThreadScheduledExecutor()
    private val socket = DatagramSocket()

    @Volatile
    var host: String = "192.168.1.10"

    @Volatile
    var port: Int = 7000

    /** Xatolik bo'lsa chaqiriladi. U fon oqimidan chaqiriladi, shuning uchun UI'da qayta yo'naltiring. */
    @Volatile
    var onError: ((String) -> Unit)? = null

    fun send(message: OscMessage) {
        val bytes = message.encode()
        val targetHost = host
        val targetPort = port
        executor.execute { transmit(bytes, targetHost, targetPort) }
    }

    /** Xabarni belgilangan kechikishdan keyin yuboradi (masalan, pulse'ning 0 qismi uchun). */
    fun sendAfter(message: OscMessage, delayMs: Long) {
        val bytes = message.encode()
        val targetHost = host
        val targetPort = port
        executor.schedule(
            Runnable { transmit(bytes, targetHost, targetPort) },
            delayMs,
            TimeUnit.MILLISECONDS
        )
    }

    private fun transmit(bytes: ByteArray, targetHost: String, targetPort: Int) {
        try {
            val address = InetAddress.getByName(targetHost)
            socket.send(DatagramPacket(bytes, bytes.size, address, targetPort))
        } catch (e: Exception) {
            onError?.invoke(e.message ?: e.javaClass.simpleName)
        }
    }

    fun shutdown() {
        executor.shutdownNow()
        socket.close()
    }
}
