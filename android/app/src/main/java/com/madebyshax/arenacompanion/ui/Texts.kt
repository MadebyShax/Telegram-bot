package com.madebyshax.arenacompanion.ui

import java.util.Locale

/**
 * Matnlar: o'zbekcha va ruscha. Telefon tili ruscha bo'lsa rus tili, aks holda o'zbek tili tanlanadi.
 * Yangi matn qo'shish uchun ikkala lug'atga ham yozing.
 */
object Texts {

    private val isRussian = Locale.getDefault().language == "ru"

    private val uz = mapOf(
        "tabClips" to "Klipler",
        "tabLayer" to "Qatlam",
        "tabClip" to "Klip",
        "tabGroups" to "Guruhlar",
        "tabComp" to "Kompozitsiya",
        "tabSettings" to "Sozlamalar",
        "layer" to "Qatlam",
        "column" to "Kolonka",
        "group" to "Guruh",
        "deck" to "Deck",
        "select" to "Tanlash",
        "clear" to "Tozalash",
        "bypass" to "O'chirish",
        "solo" to "Solo",
        "connect" to "Ishga tushirish",
        "backward" to "Orqaga",
        "pause" to "Pauza",
        "forward" to "Oldinga",
        "restart" to "Boshidan",
        "opacity" to "Shaffoflik",
        "volume" to "Ovoz",
        "speed" to "Tezlik",
        "master" to "Asosiy",
        "transition" to "O'tish (s)",
        "position" to "Pozitsiya",
        "prevClip" to "◀ Klip",
        "nextClip" to "Klip ▶",
        "prevColumn" to "◀ Kolonka",
        "nextColumn" to "Kolonka ▶",
        "stopAll" to "HAMMASINI TO'XTAT",
        "tap" to "TAP",
        "resync" to "RESYNC",
        "tempo" to "Tempo (BPM)",
        "setTempo" to "Temponi qo'llash",
        "blackout" to "Qora ekran",
        "restore" to "Tiklash",
        "direction" to "Yo'nalish",
        "prevDeck" to "◀ Deck",
        "nextDeck" to "Deck ▶",
        "selectDeck" to "Deckni tanlash",
        "trigger" to "Ishga tushirish",
        "groupClear" to "Guruhni tozalash",
        "selectColumn" to "Kolonkani tanlash",
        "customOsc" to "Maxsus OSC",
        "address" to "Manzil",
        "value" to "Qiymat",
        "send" to "Yuborish",
        "host" to "Kompyuter IP",
        "port" to "Port",
        "lastColumn" to "Oxirgi kolonka",
        "save" to "Saqlash",
        "saved" to "Saqlandi",
        "error" to "Xatolik",
        "sendingTo" to "Manzil",
    )

    private val ru = mapOf(
        "tabClips" to "Клипы",
        "tabLayer" to "Слой",
        "tabClip" to "Клип",
        "tabGroups" to "Группы",
        "tabComp" to "Композиция",
        "tabSettings" to "Настройки",
        "layer" to "Слой",
        "column" to "Колонка",
        "group" to "Группа",
        "deck" to "Дек",
        "select" to "Выбрать",
        "clear" to "Очистить",
        "bypass" to "Выключить",
        "solo" to "Solo",
        "connect" to "Запуск",
        "backward" to "Назад",
        "pause" to "Пауза",
        "forward" to "Вперёд",
        "restart" to "С начала",
        "opacity" to "Прозрачность",
        "volume" to "Громкость",
        "speed" to "Скорость",
        "master" to "Мастер",
        "transition" to "Переход (с)",
        "position" to "Позиция",
        "prevClip" to "◀ Клип",
        "nextClip" to "Клип ▶",
        "prevColumn" to "◀ Колонка",
        "nextColumn" to "Колонка ▶",
        "stopAll" to "СТОП ВСЁ",
        "tap" to "TAP",
        "resync" to "RESYNC",
        "tempo" to "Темп (BPM)",
        "setTempo" to "Применить темп",
        "blackout" to "Блэкаут",
        "restore" to "Включить",
        "direction" to "Направление",
        "prevDeck" to "◀ Дек",
        "nextDeck" to "Дек ▶",
        "selectDeck" to "Выбрать дек",
        "trigger" to "Запуск",
        "groupClear" to "Очистить группу",
        "selectColumn" to "Выбрать колонку",
        "customOsc" to "Свой OSC",
        "address" to "Адрес",
        "value" to "Значение",
        "send" to "Отправить",
        "host" to "IP компьютера",
        "port" to "Порт",
        "lastColumn" to "Последняя колонка",
        "save" to "Сохранить",
        "saved" to "Сохранено",
        "error" to "Ошибка",
        "sendingTo" to "Адрес",
    )

    fun get(key: String): String {
        val table = if (isRussian) ru else uz
        return table[key] ?: uz[key] ?: key
    }
}

/** Qisqa yozuv: t("clear") */
fun t(key: String): String = Texts.get(key)
