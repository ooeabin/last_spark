"""Last Spark 자리표시자 에셋 생성 — 기획서 2.1.1 큐트-흑화 카툰 스타일.

배경(잿불 바)은 화면보다 넓은 월드(논리 1440x2160)이고, 문으로 이어진 4개 구역
(잿불 홀·바 카운터·휴게 라운지·추모실)으로 나뉜다. 카메라가 내 캐릭터를 따라
스크롤한다(어몽어스식). 벽/문 좌표는 코드(free-roam/model/constants.ts의 WALLS)와
반드시 일치해야 한다 — 여기 LAYOUT 상수가 그 원본 수치다.
비네팅만 카메라를 따라다니는 화면 고정 오버레이라 별도 파일로 분리되어 있다.
캐릭터는 SD 고양이 60x90(논리) 8프레임. 고정 팔레트 6색에서 파생.
실행: Pillow가 설치된 파이썬으로 `python3 generate-placeholders.py`
(스크립트 위치 기준 background/, characters/cat/에 PNG를 덮어쓰고,
시스템 임시 폴더에 preview.png / worldmap.png / strips.png 미리보기를 남긴다).
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

# 월드(논리 pt) 크기 — free-roam/constants.ts WORLD_WIDTH/HEIGHT와 같아야 한다
LOGICAL_W, LOGICAL_H = 1440, 2160
K = 2                      # 확대 시 안 깨지게 2배 해상도로 내보낸다
W, H = LOGICAL_W * K, LOGICAL_H * K

# ── 방 레이아웃 (논리 pt) — free-roam/constants.ts의 WALLS/FLOOR_TOP과 일치 ──
FLOOR_Y = 340              # 상단 벽 하단 = 바닥 시작
HWALL_TOP, HWALL_BOT = 1080, 1170          # 가로 인테리어 벽 띠
HDOOR_L = (260, 440)                        # 가로벽 왼쪽 문 (x 구간)
HDOOR_R = (1000, 1180)                      # 가로벽 오른쪽 문
VWALL_X = (706, 734)                        # 세로 인테리어 벽 (x 구간)
VDOOR_TOP = (600, 780)                      # 위쪽 세로벽 문 (y 구간)
VDOOR_BOT = (1520, 1700)                    # 아래쪽 세로벽 문

_HERE = os.path.dirname(os.path.abspath(__file__))
OUT_BG = f"{_HERE}/background"
OUT_CH = f"{_HERE}/characters/cat"

wall_col = mix(MID, (0, 0, 0), 0.72)
wall_stripe = mix(MID, (0, 0, 0), 0.66)
baseboard = mix(INK, (0, 0, 0), 0.25)

# ════════════════════════════════════════════════════════════
# 레이어 1: room-base — 벽 + 방별 바닥 (월드 전체, 불투명)
# ════════════════════════════════════════════════════════════
def planks(d, x0, y0, x1, y1, tint, tint_t):
    """(x0..x1, y0..y1) 논리 영역에 나무 판자 바닥."""
    plank_light = mix(MID, CREAM, 0.08)
    plank_dark = mix(MID, (0, 0, 0), 0.12)
    row_h = 108
    row = y0 // row_h
    y = (y0 // row_h) * row_h
    while y < y1:
        base = mix(plank_light, plank_dark, (row % 3) * 0.14)
        base = mix(base, tint, tint_t)
        ry0, ry1 = max(y, y0), min(y + row_h, y1)
        d.rectangle([x0 * K, ry0 * K, x1 * K, ry1 * K], fill=base)
        if y >= y0:
            d.line([x0 * K, y * K, x1 * K, y * K], fill=mix(base, INK, 0.45), width=4 * K)
        off = (row * 233) % 360
        for x in range(-360 + off, LOGICAL_W + 360, 360):
            if x0 <= x <= x1:
                d.line([x * K, ry0 * K, x * K, ry1 * K], fill=mix(base, INK, 0.3), width=3 * K)
        y += row_h
        row += 1

def front_wall(d, x0, x1, y0, y1, doors=()):
    """정면(가로) 벽 띠 — 줄무늬 + 걸레받이. doors: 뚫을 x 구간 목록."""
    segs = []
    cur = x0
    for dx0, dx1 in sorted(doors):
        if dx0 > cur:
            segs.append((cur, dx0))
        cur = dx1
    if cur < x1:
        segs.append((cur, x1))
    for sx0, sx1 in segs:
        d.rectangle([sx0 * K, y0 * K, sx1 * K, y1 * K], fill=wall_col)
        for x in range(0, LOGICAL_W, 72):
            if sx0 <= x and x + 30 <= sx1:
                d.rectangle([x * K, y0 * K, (x + 30) * K, y1 * K], fill=wall_stripe)
        d.rectangle([sx0 * K, (y1 - 22) * K, sx1 * K, y1 * K], fill=baseboard)
        d.line([sx0 * K, (y1 - 22) * K, sx1 * K, (y1 - 22) * K], fill=mix(INK, (0, 0, 0), 0.5), width=4 * K)
        # 문설주 잉크 테두리
        for ex in (sx0, sx1):
            if ex not in (x0, x1):
                d.line([ex * K, y0 * K, ex * K, y1 * K], fill=mix(INK, (0, 0, 0), 0.45), width=4 * K)
    # 벽 아래 바닥 그림자
    for sx0, sx1 in segs:
        d.rectangle([sx0 * K, y1 * K, sx1 * K, (y1 + 12) * K], fill=a_((0, 0, 0), 60))

def side_wall(d, y0, y1, doors=()):
    """세로 인테리어 벽 — 어두운 기둥 띠. doors: 뚫을 y 구간 목록."""
    segs = []
    cur = y0
    for dy0, dy1 in sorted(doors):
        if dy0 > cur:
            segs.append((cur, dy0))
        cur = dy1
    if cur < y1:
        segs.append((cur, y1))
    for sy0, sy1 in segs:
        d.rectangle([VWALL_X[0] * K, sy0 * K, VWALL_X[1] * K, sy1 * K], fill=wall_col)
        d.rectangle([VWALL_X[0] * K, sy0 * K, VWALL_X[1] * K, sy1 * K],
                    outline=mix(INK, (0, 0, 0), 0.45), width=3 * K)
        # 기둥 끝 캡
        for ey in (sy0, sy1):
            if ey not in (y0, y1):
                d.rectangle([(VWALL_X[0] - 6) * K, (ey - 7) * K, (VWALL_X[1] + 6) * K, (ey + 7) * K],
                            fill=baseboard, outline=mix(INK, (0, 0, 0), 0.5), width=3 * K)

def room_base():
    img = Image.new("RGB", (W, H), wall_col)
    d = ImageDraw.Draw(img)

    # 방별 바닥 (잿불 홀 / 바 카운터 / 휴게 라운지 / 추모실)
    planks(d, 0, FLOOR_Y, VWALL_X[1], HWALL_BOT, AMBER, 0.08)                 # A 홀 — 따뜻한 갈색
    planks(d, VWALL_X[0], FLOOR_Y, LOGICAL_W, HWALL_BOT, BLOOD, 0.16)        # B 바 — 붉은 나무
    planks(d, 0, HWALL_TOP, VWALL_X[1], LOGICAL_H, CREAM, 0.10)              # C 휴게 — 밝고 포근
    planks(d, VWALL_X[0], HWALL_TOP, LOGICAL_W, LOGICAL_H, (52, 58, 56), 0.28)  # D 추모 — 차가운 잿빛

    # 상단 외벽 + 인테리어 벽 (문 뚫기)
    front_wall(d, 0, LOGICAL_W, 0, FLOOR_Y)
    front_wall(d, 0, LOGICAL_W, HWALL_TOP, HWALL_BOT, doors=(HDOOR_L, HDOOR_R))
    side_wall(d, FLOOR_Y, HWALL_TOP, doors=(VDOOR_TOP,))
    side_wall(d, HWALL_BOT, LOGICAL_H, doors=(VDOOR_BOT,))

    return img

# ════════════════════════════════════════════════════════════
# 공통 도우미
# ════════════════════════════════════════════════════════════
def frame_rect(d, box, fill, outline=INK, ow=6, r=14):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=ow)

def sconce(d, cx, cy):
    cx, cy = cx * K, cy * K
    d.line([cx, cy + 22 * K, cx, cy + 52 * K], fill=a_(INK, 255), width=8 * K)
    d.rounded_rectangle([cx - 26 * K, cy + 48 * K, cx + 26 * K, cy + 62 * K], radius=7 * K,
                        fill=a_(mix(MID, (0, 0, 0), 0.3), 255), outline=a_(INK, 255), width=5 * K)
    d.rounded_rectangle([cx - 10 * K, cy - 6 * K, cx + 10 * K, cy + 26 * K], radius=8 * K,
                        fill=a_(mix(CREAM, MID, 0.35), 255), outline=a_(INK, 255), width=5 * K)
    d.polygon([(cx, cy - 34 * K), (cx + 9 * K, cy - 16 * K), (cx, cy - 6 * K), (cx - 9 * K, cy - 16 * K)],
              fill=a_(AMBER, 255))
    d.polygon([(cx, cy - 26 * K), (cx + 4 * K, cy - 15 * K), (cx, cy - 9 * K), (cx - 4 * K, cy - 15 * K)],
              fill=a_(mix(CREAM, AMBER, 0.35), 255))

def mini_candle(d, cx, cy, flame=AMBER):
    cx, cy = cx * K, cy * K
    d.rounded_rectangle([cx - 7 * K, cy - 20 * K, cx + 7 * K, cy], radius=5 * K,
                        fill=a_(mix(CREAM, MID, 0.35), 255), outline=a_(INK, 255), width=3 * K)
    d.polygon([(cx, cy - 40 * K), (cx + 6 * K, cy - 27 * K), (cx, cy - 20 * K), (cx - 6 * K, cy - 27 * K)],
              fill=a_(flame, 255))

# 상단 외벽 촛대·전구줄·액자 위치 (A/B 공용)
SCONCES_TOP = ((70, 210), (560, 200))
SCONCES_HWALL = ((150, 1092), (560, 1092), (880, 1092), (1330, 1092))

# ════════════════════════════════════════════════════════════
# 레이어 2: wall-decor — 전구줄, 액자, 촛대, 술병 선반
# ════════════════════════════════════════════════════════════
def wall_decor():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # 늘어진 전구줄 (상단 외벽, 두 굽이 — 몇 개만 살아있음)
    pts = [(int(x), int((60 + 42 * abs(math.sin((x / W) * math.pi * 2))) * K))
           for x in range(0, W + 1, 8 * K)]
    d.line(pts, fill=a_(mix(INK, (0, 0, 0), 0.2), 255), width=5 * K)
    for i, (x, y) in enumerate(pts[::10]):
        alive = i % 3 == 1
        col = AMBER if alive else mix(MID, (0, 0, 0), 0.4)
        d.line([x, y, x, y + 16 * K], fill=a_(mix(INK, (0, 0, 0), 0.2), 255), width=4 * K)
        d.ellipse([x - 9 * K, y + 14 * K, x + 9 * K, y + 32 * K],
                  fill=a_(col, 255), outline=a_(INK, 255), width=4 * K)

    def crooked_frame(cx, cy, w, h, tilt, face):
        cx, cy, w, h = cx * K, cy * K, w * K, h * K
        fr = Image.new("RGBA", (w + 40 * K, h + 40 * K), (0, 0, 0, 0))
        fd = ImageDraw.Draw(fr)
        frame_rect(fd, [8 * K, 8 * K, w + 32 * K, h + 32 * K],
                   mix(MID, (0, 0, 0), 0.35), ow=7 * K, r=10 * K)
        fd.rectangle([24 * K, 24 * K, w + 16 * K, h + 16 * K], fill=mix(BLOOD, (0, 0, 0), 0.35))
        face(fd, (24 * K, 24 * K, w + 16 * K, h + 16 * K))
        fr = fr.rotate(tilt, expand=True, resample=Image.BICUBIC)
        img.alpha_composite(fr, (cx - fr.width // 2, cy - fr.height // 2))

    def face_grave(fd, b):
        x0, y0, x1, y1 = b
        cx = (x0 + x1) // 2
        fd.rounded_rectangle([cx - 22 * K, y0 + 22 * K, cx + 22 * K, y1 - 8 * K], radius=18 * K,
                             fill=mix(MID, CREAM, 0.25), outline=INK, width=4 * K)
        fd.line([cx - 10 * K, y0 + 44 * K, cx + 10 * K, y0 + 44 * K], fill=INK, width=4 * K)
        fd.line([cx - 10 * K, y0 + 56 * K, cx + 10 * K, y0 + 56 * K], fill=INK, width=4 * K)

    def face_moon(fd, b):
        x0, y0, x1, y1 = b
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        fd.ellipse([cx - 26 * K, cy - 26 * K, cx + 26 * K, cy + 26 * K], fill=mix(CREAM, AMBER, 0.3))
        fd.ellipse([cx - 34 * K, cy - 30 * K, cx + 14 * K, cy + 18 * K], fill=mix(BLOOD, (0, 0, 0), 0.35))

    # A 홀 벽: 액자 2 + 촛대
    crooked_frame(220, 190, 110, 130, -7, face_grave)
    crooked_frame(430, 170, 120, 100, 5, face_moon)
    for sx, sy in SCONCES_TOP:
        sconce(d, sx, sy)

    # B 바 벽: 술병 선반 2단
    def shelf(x0, x1, cy, seed):
        d.rounded_rectangle([x0 * K, cy * K, x1 * K, (cy + 16) * K], radius=6 * K,
                            fill=a_(mix(MID, (0, 0, 0), 0.35), 255), outline=a_(INK, 255), width=4 * K)
        cols = [mix(AMBER, BLOOD, 0.4), mix(MINT, MID, 0.45), mix(BLOOD, CREAM, 0.25),
                mix(MID, CREAM, 0.3), mix(AMBER, CREAM, 0.3)]
        x = x0 + 26
        i = seed
        while x < x1 - 30:
            bh = 46 + (i * 13) % 26
            bw = 12 + (i * 7) % 8
            col = cols[i % len(cols)]
            d.rounded_rectangle([(x - bw) * K, (cy - bh) * K, (x + bw) * K, cy * K], radius=6 * K,
                                fill=a_(col, 255), outline=a_(INK, 255), width=3 * K)
            d.rectangle([(x - 4) * K, (cy - bh - 14) * K, (x + 4) * K, (cy - bh) * K],
                        fill=a_(col, 255), outline=a_(INK, 255), width=3 * K)
            x += 24 + bw + (i * 5) % 14
            i += 1
    shelf(800, 1360, 170, 1)
    shelf(830, 1330, 280, 4)

    # 인테리어 가로벽: 작은 촛불들
    for sx, sy in SCONCES_HWALL:
        mini_candle(d, sx, sy + 42)

    return img

# ════════════════════════════════════════════════════════════
# 레이어 3: floor-props — 광원 글로우 + 방별 소품
# ════════════════════════════════════════════════════════════
def floor_props():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # ── 광원 글로우 (소품 아래 깔림) ──
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    def glow_at(cx, cy, r_base, strength=1.0, col=AMBER):
        cx, cy = cx * K, cy * K
        for r, al in ((r_base, 24), (int(r_base * 0.7), 32), (int(r_base * 0.42), 42)):
            r *= K
            gd.ellipse([cx - r, cy - int(r * 0.72), cx + r, cy + int(r * 0.72)],
                       fill=a_(col, int(al * strength)))
    glow_at(360, 700, 300)                    # A 화로
    glow_at(1080, 560, 260, 0.9)              # B 바 카운터
    glow_at(360, 1560, 170, 0.8)              # C 탁자 촛불
    glow_at(150, 1900, 130, 0.7)              # C 탁자 촛불
    glow_at(1000, 1500, 130, 0.7, MINT)       # D 묘비 도깨비불
    glow_at(1240, 1750, 130, 0.7, MINT)
    glow_at(900, 1950, 120, 0.6)              # D 촛불
    for sx, sy in SCONCES_TOP:
        glow_at(sx, sy - 20, 110, 0.6)
    for sx, sy in SCONCES_HWALL:
        glow_at(sx, sy + 20, 100, 0.5)
    glow = glow.filter(ImageFilter.GaussianBlur(60 * K))
    img.alpha_composite(glow)

    d = ImageDraw.Draw(img)

    def rug(cx, cy, rw, rh, col=None):
        cx, cy, rw, rh = cx * K, cy * K, rw * K, rh * K
        col = col or mix(BLOOD, MID, 0.35)
        d.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill=a_(col, 255), outline=a_(INK, 255), width=7 * K)
        d.ellipse([cx - int(rw * 0.78), cy - int(rh * 0.74), cx + int(rw * 0.78), cy + int(rh * 0.74)],
                  outline=a_(mix(col, CREAM, 0.25), 255), width=5 * K)

    def cushion(cx, cy, col):
        cx, cy = cx * K, cy * K
        d.ellipse([cx - 52 * K, cy - 26 * K, cx + 52 * K, cy + 26 * K],
                  fill=a_(col, 255), outline=a_(INK, 255), width=6 * K)
        d.ellipse([cx - 34 * K, cy - 15 * K, cx + 34 * K, cy + 15 * K],
                  outline=a_(mix(col, (0, 0, 0), 0.25), 255), width=4 * K)

    def table(cx, cy):
        tx, ty = cx * K, cy * K
        d.rounded_rectangle([tx - 110 * K, ty - 40 * K, tx + 110 * K, ty + 16 * K], radius=14 * K,
                            fill=a_(mix(MID, (0, 0, 0), 0.3), 255), outline=a_(INK, 255), width=6 * K)
        for lx in (-88, 68):
            d.rounded_rectangle([tx + lx * K, ty + 12 * K, tx + (lx + 20) * K, ty + 46 * K], radius=7 * K,
                                fill=a_(mix(INK, (0, 0, 0), 0.2), 255))
        mini_candle(d, cx, cy - 42)

    def plant(px, py):
        px, py = px * K, py * K
        d.rounded_rectangle([px - 34 * K, py, px + 34 * K, py + 58 * K], radius=10 * K,
                            fill=a_(mix(BLOOD, MID, 0.5), 255), outline=a_(INK, 255), width=6 * K)
        stem = mix(MID, (20, 60, 40), 0.45)
        d.line([px, py, px - 4 * K, py - 60 * K], fill=a_(stem, 255), width=7 * K)
        for ang, ln in ((-2.4, 34), (-0.9, 40), (0.4, 30)):
            ex = px - 4 * K + int(math.cos(ang) * ln * K)
            ey = py - 60 * K + int(math.sin(ang) * ln * K) + 16 * K
            d.line([px - 4 * K, py - 60 * K, ex, ey], fill=a_(stem, 255), width=5 * K)
            d.ellipse([ex - 9 * K, ey - 6 * K, ex + 9 * K, ey + 10 * K],
                      fill=a_(mix(stem, CREAM, 0.2), 255), outline=a_(INK, 255), width=3 * K)

    # ── A. 잿불 홀 — 방전 제단(화로) + 러그 ──
    hx, hy = 360 * K, 700 * K
    d.rounded_rectangle([hx - 130 * K, hy - 34 * K, hx + 130 * K, hy + 52 * K], radius=22 * K,
                        fill=a_(mix(MID, (0, 0, 0), 0.42), 255), outline=a_(INK, 255), width=7 * K)
    d.ellipse([hx - 102 * K, hy - 50 * K, hx + 102 * K, hy + 12 * K],
              fill=a_(mix(INK, (0, 0, 0), 0.3), 255), outline=a_(INK, 255), width=6 * K)
    for i, (ex, ey, r) in enumerate([(-56, -18, 18), (-10, -28, 23), (40, -16, 17), (14, -9, 12)]):
        col = mix(AMBER, BLOOD, 0.25 + 0.15 * (i % 2))
        d.ellipse([hx + (ex - r) * K, hy + (ey - r) * K, hx + (ex + r) * K, hy + (ey + r) * K],
                  fill=a_(col, 255))
    d.ellipse([hx - 16 * K, hy - 34 * K, hx + 12 * K, hy - 9 * K], fill=a_(mix(CREAM, AMBER, 0.4), 255))
    for lx in (-96, 82):
        d.rounded_rectangle([hx + lx * K, hy + 46 * K, hx + (lx + 24) * K, hy + 84 * K], radius=8 * K,
                            fill=a_(mix(INK, (0, 0, 0), 0.2), 255))
    mini_candle(d, 250, 780)
    mini_candle(d, 470, 780)
    rug(360, 900, 220, 130)
    cushion(150, 950, mix(MID, BLOOD, 0.3))
    cushion(560, 1000, mix(MID, AMBER, 0.2))
    plant(90, 480)
    plant(640, 470)

    # ── B. 바 카운터 — 카운터 + 스툴 + 잔 ──
    bx0, bx1, by = 820, 1360, 480
    d.rounded_rectangle([bx0 * K, (by - 60) * K, bx1 * K, (by + 30) * K], radius=16 * K,
                        fill=a_(mix(MID, BLOOD, 0.35), 255), outline=a_(INK, 255), width=7 * K)
    d.rounded_rectangle([bx0 * K, (by - 60) * K, bx1 * K, (by - 28) * K], radius=16 * K,
                        fill=a_(mix(MID, CREAM, 0.18), 255), outline=a_(INK, 255), width=5 * K)
    for i in range(4):  # 잔·병
        gx = bx0 + 90 + i * 120
        if i % 2 == 0:
            d.rounded_rectangle([(gx - 12) * K, (by - 76) * K, (gx + 12) * K, (by - 52) * K], radius=4 * K,
                                fill=a_(mix(AMBER, CREAM, 0.4), 220), outline=a_(INK, 255), width=3 * K)
        else:
            mini_candle(d, gx, by - 52, flame=AMBER)
    for i in range(4):  # 스툴
        sx = bx0 + 70 + i * 130
        d.ellipse([(sx - 30) * K, (by + 90) * K, (sx + 30) * K, (by + 134) * K],
                  fill=a_(mix(MID, (0, 0, 0), 0.25), 255), outline=a_(INK, 255), width=5 * K)
        d.ellipse([(sx - 20) * K, (by + 97) * K, (sx + 20) * K, (by + 124) * K],
                  outline=a_(mix(MID, CREAM, 0.2), 255), width=3 * K)
    rug(1080, 830, 200, 120, mix(BLOOD, MID, 0.28))
    cushion(880, 960, mix(MID, BLOOD, 0.3))
    cushion(1290, 990, mix(MID, (0, 0, 0), 0.15))
    plant(1370, 700)

    # ── C. 휴게 라운지 — 큰 러그 + 방석 + 탁자 + 곰인형 + 책더미 ──
    rug(360, 1600, 250, 155, mix(MID, AMBER, 0.18))
    for cx, cy, col in ((240, 1540, mix(MID, BLOOD, 0.3)), (480, 1560, mix(MID, (0, 0, 0), 0.15)),
                        (330, 1700, mix(MID, AMBER, 0.2)), (560, 1810, mix(MID, BLOOD, 0.3)),
                        (140, 1720, mix(MID, (0, 0, 0), 0.15))):
        cushion(cx, cy, col)
    table(360, 1450)
    table(150, 1970)

    def bear(bx, by):
        bx, by = bx * K, by * K
        col = mix(MID, AMBER, 0.3)
        d.ellipse([bx - 34 * K, by, bx + 34 * K, by + 64 * K], fill=a_(col, 255), outline=a_(INK, 255), width=6 * K)
        d.ellipse([bx - 26 * K, by - 42 * K, bx + 26 * K, by + 8 * K], fill=a_(col, 255), outline=a_(INK, 255), width=6 * K)
        d.ellipse([bx - 30 * K, by - 52 * K, bx - 10 * K, by - 32 * K], fill=a_(col, 255), outline=a_(INK, 255), width=5 * K)
        d.ellipse([bx + 8 * K, by - 44 * K, bx + 28 * K, by - 26 * K], fill=a_(col, 255), outline=a_(INK, 255), width=5 * K)
        d.line([bx - 8 * K, by - 22 * K, bx - 2 * K, by - 16 * K], fill=a_(INK, 255), width=4 * K)
        d.line([bx - 2 * K, by - 22 * K, bx - 8 * K, by - 16 * K], fill=a_(INK, 255), width=4 * K)
        d.ellipse([bx + 6 * K, by - 21 * K, bx + 14 * K, by - 13 * K], fill=a_(INK, 255))
        d.line([bx - 6 * K, by + 26 * K, bx + 10 * K, by + 30 * K], fill=a_(INK, 255), width=4 * K)
        for sx in range(-4, 10, 5):
            d.line([bx + sx * K, by + 24 * K, bx + (sx + 2) * K, by + 33 * K], fill=a_(INK, 255), width=3 * K)
    bear(620, 1290)

    def books(bx, by):
        cols = (mix(BLOOD, MID, 0.4), mix(MID, MINT, 0.2), mix(MID, AMBER, 0.3))
        for i, col in enumerate(cols):
            w_, h_ = 64 - i * 8, 16
            d.rounded_rectangle([(bx - w_ // 2) * K, (by - h_ * (i + 1)) * K,
                                 (bx + w_ // 2) * K, (by - h_ * i) * K], radius=4 * K,
                                fill=a_(col, 255), outline=a_(INK, 255), width=3 * K)
    books(90, 1350)
    plant(650, 2050)

    # ── D. 추모실 — 묘비 + 도깨비불 + 시든 꽃 ──
    def gravestone(gx, gy, wisp=False):
        gxk, gyk = gx * K, gy * K
        stone = mix(MID, CREAM, 0.2)
        d.rounded_rectangle([gxk - 40 * K, gyk - 80 * K, gxk + 40 * K, gyk], radius=32 * K,
                            fill=a_(stone, 255), outline=a_(INK, 255), width=6 * K)
        d.rectangle([gxk - 46 * K, gyk - 10 * K, gxk + 46 * K, gyk], fill=a_(mix(stone, (0, 0, 0), 0.25), 255),
                    outline=a_(INK, 255), width=4 * K)
        d.line([gxk - 18 * K, gyk - 52 * K, gxk + 18 * K, gyk - 52 * K], fill=a_(INK, 255), width=4 * K)
        d.line([gxk - 18 * K, gyk - 38 * K, gxk + 18 * K, gyk - 38 * K], fill=a_(INK, 255), width=4 * K)
        if wisp:
            d.ellipse([gxk - 10 * K, gyk - 118 * K, gxk + 10 * K, gyk - 92 * K], fill=a_(MINT, 200))
            d.polygon([(gxk, gyk - 132 * K), (gxk + 8 * K, gyk - 108 * K), (gxk - 8 * K, gyk - 108 * K)],
                      fill=a_(MINT, 200))
    gravestone(1000, 1500, wisp=True)
    gravestone(1240, 1750, wisp=True)
    gravestone(870, 1700)
    gravestone(1130, 1980)
    mini_candle(d, 940, 1540)
    mini_candle(d, 1300, 1790)
    mini_candle(d, 900, 1990)

    def wilted_flower(fx, fy):
        fx, fy = fx * K, fy * K
        stem = mix(MID, (20, 60, 40), 0.4)
        d.line([fx, fy, fx + 6 * K, fy - 34 * K], fill=a_(stem, 255), width=4 * K)
        d.line([fx + 6 * K, fy - 34 * K, fx + 18 * K, fy - 26 * K], fill=a_(stem, 255), width=4 * K)
        d.ellipse([fx + 12 * K, fy - 32 * K, fx + 26 * K, fy - 18 * K],
                  fill=a_(mix(BLOOD, CREAM, 0.3), 255), outline=a_(INK, 255), width=3 * K)
    wilted_flower(1050, 1520)
    wilted_flower(1190, 1990)
    rug(1080, 1300, 170, 95, mix((52, 58, 56), BLOOD, 0.3))

    # ── 떠다니는 불씨·도깨비불 조각 (월드 곳곳) ──
    spark = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(spark)
    seeds = [(170, 820), (420, 610), (660, 710), (930, 580), (1200, 800), (310, 1240),
             (1040, 1170), (1300, 1380), (520, 1000), (830, 920), (1380, 500), (100, 480),
             (240, 1900), (760, 1780), (1180, 2020), (960, 1550), (560, 2050), (60, 1200)]
    for i, (x, y) in enumerate(seeds):
        x, y = x * K, y * K
        r = (4 + (i % 3) * 2) * K
        col = MINT if i % 4 == 0 or x > 720 * K and y > 1170 * K else AMBER
        sd.ellipse([x - r, y - r, x + r, y + r], fill=a_(col, 130))
        sd.ellipse([x - r * 2, y - r * 2, x + r * 2, y + r * 2], fill=a_(col, 40))
    spark = spark.filter(ImageFilter.GaussianBlur(2 * K))
    img.alpha_composite(spark)

    return img

# ════════════════════════════════════════════════════════════
# vignette — 화면 고정 오버레이 (가장자리 어둡게). 카메라와 무관하게
# 스크린 전체에 덮이므로 월드가 아니라 화면 비율(720x1280 논리)로 만든다.
# ════════════════════════════════════════════════════════════
VIG_W, VIG_H = 720 * K, 1280 * K

def vignette():
    img = Image.new("RGBA", (VIG_W, VIG_H), (0, 0, 0, 0))
    vig = Image.new("L", (VIG_W, VIG_H), 0)
    vd = ImageDraw.Draw(vig)
    vd.rectangle([0, 0, VIG_W, VIG_H], fill=150)
    vd.ellipse([-VIG_W * 0.35, -VIG_H * 0.25, VIG_W * 1.35, VIG_H * 1.25], fill=0)
    vig = vig.filter(ImageFilter.GaussianBlur(120 * K))
    black = Image.new("RGBA", (VIG_W, VIG_H), a_(mix(BLOOD, (0, 0, 0), 0.6), 255))
    black.putalpha(vig)
    img.alpha_composite(black)
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

# ── 미리보기: 월드 전체 축소판 + 화면(720x1280) 뷰포트 크롭 ──
world = room_base().convert("RGBA")
world.alpha_composite(wall_decor())
world.alpha_composite(floor_props())
idle = sprite_strip(False)
walk = sprite_strip(True)

AVATAR_SCALE = 1.2  # 코드의 LoungeScene AVATAR_SCALE과 같은 값 (월드 대비 캐릭터 비율 확인용)

def put_char(strip, frame, x, y):
    """(x, y)는 논리 월드 좌표의 발밑 앵커."""
    ew, eh = FW * EXPORT_SCALE, FH * EXPORT_SCALE
    fr = strip.crop((frame * ew, 0, (frame + 1) * ew, eh))
    w, h = int(FW * AVATAR_SCALE * K), int(FH * AVATAR_SCALE * K)
    fr = fr.resize((w, h), Image.LANCZOS)
    world.alpha_composite(fr, (x * K - w // 2, y * K - h))

put_char(idle, 0, 360, 900)     # A 홀
put_char(walk, 2, 690, 700)     # A→B 문 근처
put_char(idle, 3, 1080, 900)    # B 바
put_char(walk, 5, 350, 1610)    # C 휴게
put_char(idle, 6, 1000, 1620)   # D 추모실

cam_x = min(max(360 * K - VIG_W // 2, 0), W - VIG_W)
cam_y = min(max(900 * K - VIG_H // 2, 0), H - VIG_H)
viewport = world.crop((cam_x, cam_y, cam_x + VIG_W, cam_y + VIG_H))
viewport.alpha_composite(vignette())

tmp = tempfile.gettempdir()
viewport.resize((720, 1280), Image.LANCZOS).save(os.path.join(tmp, "preview.png"))
world.resize((LOGICAL_W // 2, LOGICAL_H // 2), Image.LANCZOS).save(os.path.join(tmp, "worldmap.png"))

big = Image.new("RGBA", (FW * NFRAME * 2, FH * 4 + 20), (24, 18, 14, 255))
big.alpha_composite(idle.resize((FW * NFRAME * 2, FH * 2), Image.LANCZOS), (0, 0))
big.alpha_composite(walk.resize((FW * NFRAME * 2, FH * 2), Image.LANCZOS), (0, FH * 2 + 20))
big.save(os.path.join(tmp, "strips.png"))
print("done")
