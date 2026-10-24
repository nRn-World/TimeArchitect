#!/usr/bin/env python3
"""Generate the Time Architect app icon and splash screen.

Pure Pillow, no external assets. Everything is drawn at 3x and downsampled for
clean anti-aliased edges, so the output is reproducible on any machine.

Usage: python tools/make-icons.py
Writes: assets/icon.png (1024x1024), assets/splash.png (2732x2732)
"""

from __future__ import annotations

import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")

BG_TOP = (18, 36, 52)
BG_BOTTOM = (3, 6, 11)
BRASS_LIGHT = (255, 243, 210)
BRASS = (255, 199, 107)
BRASS_DARK = (138, 90, 36)
CYAN_LIGHT = (230, 253, 255)
CYAN = (111, 230, 255)
CYAN_DEEP = (11, 51, 64)
STEEL = (42, 74, 92)


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def radial(size, center, radius, inner, outer):
    """Radial gradient image; alpha fades to 0 at the rim when outer is None."""
    work = 192
    img = Image.new("RGBA", (work, work), (0, 0, 0, 0))
    px = img.load()
    k = work / size
    center = (center[0] * k, center[1] * k)
    radius = radius * k
    cx, cy = center
    for y in range(work):
        dy = y - cy
        for x in range(work):
            d = math.hypot(x - cx, dy) / radius
            if d >= 1:
                continue
            t = d
            if outer is None:
                a = int(inner[3] * (1 - t))
                px[x, y] = (inner[0], inner[1], inner[2], a)
            else:
                c = lerp(inner, outer, t)
                a = int(inner[3] + (outer[3] - inner[3]) * t)
                px[x, y] = (c[0], c[1], c[2], a)
    return img.resize((size, size), Image.LANCZOS)


def background(size):
    work = 256
    img = Image.new("RGB", (work, work), BG_BOTTOM)
    px = img.load()
    for y in range(work):
        for x in range(work):
            t = (x / work) * 0.45 + (y / work) * 0.55
            t = min(1.0, max(0.0, t * 1.25))
            px[x, y] = lerp(BG_TOP, BG_BOTTOM, t ** 0.9)
    return img.resize((size, size), Image.BICUBIC)


def brass_gradient(width, height):
    grad = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    px = grad.load()
    for y in range(height):
        for x in range(width):
            t = (x / width) * 0.5 + (y / height) * 0.5
            c = lerp(BRASS_LIGHT, BRASS, min(1.0, t * 1.8)) if t < 0.55 else lerp(BRASS, BRASS_DARK, (t - 0.55) / 0.45)
            px[x, y] = (c[0], c[1], c[2], 255)
    return grad


def ring_mask(size, radius, width):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    c = size / 2
    d.ellipse([c - radius, c - radius, c + radius, c + radius], outline=255, width=max(1, int(width)))
    return mask


def draw_emblem(size, glow=True):
    """Return an RGBA emblem image of the given square size."""
    s = size
    c = s / 2
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))

    if glow:
        halo = radial(s, (c, c), s * 0.5, (CYAN[0], CYAN[1], CYAN[2], 46), None)
        img.alpha_composite(halo)
        core_glow = radial(s, (c, c), s * 0.30, (CYAN[0], CYAN[1], CYAN[2], 210), None)
        core_glow = core_glow.filter(ImageFilter.GaussianBlur(s * 0.06))
        img.alpha_composite(core_glow)

    draw = ImageDraw.Draw(img)

    def ring(radius, color, width):
        box = [c - radius, c - radius, c + radius, c + radius]
        draw.ellipse(box, outline=color, width=max(1, int(round(width))))

    # machined steel plate and inner grooves
    plate = radial(s, (c, c * 0.95), s * 0.4, (26, 52, 66, 235), (12, 26, 36, 235))
    plate_mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(plate_mask).ellipse([c - s * 0.355, c - s * 0.355, c + s * 0.355, c + s * 0.355], fill=255)
    img.paste(plate, (0, 0), plate_mask)

    ring(s * 0.315, (STEEL[0], STEEL[1], STEEL[2], 190), s * 0.006)
    ring(s * 0.258, (CYAN[0], CYAN[1], CYAN[2], 60), s * 0.004)
    ring(s * 0.196, (STEEL[0], STEEL[1], STEEL[2], 160), s * 0.004)

    # brass bezel: linear gradient masked into an annulus
    bezel_mask = ring_mask(s, s * 0.377, s * 0.026)
    bezel = brass_gradient(s, s)
    img.paste(bezel, (0, 0), bezel_mask)

    # hour ticks sit just inside the bezel
    for i in range(12):
        ang = math.radians(i * 30 - 90)
        major = i % 3 == 0
        a0 = s * 0.318
        a1 = s * (0.352 if major else 0.338)
        x0, y0 = c + math.cos(ang) * a0, c + math.sin(ang) * a0
        x1, y1 = c + math.cos(ang) * a1, c + math.sin(ang) * a1
        color = BRASS_LIGHT if major else (CYAN[0], CYAN[1], CYAN[2], 150)
        draw.line([(x0, y0), (x1, y1)], fill=color, width=max(1, int(s * (0.010 if major else 0.006))))

    # brass pointer: the frozen moment
    bar_w = s * 0.082
    bar_top = c - s * 0.245
    bar_bottom = c - s * 0.012
    bar = brass_gradient(int(bar_w), int(bar_bottom - bar_top))
    mask = Image.new("L", bar.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, bar.size[0] - 1, bar.size[1] - 1], radius=int(bar.size[0] * 0.38), fill=255)
    img.paste(bar, (int(c - bar_w / 2), int(bar_top)), mask)

    # glowing core
    core_r = s * 0.108
    core = radial(int(core_r * 2), (core_r, core_r), core_r, (CYAN_LIGHT[0], CYAN_LIGHT[1], CYAN_LIGHT[2], 255), (CYAN_DEEP[0], CYAN_DEEP[1], CYAN_DEEP[2], 255))
    img.alpha_composite(core, (int(c - core_r), int(c - core_r)))
    draw.ellipse([c - core_r, c - core_r, c + core_r, c + core_r], outline=(CYAN_LIGHT[0], CYAN_LIGHT[1], CYAN_LIGHT[2], 150), width=max(1, int(s * 0.0045)))

    # aperture and specular
    ap = s * 0.036
    draw.ellipse([c - ap, c - ap, c + ap, c + ap], fill=(5, 18, 26, 235))
    dot = s * 0.012
    draw.ellipse([c - dot, c - dot + s * 0.004, c + dot, c + dot + s * 0.004], fill=(255, 255, 255, 235))

    # specular sweep on the bezel
    arc = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ad = ImageDraw.Draw(arc)
    box = [c - s * 0.377, c - s * 0.377, c + s * 0.377, c + s * 0.377]
    ad.arc(box, start=205, end=320, fill=(255, 252, 240, 190), width=max(1, int(s * 0.010)))
    ad.arc(box, start=20, end=70, fill=(255, 236, 190, 120), width=max(1, int(s * 0.008)))
    arc = arc.filter(ImageFilter.GaussianBlur(s * 0.006))
    img.alpha_composite(arc)

    return img


def make_icon():
    size = 1024
    ss = size * 3
    base = background(ss).convert("RGBA")
    emblem = draw_emblem(ss)
    base.alpha_composite(emblem)
    base = base.filter(ImageFilter.GaussianBlur(0.6))
    out = base.resize((size, size), Image.LANCZOS).convert("RGB")
    out.save(os.path.join(ASSETS, "icon.png"), optimize=True)
    for edge in (512, 192, 180):
        out.resize((edge, edge), Image.LANCZOS).save(os.path.join(ASSETS, f"icon-{edge}.png"), optimize=True)
    print("wrote assets/icon.png and 512/192/180 derivatives")


def make_splash():
    size = 2732
    ss = size
    base = Image.new("RGB", (ss, ss), (3, 6, 11))
    glow = radial(ss, (ss / 2, ss * 0.42), ss * 0.62, (16, 32, 46, 255), (3, 6, 11, 255))
    base.paste(glow, (0, 0), glow)

    emblem_size = int(ss * 0.42)
    emblem = draw_emblem(emblem_size)
    ex = (ss - emblem_size) // 2
    ey = int(ss * 0.30)
    base.paste(emblem, (ex, ey), emblem)

    draw = ImageDraw.Draw(base)
    # wordmark
    try:
        font = ImageFont.load_default(size=int(ss * 0.058))
    except TypeError:  # very old Pillow
        font = ImageFont.load_default()
    title = "TIME ARCHITECT"
    tracking = ss * 0.012
    widths = [draw.textlength(ch, font=font) for ch in title]
    total = sum(widths) + tracking * (len(title) - 1)
    x = (ss - total) / 2
    y = ss * 0.742
    for ch, w in zip(title, widths):
        draw.text((x, y), ch, font=font, fill=(244, 217, 164))
        x += w + tracking

    # hairline + studio credit with manual tracking
    line_y = ss * 0.722
    draw.line([(ss * 0.33, line_y), (ss * 0.67, line_y)], fill=(255, 199, 107, 90), width=max(2, int(ss * 0.0012)))

    try:
        small = ImageFont.load_default(size=int(ss * 0.024))
    except TypeError:
        small = ImageFont.load_default()
    credit = "BY NRNWORLD"
    track = ss * 0.006
    ws = [draw.textlength(ch, font=small) for ch in credit]
    total_w = sum(ws) + track * (len(credit) - 1)
    cx = (ss - total_w) / 2
    for ch, w in zip(credit, ws):
        draw.text((cx, ss * 0.862), ch, font=small, fill=(111, 139, 156))
        cx += w + track

    base = base.filter(ImageFilter.GaussianBlur(0.8))
    base = base.resize((size, size), Image.LANCZOS)
    base.save(os.path.join(ASSETS, "splash.png"), optimize=True)
    print("wrote assets/splash.png", base.size)


if __name__ == "__main__":
    make_icon()
    make_splash()
