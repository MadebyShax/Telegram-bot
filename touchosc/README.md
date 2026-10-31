# TouchOSC — Resolume Arena boshqaruv paneli

Telefondan Resolume Arena'ni boshqarish uchun TouchOSC layout. Tuzilishi Arena'nikiga o'xshash: qatlamlar qator, kliplar katakcha, kolonkalar tepada.

## Fayllar

| Fayl | Til |
|---|---|
| `arena_uz.tosc` | O'zbekcha |
| `arena_ru.tosc` | Ruscha |
| `build_arena_layout.py` | Layoutni qayta yaratish skripti |
| `preview_uz.png` | Ekran ko'rinishi (oldindan ko'rish) |

## Ekran tuzilishi

- **Yuqori qator:** sarlavha, `TAP` (tempo), `QORA EKRAN`
- **Kolonkalar qatori:** `Kol. 1` … `Kol. 8` — bosilsa, shu kolonkadagi barcha kliplar ishga tushadi
- **Qatlamlar (5 ta qator):**
  - chapda `Qatlam N` — bosilsa, qatlam tanlanadi
  - o'rtada 8 ta `Klip` katakchasi — har biri bitta klipni ishga tushiradi
  - o'ngda: shaffoflik fader, `SOLO`, `O'CHIR`, `TOZALA`
- **Pastki qator:** `ASOSIY` fader (umumiy shaffoflik) va `HAMMASINI TO'XTAT`

## 1-qadam: Telefonga o'rnatish

1. `arena_uz.tosc` faylini telefonga o'tkazing (Telegram, Google Drive, USB — qaysi biri qulay bo'lsa).
2. Faylni bosing va **TouchOSC** bilan oching.
3. Layout ochilganda, u ekranda ko'rinadi. Landshaft rejimga o'tkazing.

## 2-qadam: Kompyuter bilan ulash

**TouchOSC'da:** Settings → Connections → OSC bo'limida:
- Connection 1: yoqing
- Host: Arena ishlayotgan kompyuterning IP manzili (masalan `192.168.1.10`)
- Port: `7000` (Arena'ning standart OSC kirish porti; sozlamalarda tekshiring)

**Arena'da:** Preferences → OSC bo'limida OSC yoqilganini va portlar mosligini tekshiring. Arena'dan teskari aloqa (holat yangilanishi) kerak bo'lsa, telefon IP'si va TouchOSC'ning kirish porti (odatda `9000`) yoziladi.

Bir xil Wi-Fi tarmog'ida bo'lishi shart. Kompyuter firewall'i UDP portlarni bloklamasligi kerak.

## 3-qadam: Tekshirish

Arena'da OSC monitorni oching va har bir tugmani bosib ko'ring. To'g'ri kelgan xabar monitorda ko'rinadi.

Quyidagi manzillar **Resolume'ning rasmiy ro'yxatidan tasdiqlanmagan** (men bu sinovni sayt bloklangani uchun bajara olmadim). Ular ehtimol noto'g'ri:

- `/composition/tempo/tap`
- `/composition/video/blackout`
- `/composition/disconnectall`

Agar biror tugma ishlamasa, Arena'da shu funksiyaning haqiqiy manzilini toping va `build_arena_layout.py` ichidagi `OSC` lug'atida tuzating.

## Qayta yaratish (ixtiyoriy)

Layoutni o'zgartirmoqchi bo'lsangiz (manzil, rang, qatlam soni):

```bash
pip install py2tosc==0.5.2
python3 build_arena_layout.py
```

Sozlamalar skriptning boshida:
- `LAYERS` — qatlamlar soni (standart 5)
- `COLUMNS` — kolonkalar soni (standart 8)
- `OSC` — barcha OSC manzillar
- `TEXTS` — matnlar (yangi til qo'shish mumkin)

## Cheklovlar

- Klip va qatlam **nomlari** statik yozilgan (`Klip 1`, `Qatlam 1`). Arena'dagi haqiqiy nomlar va rasmlar (thumbnail) ko'rinmaydi, chunki bu teskari aloqa talab qiladi.
- Tugmalar holati (qaysi klip yoqilgan) telefonda aks etmaydi. Buni keyingi bosqichda qo'shish mumkin.
- Layout TouchOSC 1.9.12 Editor'da sinab ko'rilmagan. Fayl formati TouchOSC 1.x bilan mos bo'lishi kerak, lekin ochilganda biror xatolik chiqsa, xabarni yuboring.
