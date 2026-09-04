"""Last Spark 자리표시자 에셋 생성 — 기획서 2.1.1 큐트-흑화 카툰 스타일.

배경(잿불 바 룸, 720x1280, 4레이어) + 캐릭터(SD 고양이, 60x90 x 8프레임 idle/walk).
고정 팔레트 6색에서 파생. 실행: Pillow가 설치된 파이썬으로 `python3 generate-placeholders.py`
(스크립트 위치 기준 background/, characters/cat/에 PNG를 덮어쓰고, 시스템 임시 폴더에
preview.png / strips.png 미리보기를 남긴다).
"""
import math
import os
import tempfile
from PIL import Image, ImageDraw, ImageFilter

# ── 고정 팔레트 (기획서 2.1.1) ──────────────────────────────
INK = (59, 42, 33)        # #3b2a21 잉크 브라운
CREAM = (232, 220, 196)   # #e8dcc4 크림 아이보리
MID = (107, 86, 71)       # #6b5647 잿빛 브라운
AMBER = (217, 142, 74)    # #d98e4a 황혼 앰버
MINT = (111, 227, 193)    # #6fe3c1 도깨비불 민트
BLOOD = (42, 13, 16)      # #2a0d10 핏빛 레드

def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def a_(rgb, alpha):
    return rgb + (alpha,)

W, H = 720, 1280
FLOOR_Y = 470  # 벽/바닥 경계

_HERE = os.path.dirname(os.path.abspath(__file__))
OUT_BG = f"{_HERE}/background"
OUT_CH = f"{_HERE}/characters/cat"

# ════════════════════════════════════════════════════════════
# 레이어 1: room-base — 벽 + 나무 바닥
# ════════════════════════════════════════════════════════════
def room_base():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)

    wall = mix(MID, (0, 0, 0), 0.72)          # 어두운 잿빛 벽
    wall_stripe = mix(MID, (0, 0, 0), 0.66)
    d.rectangle([0, 0, W, FLOOR_Y], fill=wall)
    for x in range(0, W, 72):                  # 은은한 세로 벽지 줄무늬
        d.rectangle([x, 0, x + 30, FLOOR_Y], fill=wall_stripe)

    # 걸레받이
    d.rectangle([0, FLOOR_Y - 26, W, FLOOR_Y], fill=mix(INK, (0, 0, 0), 0.25))
    d.line([0, FLOOR_Y - 26, W, FLOOR_Y - 26], fill=mix(INK, (0, 0, 0), 0.5), width=4)

    # 나무 바닥 — 가로 판자
    plank_light = mix(MID, CREAM, 0.08)
    plank_dark = mix(MID, (0, 0, 0), 0.12)
    row_h = 108
    y = FLOOR_Y
    row = 0
    while y < H:
        base = mix(plank_light, plank_dark, (row % 3) * 0.14)
        # 아래로 갈수록(가까울수록) 약간 밝고 따뜻하게
        t = (y - FLOOR_Y) / (H - FLOOR_Y)
        base = mix(base, AMBER, 0.06 + 0.05 * t)
        d.rectangle([0, y, W, y + row_h], fill=base)
        d.line([0, y, W, y], fill=mix(base, INK, 0.45), width=4)
        # 판자 세로 이음새 (행마다 어긋나게, 드문드문)
        off = (row * 233) % 360
        for x in range(-360 + off, W + 360, 360):
            d.line([x, y, x, y + row_h], fill=mix(base, INK, 0.3), width=3)
        y += row_h
        row += 1

    return img

# ════════════════════════════════════════════════════════════
# 공통 그리기 도우미
# ════════════════════════════════════════════════════════════
def frame_rect(d, box, fill, outline=INK, ow=6, r=14):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=ow)

# ════════════════════════════════════════════════════════════
# 레이어 2: wall-decor — 삐뚤어진 액자, 촛대, 낡은 전구줄
# ════════════════════════════════════════════════════════════
def wall_decor():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 늘어진 전구줄 (희미하게 몇 개만 살아있음)
    pts = [(int(x), int(70 + 46 * math.sin((x / W) * math.pi))) for x in range(0, W + 1, 8)]
    d.line(pts, fill=a_(mix(INK, (0, 0, 0), 0.2), 255), width=5)
    for i, (x, y) in enumerate(pts[::10]):
        alive = i % 3 == 1
        col = AMBER if alive else mix(MID, (0, 0, 0), 0.4)
        d.line([x, y, x, y + 16], fill=a_(mix(INK, (0, 0, 0), 0.2), 255), width=4)
        d.ellipse([x - 9, y + 14, x + 9, y + 32], fill=a_(col, 255), outline=a_(INK, 255), width=4)

    def crooked_frame(cx, cy, w, h, tilt, face):
        """삐뚤어진 액자. face: 함수(draw, box)"""
        fr = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
        fd = ImageDraw.Draw(fr)
        frame_rect(fd, [8, 8, w + 32, h + 32], mix(MID, (0, 0, 0), 0.35), ow=7, r=10)
        fd.rectangle([24, 24, w + 16, h + 16], fill=mix(BLOOD, (0, 0, 0), 0.35))
        face(fd, (24, 24, w + 16, h + 16))
        fr = fr.rotate(tilt, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(fr, (cx - fr.width // 2, cy - fr.height // 2))

    # 액자 1: 묘비 낙서
    def face_grave(fd, b):
        x0, y0, x1, y1 = b
        cx = (x0 + x1) // 2
        fd.rounded_rectangle([cx - 22, y0 + 22, cx + 22, y1 - 8], radius=18,
                             fill=mix(MID, CREAM, 0.25), outline=INK, width=4)
        fd.line([cx - 10, y0 + 44, cx + 10, y0 + 44], fill=INK, width=4)
        fd.line([cx - 10, y0 + 56, cx + 10, y0 + 56], fill=INK, width=4)
    crooked_frame(150, 240, 110, 130, -7, face_grave)

    # 액자 2: 초승달 그림
    def face_moon(fd, b):
        x0, y0, x1, y1 = b
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        fd.ellipse([cx - 26, cy - 26, cx + 26, cy + 26], fill=mix(CREAM, AMBER, 0.3))
        fd.ellipse([cx - 34, cy - 30, cx + 14, cy + 18], fill=mix(BLOOD, (0, 0, 0), 0.35))
    crooked_frame(570, 220, 120, 100, 5, face_moon)

    # 벽 촛대 x2
    def sconce(cx, cy):
        d.line([cx, cy + 22, cx, cy + 52], fill=a_(INK, 255), width=8)
        d.rounded_rectangle([cx - 26, cy + 48, cx + 26, cy + 62], radius=7,
                            fill=a_(mix(MID, (0, 0, 0), 0.3), 255), outline=a_(INK, 255), width=5)
        d.rounded_rectangle([cx - 10, cy - 6, cx + 10, cy + 26], radius=8,
                            fill=a_(mix(CREAM, MID, 0.35), 255), outline=a_(INK, 255), width=5)
        # 촛불 (앰버)
        d.polygon([(cx, cy - 34), (cx + 9, cy - 16), (cx, cy - 6), (cx - 9, cy - 16)],
                  fill=a_(AMBER, 255))
        d.polygon([(cx, cy - 26), (cx + 4, cy - 15), (cx, cy - 9), (cx - 4, cy - 15)],
                  fill=a_(mix(CREAM, AMBER, 0.35), 255))
    sconce(350, 260)
    sconce(60, 330)
    sconce(660, 330)

    return img

# ════════════════════════════════════════════════════════════
# 레이어 3: floor-props — 잿불 화로(제단), 러그, 방석, 화분, 인형
# ════════════════════════════════════════════════════════════
def floor_props():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 중앙 러그 (핏빛에서 파생한 낡은 자주색, 테두리 잉크)
    rug = mix(BLOOD, MID, 0.35)
    d.ellipse([120, 640, 600, 950], fill=a_(rug, 255), outline=a_(INK, 255), width=7)
    d.ellipse([170, 675, 550, 915], outline=a_(mix(rug, CREAM, 0.25), 255), width=5)

    # 잿불 화로 = 방전 제단 (벽 앞 중앙)
    hx, hy = 360, 520
    d.rounded_rectangle([hx - 110, hy - 30, hx + 110, hy + 46], radius=20,
                        fill=a_(mix(MID, (0, 0, 0), 0.42), 255), outline=a_(INK, 255), width=7)
    d.ellipse([hx - 86, hy - 44, hx + 86, hy + 10], fill=a_(mix(INK, (0, 0, 0), 0.3), 255),
              outline=a_(INK, 255), width=6)
    # 잿불 덩어리들
    for i, (ex, ey, r) in enumerate([(-46, -16, 16), (-8, -24, 20), (34, -14, 15), (12, -8, 11)]):
        col = mix(AMBER, BLOOD, 0.25 + 0.15 * (i % 2))
        d.ellipse([hx + ex - r, hy + ey - r, hx + ex + r, hy + ey + r], fill=a_(col, 255))
    d.ellipse([hx - 14, hy - 30, hx + 10, hy - 8], fill=a_(mix(CREAM, AMBER, 0.4), 255))
    # 화로 다리
    for lx in (-80, 70):
        d.rounded_rectangle([hx + lx, hy + 40, hx + lx + 22, hy + 74], radius=8,
                            fill=a_(mix(INK, (0, 0, 0), 0.2), 255))

    # 방석 3개
    def cushion(cx, cy, col):
        d.ellipse([cx - 52, cy - 26, cx + 52, cy + 26], fill=a_(col, 255), outline=a_(INK, 255), width=6)
        d.ellipse([cx - 34, cy - 15, cx + 34, cy + 15], outline=a_(mix(col, (0, 0, 0), 0.25), 255), width=4)
    cushion(180, 1030, mix(MID, BLOOD, 0.3))
    cushion(540, 1010, mix(MID, (0, 0, 0), 0.15))
    cushion(370, 1130, mix(MID, AMBER, 0.2))

    # 시든 화분
    px, py = 640, 760
    d.rounded_rectangle([px - 34, py, px + 34, py + 58], radius=10,
                        fill=a_(mix(BLOOD, MID, 0.5), 255), outline=a_(INK, 255), width=6)
    stem = mix(MID, (20, 60, 40), 0.45)
    d.line([px, py, px - 4, py - 60], fill=a_(stem, 255), width=7)
    for ang, ln in ((-2.4, 34), (-0.9, 40), (0.4, 30)):
        ex = px - 4 + int(math.cos(ang) * ln)
        ey = py - 60 + int(math.sin(ang) * ln) + 16
        d.line([px - 4, py - 60, ex, ey], fill=a_(stem, 255), width=5)
        d.ellipse([ex - 9, ey - 6, ex + 9, ey + 10], fill=a_(mix(stem, CREAM, 0.2), 255),
                  outline=a_(INK, 255), width=3)

    # 낡은 곰인형 (한쪽 귀 처짐, 단추 눈)
    bx, by = 96, 850
    bear = mix(MID, AMBER, 0.3)
    d.ellipse([bx - 34, by, bx + 34, by + 64], fill=a_(bear, 255), outline=a_(INK, 255), width=6)  # 몸
    d.ellipse([bx - 26, by - 42, bx + 26, by + 8], fill=a_(bear, 255), outline=a_(INK, 255), width=6)  # 머리
    d.ellipse([bx - 30, by - 52, bx - 10, by - 32], fill=a_(bear, 255), outline=a_(INK, 255), width=5)  # 귀
    d.ellipse([bx + 8, by - 44, bx + 28, by - 26], fill=a_(bear, 255), outline=a_(INK, 255), width=5)   # 처진 귀
    d.line([bx - 8, by - 22, bx - 2, by - 16], fill=a_(INK, 255), width=4)  # X 눈
    d.line([bx - 2, by - 22, bx - 8, by - 16], fill=a_(INK, 255), width=4)
    d.ellipse([bx + 6, by - 21, bx + 14, by - 13], fill=a_(INK, 255))       # 단추 눈
    d.line([bx - 6, by + 26, bx + 10, by + 30], fill=a_(INK, 255), width=4)  # 꿰맨 자국
    for sx in range(-4, 10, 5):
        d.line([bx + sx, by + 24, bx + sx + 2, by + 33], fill=a_(INK, 255), width=3)

    return img

# ════════════════════════════════════════════════════════════
# 레이어 4: vignette — 비네팅 + 잿불 광원 + 떠다니는 불씨
# ════════════════════════════════════════════════════════════
def vignette():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # 잿불 화로 주변 앰버 글로우
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for r, al in ((300, 26), (210, 34), (130, 44)):
        gd.ellipse([360 - r, 500 - int(r * 0.72), 360 + r, 500 + int(r * 0.72)], fill=a_(AMBER, al))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    img.alpha_composite(glow)

    # 가장자리 비네팅
    vig = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vig)
    vd.rectangle([0, 0, W, H], fill=150)
    vd.ellipse([-W * 0.35, -H * 0.25, W * 1.35, H * 1.25], fill=0)
    vig = vig.filter(ImageFilter.GaussianBlur(120))
    black = Image.new("RGBA", (W, H), a_(mix(BLOOD, (0, 0, 0), 0.6), 255))
    black.putalpha(vig)
    img.alpha_composite(black)

    # 떠다니는 불씨(앰버)와 도깨비불 조각(민트)
    spark = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spark)
    seeds = [(87, 411), (211, 305), (333, 356), (466, 288), (598, 402), (155, 620),
             (520, 585), (652, 690), (260, 500), (415, 460), (692, 250), (48, 240)]
    for i, (x, y) in enumerate(seeds):
        r = 4 + (i % 3) * 2
        col = MINT if i % 4 == 0 else AMBER
        sd.ellipse([x - r, y - r, x + r, y + r], fill=a_(col, 130))
        sd.ellipse([x - r * 2, y - r * 2, x + r * 2, y + r * 2], fill=a_(col, 40))
    spark = spark.filter(ImageFilter.GaussianBlur(2))
    img.alpha_composite(spark)

    return img

# ════════════════════════════════════════════════════════════
# 캐릭터 — 통통한 SD 고양이 + 머리 위 도깨비불
# ════════════════════════════════════════════════════════════
FW, FH, NFRAME = 60, 90, 8
S = 8  # 슈퍼샘플 배율

def draw_cat(frame, walking):
    """한 프레임 (FW*S x FH*S)에 그린 뒤 축소는 호출부에서."""
    img = Image.new("RGBA", (FW * S, FH * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    t = frame / NFRAME * 2 * math.pi

    bob = (3 if walking else 2) * math.sin(t)          # 몸통 들썩임
    oy = int(bob * S)
    ow = int(2.1 * S)                                   # 잉크 아웃라인 두께
    body = mix(CREAM, MID, 0.10)                        # 어스름에 맞춘 크림
    shade = mix(CREAM, MID, 0.32)

    cx = FW * S // 2
    top = int(32 * S) + oy      # 몸 블롭 상단
    bot = int(83 * S)           # 몸 블롭 하단 (발이 아래로 삐져나온다)

    # 꼬리 (몸 뒤에서 살랑 — 왼쪽)
    tsw = math.sin(t + 1.2) * 2.5
    tx = cx - int(24 * S)
    d.ellipse([tx - 6 * S, bot - int((26 + tsw) * S) + oy, tx + 6 * S, bot - int((14 + tsw) * S) + oy],
              fill=body, outline=INK, width=int(1.8 * S))

    # 귀 (몸 블롭 위 둥근 삼각)
    for side in (-1, 1):
        ex = cx + side * int(13 * S)
        etip = top - int(7 * S)
        d.polygon([(ex - 7 * S, top + 6 * S), (ex + 7 * S, top + 6 * S), (ex + side * 2 * S, etip)],
                  fill=body, outline=INK, width=ow)
        d.polygon([(ex - 3 * S, top + 4 * S), (ex + 3 * S, top + 4 * S), (ex + side * S, etip + 5 * S)],
                  fill=mix(BLOOD, CREAM, 0.35))

    # 발 (걷기: 좌우 교차 — 몸 아래로 살짝 삐져나옴)
    step = math.sin(t) * (3.5 if walking else 0)
    for side, ph in ((-1, 0), (1, math.pi)):
        fx = cx + side * int(10 * S) + int(step * math.cos(ph) * S)
        lift = int(max(0.0, math.sin(t + ph)) * (2.5 if walking else 0) * S)
        fy = bot + int(3 * S) - lift
        d.ellipse([fx - 6 * S, fy - 4 * S, fx + 6 * S, fy + 4 * S], fill=body, outline=INK,
                  width=int(1.8 * S))

    # 몸통 = 머리 (한 덩어리 블롭)
    d.ellipse([cx - 22 * S, top, cx + 22 * S, bot], fill=body, outline=INK, width=ow)
    # 아래쪽 은은한 그림자 셰이딩 (몸 블롭에 클리핑된 초승달)
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.ellipse([cx - 20 * S, bot - 26 * S, cx + 20 * S, bot + 8 * S], fill=a_(shade, 70))
    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([cx - 20 * S, top + int(1.2 * S), cx + 20 * S, bot - int(1.2 * S)], fill=255)
    sh.putalpha(Image.composite(sh.getchannel("A"), Image.new("L", img.size, 0), mask))
    img.alpha_composite(sh)

    eye_y = top + int(21 * S)
    blink = (not walking) and frame in (5,)
    for side in (-1, 1):
        exx = cx + side * int(9 * S)
        if blink:
            d.line([exx - 4 * S, eye_y, exx + 4 * S, eye_y], fill=INK, width=int(1.8 * S))
        else:
            # 반쯤 감긴 졸린 눈 — 위가 평평한 반원
            d.chord([exx - 4 * S, eye_y - 4 * S, exx + 4 * S, eye_y + 4 * S], 0, 180, fill=INK)
            d.line([exx - 4 * S, eye_y, exx + 4 * S, eye_y], fill=INK, width=int(1.2 * S))
        # 다크서클
        d.arc([exx - 4 * S, eye_y - S, exx + 4 * S, eye_y + 7 * S], 40, 140,
              fill=mix(MID, BLOOD, 0.4), width=int(1.1 * S))

    # 볼 (낡은 장미빛, 은은하게)
    for side in (-1, 1):
        bxx = cx + side * int(15 * S)
        ch = Image.new("RGBA", img.size, (0, 0, 0, 0))
        cd = ImageDraw.Draw(ch)
        cd.ellipse([bxx - 4 * S, eye_y + 6 * S, bxx + 4 * S, eye_y + 11 * S],
                   fill=a_(mix(mix(BLOOD, AMBER, 0.65), CREAM, 0.25), 130))
        img.alpha_composite(ch)

    # 입 (ω)
    my = eye_y + int(8 * S)
    d.arc([cx - 4 * S, my - 2 * S, cx, my + 2 * S], 0, 180, fill=INK, width=int(1.2 * S))
    d.arc([cx, my - 2 * S, cx + 4 * S, my + 2 * S], 0, 180, fill=INK, width=int(1.2 * S))

    # 머리 위 도깨비불 (민트 불꽃 — 깜빡이며 흔들림, 정수리 바로 위)
    fl = Image.new("RGBA", img.size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(fl)
    fh = 19 + 2.5 * math.sin(t * 2 + 0.7)                # 불꽃 높이 흔들림
    lean = (3.0 if walking else 1.5) * math.sin(t + 2)   # 좌우 흔들림
    fx = cx + int(lean * S)
    fbase = top - int(2 * S)                              # 정수리에 붙임
    fw = 6.0

    def teardrop(px, base_y, w, h, col):
        # 아래 둥근 몸통 + 위로 휘어진 뾰족 끝
        fd.ellipse([px - w * S, base_y - int(2 * w * S), px + w * S, base_y], fill=col)
        tipx = px + int(lean * 1.8 * S)
        fd.polygon([(tipx, base_y - int(h * S)),
                    (px + int(w * 0.92 * S), base_y - int(w * S)),
                    (px - int(w * 0.92 * S), base_y - int(w * S))], fill=col)

    teardrop(fx, fbase, fw, fh, a_(MINT, 235))
    teardrop(fx, fbase - int(1.5 * S), fw * 0.45, fh * 0.5, a_(mix(MINT, CREAM, 0.6), 245))
    glow = fl.filter(ImageFilter.GaussianBlur(int(2.2 * S)))
    img.alpha_composite(glow)
    img.alpha_composite(fl)

    return img

# 코드는 프레임을 논리 60×90으로 배치하고 Skia가 이미지를 목표 크기로 늘려
# 그리므로, PNG는 확대 시 안 깨지게 4배 해상도(240×360/프레임)로 내보낸다.
EXPORT_SCALE = 4

def sprite_strip(walking):
    ew, eh = FW * EXPORT_SCALE, FH * EXPORT_SCALE
    strip = Image.new("RGBA", (ew * NFRAME, eh), (0, 0, 0, 0))
    for f in range(NFRAME):
        big = draw_cat(f, walking)
        small = big.resize((ew, eh), Image.LANCZOS)
        strip.alpha_composite(small, (f * ew, 0))
    return strip

# ════════════════════════════════════════════════════════════
os.makedirs(OUT_BG, exist_ok=True)
os.makedirs(OUT_CH, exist_ok=True)

room_base().save(f"{OUT_BG}/room-base.png")
wall_decor().save(f"{OUT_BG}/wall-decor.png")
floor_props().save(f"{OUT_BG}/floor-props.png")
vignette().save(f"{OUT_BG}/vignette.png")
sprite_strip(False).save(f"{OUT_CH}/idle.png")
sprite_strip(True).save(f"{OUT_CH}/walk.png")

# ── 미리보기 합성 (씬 + 캐릭터 3마리) ──────────────────────
prev = room_base().convert("RGBA")
prev.alpha_composite(wall_decor())
prev.alpha_composite(floor_props())
idle = sprite_strip(False)
walk = sprite_strip(True)

def put_char(strip, frame, x, y, scale=2.4):
    ew, eh = FW * EXPORT_SCALE, FH * EXPORT_SCALE
    fr = strip.crop((frame * ew, 0, (frame + 1) * ew, eh))
    fr = fr.resize((int(FW * scale), int(FH * scale)), Image.LANCZOS)
    prev.alpha_composite(fr, (x, y))

put_char(idle, 0, 300, 640)
put_char(walk, 2, 120, 830)
put_char(idle, 3, 480, 900)
prev.alpha_composite(vignette())

PREV = os.path.join(tempfile.gettempdir(), "preview.png")
prev.save(PREV)

# 캐릭터 스트립 확대 미리보기
big = Image.new("RGBA", (FW * NFRAME * 2, FH * 4 + 20), (24, 18, 14, 255))
big.alpha_composite(idle.resize((FW * NFRAME * 2, FH * 2), Image.NEAREST), (0, 0))
big.alpha_composite(walk.resize((FW * NFRAME * 2, FH * 2), Image.NEAREST), (0, FH * 2 + 20))
big.save(PREV.replace("preview.png", "strips.png"))
print("done")
