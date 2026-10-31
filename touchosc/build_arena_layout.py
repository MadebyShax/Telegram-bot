#!/usr/bin/env python3
"""Resolume Arena uslubidagi TouchOSC layout generatori.

Ishlatish:
    pip install py2tosc==0.5.2
    python3 build_arena_layout.py

Natija (shu papkaga yoziladi):
    arena_uz.tosc  -- o'zbekcha yorliqlar
    arena_ru.tosc  -- ruscha yorliqlar

Tuzilma (Arena'dagidek):
    - yuqorida: sarlavha, TAP, qora ekran
    - kolonkalar qatori: har bir kolonkani ishga tushirish
    - qatlamlar: har bir qator bitta qatlam, ustunlar esa kliplar
    - qatlam o'ng tomonida: shaffoflik fader, SOLO, O'CHIR, TOZALA
    - pastda: asosiy (master) shaffoflik va hammasini to'xtatish
"""

from pathlib import Path

from py2tosc import ButtonType, Document, Orientation, Value, button, fader, label, ui

OUT_DIR = Path(__file__).resolve().parent

# Kanvas: landshaft telefon ekrani uchun (TouchOSC o'lchamga moslaydi)
W, H = 1024, 600

# Joylashuv (piksel). Hamma qiymatlar bir joyda, shuning uchun sozlash oson.
TOP_H = 50
COL_Y, COL_H = 56, 38
ROW_Y0, ROW_STEP, ROW_H = 102, 88, 84
BOTTOM_Y, BOTTOM_H = 546, 48

LAYER_X, LAYER_W = 0, 150
CELL_X0, CELL_W, CELL_STEP = 155, 84, 88
RIGHT_X, RIGHT_W = 866, 148

LAYERS = 5
COLUMNS = 8

# Ranglar: Arena'ning qorong'i mavzusiga yaqin
BG = "#161616"
PANEL = "#262626"
TEXT = "#ffffff"
STOP = "#9c3030"
TAP = "#2f6f8f"
BUTTON = "#3a3a3a"
LAYER_COLORS = ["#2f5f9e", "#2f8052", "#a8782a", "#7d4696", "#a84545"]

# Resolume Arena OSC manzillari. Manba: bitfocus/companion-module-resolume-arena
# (src/ papkasidagi buyruqlar). Arena versiyasi boshqacha bo'lsa, shu lug'atni tuzating.
OSC = {
    "tap": "/composition/tempocontroller/tempotap",
    "video_opacity": "/composition/video/opacity",
    "column": "/composition/columns/{col}/connect",
    "layer_select": "/composition/layers/{layer}/select",
    "clip": "/composition/layers/{layer}/clips/{col}/connect",
    "opacity": "/composition/layers/{layer}/video/opacity",
    "solo": "/composition/layers/{layer}/solo",
    "bypass": "/composition/layers/{layer}/bypassed",
    "clear": "/composition/layers/{layer}/clear",
    "master": "/composition/master",
    "stop_all": "/composition/disconnect-all",
}

# Barcha matnlar shu yerda. Yangi til qo'shish uchun yangi lug'at kifoya.
TEXTS = {
    "uz": {
        "file": "arena_uz.tosc",
        "title": "ARENA  |  BOSHQARUV",
        "tap": "TAP",
        "blackout": "QORA",
        "restore": "TIKLASH",
        "columns": "KOLONKALAR",
        "control": "BOSHQARUV",
        "master": "ASOSIY",
        "stop_all": "HAMMASINI TO'XTAT",
        "layer": "Qatlam {n}",
        "clip": "Klip {n}",
        "column": "Kol. {n}",
        "opacity": "Shaffoflik",
        "solo": "SOLO",
        "bypass": "O'CHIR",
        "clear": "TOZALA",
    },
    "ru": {
        "file": "arena_ru.tosc",
        "title": "ARENA  |  УПРАВЛЕНИЕ",
        "tap": "TAP",
        "blackout": "БЛЭК",
        "restore": "ВКЛ",
        "columns": "КОЛОНКИ",
        "control": "УПРАВЛЕНИЕ",
        "master": "МАСТЕР",
        "stop_all": "СТОП ВСЁ",
        "layer": "Слой {n}",
        "clip": "Клип {n}",
        "column": "Кол. {n}",
        "opacity": "Прозрачность",
        "solo": "SOLO",
        "bypass": "ВЫКЛ",
        "clear": "СБРОС",
    },
}


def dim(hex_color: str, factor: float) -> str:
    """Rangni qorong'ilashtiradi. Klip katakchalari qatlam rangining xira varianti bo'ladi."""
    channels = (int(hex_color[i : i + 2], 16) for i in (1, 3, 5))
    return "#" + "".join(f"{round(c * factor):02x}" for c in channels)


def caption(name: str, frame: tuple, text: str, size: int = 12) -> object:
    """Tugma ustidagi yozuv. Yozuv ham, fon ham shaffof va u sichqoncha/teginishni o'tkazadi."""
    return label(
        name=name,
        frame=frame,
        background=False,
        outline=False,
        text_color=TEXT,
        text_size=size,
        values=[Value("text", default=text), Value("touch", default=False)],
    )


def panel(name: str, frame: tuple, text: str, color: str = PANEL, size: int = 13) -> object:
    """Oddiy sarlavha paneli (fonli yozuv)."""
    return label(
        name=name,
        frame=frame,
        color=color,
        text_color=TEXT,
        text_size=size,
        values=[Value("text", default=text), Value("touch", default=False)],
    )


def add_button(
    root,
    name: str,
    frame: tuple,
    color: str,
    text: str,
    address: str,
    *,
    toggle: bool = False,
    value: str = "1",
    conversion: str = "INTEGER",
    size: int = 12,
) -> None:
    """Tugma qo'shadi.

    toggle=False: bosilganda `value` yuboradi (klip, kolonka, tozalash, qora ekran).
    toggle=True:  holat o'zgarganda x qiymatini butun son sifatida yuboradi (SOLO, O'CHIR).
    Companion moduli ham triggerlarni butun son (i) sifatida yuboradi.
    """
    if toggle:
        btn = button(
            name=name,
            frame=frame,
            color=color,
            button_type=ButtonType.TOGGLE_PRESS,
            messages=[ui.osc(address, args=[ui.value("x", conversion="INTEGER")], on="ANY")],
        )
    else:
        btn = button(
            name=name,
            frame=frame,
            color=color,
            messages=[
                ui.osc(address, args=[ui.const(value, conversion=conversion)], on="RISE")
            ],
        )
    root.children.append(btn)
    if text:
        root.children.append(caption(f"{name}_txt", frame, text, size))


def add_fader(root, name: str, frame: tuple, color: str, address: str, text: str = "") -> None:
    """Gorizontal fader. Boshlang'ich qiymati 1.0 (to'liq ko'rinadigan)."""
    fd = fader(
        name=name,
        frame=frame,
        color=color,
        orientation=Orientation.EAST,
        values=[Value("x", default=1.0), Value("touch", default=False)],
        messages=[ui.osc(address, on="ANY")],
    )
    root.children.append(fd)
    if text:
        root.children.append(caption(f"{name}_txt", frame, text, 11))


def build(lang: str) -> Document:
    t = TEXTS[lang]
    doc = Document.new(frame=(0, 0, W, H), color=BG, name="ARENA")
    root = doc.root

    # 1. Yuqori panel: sarlavha, TAP va qora ekran
    root.children.append(panel("title", (0, 0, RIGHT_X - 10, TOP_H), t["title"], size=18))
    add_button(
        root, "tap", (400, 8, 90, TOP_H - 16), TAP, t["tap"],
        OSC["tap"],
    )
    # Qora ekran: video opacity 0 (qora), TIKLASH: qaytaradi (1)
    add_button(
        root, "blackout", (RIGHT_X, 8, 72, TOP_H - 16), STOP, t["blackout"],
        OSC["video_opacity"], value="0", conversion="FLOAT", size=11,
    )
    add_button(
        root, "restore", (RIGHT_X + 76, 8, 72, TOP_H - 16), BUTTON, t["restore"],
        OSC["video_opacity"], value="1", conversion="FLOAT", size=11,
    )

    # 2. Kolonkalar qatori
    root.children.append(panel("columns_hdr", (LAYER_X, COL_Y, LAYER_W, COL_H), t["columns"]))
    for c in range(1, COLUMNS + 1):
        add_button(
            root,
            f"column_{c}",
            (CELL_X0 + (c - 1) * CELL_STEP, COL_Y, CELL_W, COL_H),
            BUTTON,
            t["column"].format(n=c),
            OSC["column"].format(col=c),
        )
    root.children.append(panel("control_hdr", (RIGHT_X, COL_Y, RIGHT_W, COL_H), t["control"]))

    # 3. Qatlamlar: har biri bitta qator
    for n in range(1, LAYERS + 1):
        y = ROW_Y0 + (n - 1) * ROW_STEP
        color = LAYER_COLORS[(n - 1) % len(LAYER_COLORS)]
        clip_color = dim(color, 0.55)

        # Qatlam nomi: bosilsa qatlam tanlanadi
        add_button(
            root, f"layer_{n}_select", (LAYER_X, y, LAYER_W, ROW_H), color,
            t["layer"].format(n=n), OSC["layer_select"].format(layer=n), size=14,
        )

        # Kliplar: har bir katakcha bitta klipni ishga tushiradi
        for c in range(1, COLUMNS + 1):
            add_button(
                root,
                f"clip_{n}_{c}",
                (CELL_X0 + (c - 1) * CELL_STEP, y, CELL_W, ROW_H),
                clip_color,
                t["clip"].format(n=c),
                OSC["clip"].format(layer=n, col=c),
            )

        # O'ng blok: shaffoflik fader va uchta tugma
        add_fader(
            root, f"layer_{n}_opacity", (RIGHT_X, y, RIGHT_W, 30), color,
            OSC["opacity"].format(layer=n), t["opacity"],
        )
        third = (RIGHT_W - 2 * 3) // 3
        add_button(
            root, f"layer_{n}_solo", (RIGHT_X, y + 36, third, 48), BUTTON,
            t["solo"], OSC["solo"].format(layer=n), toggle=True, size=11,
        )
        add_button(
            root, f"layer_{n}_bypass", (RIGHT_X + third + 3, y + 36, third, 48), BUTTON,
            t["bypass"], OSC["bypass"].format(layer=n), toggle=True, size=11,
        )
        add_button(
            root, f"layer_{n}_clear", (RIGHT_X + 2 * (third + 3), y + 36, third, 48), BUTTON,
            t["clear"], OSC["clear"].format(layer=n), size=11,
        )

    # 4. Pastki panel: asosiy fader va hammasini to'xtatish
    root.children.append(panel("master_hdr", (LAYER_X, BOTTOM_Y, LAYER_W, BOTTOM_H), t["master"]))
    add_fader(
        root, "master", (CELL_X0, BOTTOM_Y, RIGHT_X - CELL_X0 - 10, BOTTOM_H), "#4a4a4a",
        OSC["master"],
    )
    add_button(
        root, "stop_all", (RIGHT_X, BOTTOM_Y, RIGHT_W, BOTTOM_H), STOP, t["stop_all"],
        OSC["stop_all"], size=11,
    )

    return doc


def main() -> None:
    for lang in TEXTS:
        doc = build(lang)
        path = OUT_DIR / TEXTS[lang]["file"]
        doc.save(path)
        print(f"Yozildi: {path} ({sum(1 for _ in doc.walk()) - 1} ta boshqaruv)")


if __name__ == "__main__":
    main()
