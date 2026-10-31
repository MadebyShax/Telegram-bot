# 3D QR APK — xatolarni tuzatish va qayta yig'ish

Asl fayl: `4951bcb6-3D_QR.apk` (com.threedqr.app, v1.0.0, minSdk 24, targetSdk 33).
Natija: `3DQR-fixed.apk`.

## 1. Nima xato edi

APK — WebView ichida ochiladigan veb-ilova (Vite bilan yig'ilgan React). Ekran bo'sh chiqishining sabablari:

| # | Muammo | Belgisi | Tuzatish |
|---|---|---|---|
| 1 | Fayl nomlari Windows'dagi `\` bilan saqlangan: `assets\index-XXX.js` | JS/CSS topilmaydi, ekran bo'sh | Fayllar to'g'ri joyga qo'yildi (`assets/app.js`, `assets/app.css`) |
| 2 | `index.html` da yo'llar `/assets/...` (mutlaq) | `file:///android_asset/` da `file:///assets/...` ga aylanadi | Nisbiy yo'llar (`./app.js`) |
| 3 | Bundle `<script type="module">` bilan `file://` dan yuklanadi | Chromium/WebView module skriptni CORS bilan bloklaydi | Bundle esbuild bilan bitta klassik IIFE skriptga aylantirildi (model-viewer ichiga kiritildi) |
| 4 | API manzili `/api` (nisbiy) | Har bir backend so'rovi qurilmaning fayl tizimiga boradi | `https://3dqr.io/api` (bundle'ning o'zida ishlatilgan asosiy host) |
| 5 | Imzo asl kalitga tegishli, mazmun o'zgargan | Imzo buzilgan bo'lardi | Yangi kalit bilan qayta imzolandi (v2) |
| 6 | Telefon kengligida sahifa 462px | "Sign In" tugmasi kesilgan | CSS tuzatishlari (faqat telefon kengligiga ta'sir qiladi) |
| 7 | Ortiqcha CDN `<script>` (model-viewer) | Har safar internetdan yuklanardi | Olib tashlandi, model-viewer bundle ichida |

Tahlil uchun foydali faktlar:
- `classes.dex` — bitta `MainActivity`, u `file:///android_asset/index.html` ni ochadi. Java kodiga tegilmadi.
- Ruxsatlar: INTERNET, ACCESS_NETWORK_STATE, CAMERA, MODIFY_AUDIO_SETTINGS, READ/WRITE_EXTERNAL_STORAGE.
- Ilova tili: EN / UZ / RU.

## 2. Qanday tekshirildi

- Chromium (Playwright) da `file://` orqali yuklab tekshirildi:
  - asl APK: `root` bo'sh, CORS va 404 xatolari (xato takrorlandi);
  - tuzatilgan APK: konsolda xato yo'q, UI render bo'ldi, `model-viewer` ro'yxatdan o'tdi;
  - telefon kengligi (412px): gorizontal siljish yo'q, "Sign In" ko'rinadi.
- APK imzosi: `verified=true, v2=true` (apksig 2.3.0).
- `resources.arsc` 4 baytga hizalangan; `classes.dex`, `AndroidManifest.xml`, `res/` asl fayl bilan bir xil.

**Tekshirilmagan:** haqiqiy Android qurilma/emulyator (sandboxda Android SDK yo'q) va backend (`3dqr.io`) — tarmoq siyosati tomonidan bloklangan.

## 3. Build qilish

Talablar: Python 3, JDK 17+, Node.js (npx), internet (esbuild va apksig uchun).

```bash
# 1) apksig 2.3.0 (imzolash kutubxonasi) — bir marta
mkdir -p tools
curl -L -o tools/apksig.jar https://repo1.maven.org/maven2/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar

# 2) build
python3 build_apk.py /path/to/4951bcb6-3D_QR.apk 3DQR-fixed.apk
```

Kalit fayli `~/.apk-keys/3dqr-fix.p12` da avtomatik yaratiladi. **Uni zaxiralang** — kelgusidagi yangilanishlar shu kalit bilan imzolanishi kerak.

## 4. O'rnatish

1. Eski ilovani o'chiring (`3D QR`). Imzo boshqacha, shuning uchun ustiga o'rnatib bo'lmaydi. **Eski ilovaning ichki ma'lumotlari o'chadi.**
2. `3DQR-fixed.apk` ni telefonga o'rnating (noma'lum manbadan o'rnatishga ruxsat kerak).
3. Ilovani oching va EN/UZ/RU tillari, Sign In tugmalarini tekshiring.

## 5. Xavflar va hal qilinmagan joylar

1. **Backend ulanishi (eng katta xavf).** Ilova `https://3dqr.io/api` ga so'rov yuboradi. Ilova `file://` (origin `null`) dan ochiladi, shuning uchun server CORS'da `null` yoki `*` ga ruxsat berishi kerak. Tekshirish:
   ```bash
   curl -i -H "Origin: null" https://3dqr.io/api/
   ```
   Agar `Access-Control-Allow-Origin` yo'q bo'lsa, login va yuklash ishlamaydi. Tuzatish serverda yoki APK'da (quyidagi 2-variant).
2. **Google bilan kirish.** Google OAuth'ni o'rnatilgan WebView'larda ko'pincha rad etadi (`disallowed_useragent`). "Sign In with Google" tugmasi ishlamasligi mumkin. Taxminiy; sinab ko'rilmagan. "Demo User" yoki Administrator kirishi ishlashi mumkin, agar backend ruxsat bersa.
3. **Imzo.** Yangi kalit — eski ilovani ustiga yangilab bo'lmaydi (1-qadam).
4. **Manba kodi yo'q.** APK faqat yig'ilgan bundle. Tuzatishlar shu bundle ustida. Uzoq muddatda asl Vite loyihasini olish kerak: `vite.config.ts` da `base: './'` va API manzilini env orqali berish.
5. **Ikonka.** Ikonkalar 299 baytlik placeholder PNG (asl APK'da ham shunday).

## 6. Muqobil yondashuvlar (taqqoslash)

| Yondashuv | Afzallik | Kamchilik |
|---|---|---|
| **A. Hozirgi: file:// + klassik skript** (tanlangan) | Java'ga tegilmaydi, SDK kerak emas | WebView sozlamalariga bog'liq; fayl tizimi origin'i CORS muammolarini tug'diradi |
| **B. WebViewAssetLoader** (`https://appassets.androidplatform.net/...`) | Google tavsiya qiladigan usul; CORS/module muammolari yo'q | `MainActivity.java` ni qayta yozish, `androidx.webkit` kutubxonasi, Android SDK bilan `d8`/`aapt2` kerak |
| **C. Asl Vite loyiha + qayta build** | Eng toza va barqaror, kod boshqariladi | Asl manba kerak (APK'da yo'q) |

Keyingi qadam uchun tavsiya: avval 1-variantni telefonda sinab ko'ring. Backend CORS ishlamasa, B ga o'ting.

## 7. Fayllar

- `build_apk.py` — tuzatish va build skripti (yagona manba).
- `tools/ApkSign.java` — apksig orqali imzolash/tekshirish (kompilyatsiya qilinadi).
- `3DQR-fixed.apk` — tayyor, imzolangan APK.
