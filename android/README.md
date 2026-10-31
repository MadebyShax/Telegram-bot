# Arena Companion — Resolume Arena uchun Android boshqaruv ilovasi

Telefondan Resolume Arena'ning barcha OSC komandalarini boshqarish uchun ilova. Companion moduli (bitfocus/companion-module-resolume-arena) dagi OSC komandalariga asoslangan. Interfeys TouchOSC layoutiga o'xshash: qatlamlar, kliplar, kolonkalar, guruhlar va kompozitsiya.

## Ekranlar

| Sahifa | Nima qiladi |
|---|---|
| **Klipler** | Qatlam × kolonka to'ri. Har bir katakcha klipni ishga tushiradi. Tepada kolonkalar va HAMMASINI TO'XTAT. |
| **Qatlam** | Tanlangan qatlam: tanlash, tozalash, O'CHIRISH va SOLO (toggle), klip oldinga/orqaga, yo'nalish, shaffoflik, ovoz, master, tezlik, o'tish vaqti. |
| **Klip** | Tanlangan klip: ishga tushirish, tanlash, boshidan, yo'nalish (orqaga/pauza/oldinga), shaffoflik, ovoz, tezlik (%), pozitsiya. |
| **Guruhlar** | Layer group: kolonka ishga tushirish, keyingi/oldingi kolonka, tozalash, o'chirish, solo, master, shaffoflik, ovoz, tezlik, yo'nalish. |
| **Kompozitsiya** | Master, shaffoflik, ovoz, tezlik; BPM va TAP/RESYNC; yo'nalish; kolonka; deck; QORA EKRAN/TIKLASH; maxsus OSC manzil. |
| **Sozlamalar** | Kompyuter IP, port (standart 7000), guruh kolonkalari uchun oxirgi kolonka raqami. |

Matnlar telefon tiliga qarab o'zbekcha yoki ruscha chiqadi.

## Resolume Arena sozlamalari

Preferences → OSC:
- Input port: `7000` (telefon shu portga yuboradi)
- Output: telefon IP'si, port `7001`

Telefon va kompyuter bir xil Wi-Fi tarmog'ida bo'lishi kerak. Ilovada IP'ni **Sozlamalar** sahifasida kiriting va saqlang.

## APK ni olish

Kod GitHub'da `.github/workflows/android-apk.yml` orqali avtomatik yig'iladi:
1. GitHub'da repozitoriyaning **Actions** bo'limini oching.
2. "Android APK" ishini tanlang va oxirgi muvaffaqiyatli yugurishni oching.
3. **Artifacts** dan `arena-companion-apk` ni yuklab oling, ichidan `app-debug.apk` ni oling.
4. Telefonda "noma'lum manbalardan o'rnatish" ruxsatini bering va APK ni o'rnating.

## Kompyuterda yig'ish (ixtiyoriy)

Android Studio bilan `android/` papkasini oching va **Run** ni bosing. Yoki terminalda:

```bash
cd android
./gradlew testDebugUnitTest assembleDebug
```

Natija: `app/build/outputs/apk/debug/app-debug.apk`.

## Loyiha tuzilishi

```
android/app/src/main/java/com/madebyshax/arenacompanion/
├── osc/
│   ├── OscMessage.kt   OSC xabarini baytlarga kodlash (kutubxonasiz)
│   └── OscSender.kt    UDP yuborish, fon oqimida
├── arena/
│   ├── ArenaCommands.kt  Barcha Resolume komandalari katalogi
│   └── ArenaClient.kt    Pulse (1→0), toggle va guruh kolonkasi holati
├── ui/
│   ├── Texts.kt        O'zbekcha/ruscha matnlar
│   ├── Ui.kt           Tugma, slayder, stepper yordamchilari
│   ├── Pages.kt        Barcha sahifalar
│   └── AppSettings.kt  Saqlanadigan sozlamalar
└── MainActivity.kt     Asosiy ekran va sahifa almashtirish
```

Yangi komanda qo'shish: `ArenaCommands.kt` ga funksiya yozing, so'ng kerakli sahifaga tugma qo'shing.

## Cheklovlar

- **Teskari aloqa (feedback) yo'q.** Resolume'dan holat kelmaydi: klip nomlari, faol klip va toggle holati telefonda taxmin qilinadi. Toggle tugmalari ilova ochilganidan beri yuborilgan so'nggi holatni eslaydi.
- **Vaqt asosidagi komandalar** (masalan, "klipni 5 soniya oldinga") klip davomiyligini bilishni talab qiladi, shuning uchun hozircha yo'q. Normallashtirilgan pozitsiya (0..1) bor.
- **Re-Query** (faol klip ma'lumotini so'rash) ham teskari aloqa talab qiladi, shuning uchun yo'q.
- **Maxsus OSC** faqat float qiymat yuboradi.
- Manzillar Companion modulining kodidan olingan. Arena versiyasi boshqacha bo'lsa, ayrim manzillar farq qilishi mumkin.
- Ilova hali haqiqiy telefonda sinalmagan. Birinchi ishga tushirishda xatolik bo'lsa, xabarni yuboring.
