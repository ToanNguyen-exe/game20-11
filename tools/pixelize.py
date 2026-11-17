"""
CODE QUEST - Sprite Pixelization Pipeline v3
===========================================
Turns the AI-generated, anti-aliased, black-fringed art into a genuine
pixel-art set that the canvas blits 1:1 (no runtime resampling, no distortion).

Source defects this fixes
-------------------------
1. 2,000-9,600 unique colours per sprite   -> one shared 56-colour palette
2. 96% of pixels have PARTIAL alpha        -> binary silhouette (no halo)
3. RGB premultiplied against BLACK         -> un-premultiply (no dark fringe)
4. Runtime resampling (70px -> 32px, 64px tile -> 40px) with smoothing off
                                           -> pre-pixelate to the exact blit
                                              size, so drawImage is always 1:1
5. Every tile has a baked-in bevel (bright top, dark bottom) so a tiled floor
   shows a dark grid                       -> de-bevel + edge stitch for
                                              repeated terrain only
6. Player frames have wildly different bounding boxes (58..109px tall for the
   same character), so fitting each frame into the same box makes the
   character visibly change size      -> ONE scale factor per category, so
                                          relative sizes are preserved
7. Props stretched (flag 0.64 AR drawn at 0.33 AR = -48%)
                                           -> preserve aspect, fit the
                                              declared footprint, bottom-align

Source of truth: assets/_source_sprites (pristine backup).
"""
import os
import re
import json
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "_source_sprites")
DST = os.path.join(ROOT, "assets", "sprites")

BLOCK = 2                  # px per logical pixel in the output
ALPHA_THRESHOLD = 128
PALETTE_SIZE = 56

# category -> height of that category's TALLEST sprite in output px.
# Everything in the category is scaled by the same factor.
CAT_TARGET_H = {
    "player": 40,
    "enemies": 40,
    "items": 32,
    "buffs": 32,
    "effects": 48,
    "ui": 60,
}

# tiles repeated across the map -> must not show a seam
TILE_HEAL = {
    "dirt": ("h", "v"), "stone": ("h", "v"), "ice": ("h", "v"),
    "wood_plank": ("h", "v"), "fire": ("h", "v"), "lava": ("h", "v"),
    "pipe_green": ("h", "v"), "pipe_red": ("h", "v"),
    "grass": ("h", "bottom"), "dirt_grass": ("h", "bottom"),
}
TILE_CONTAIN = {"ladder"}


# ---------------------------------------------------------------- helpers
def load_rgba(path):
    return np.array(Image.open(path).convert("RGBA")).astype(np.float32)


def unpremultiply(rgba):
    """Recover true colour from an image composited onto black."""
    a = rgba[:, :, 3:4] / 255.0
    out = np.where(a > 0.004, rgba[:, :, :3] / np.maximum(a, 0.004), 0.0)
    rgba[:, :, :3] = np.clip(out, 0, 255)
    return rgba


def content_bbox(rgba, thresh=8):
    ys, xs = np.where(rgba[:, :, 3] > thresh)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def downsample_alpha_aware(rgba, gw, gh):
    """Area-average onto a gw x gh grid, weighting colour by alpha."""
    a = rgba[:, :, 3]
    prem = rgba[:, :, :3] * (a[:, :, None] / 255.0)

    def box(ch):
        return np.array(Image.fromarray(ch.astype(np.float32), mode="F")
                        .resize((gw, gh), Image.Resampling.BOX))

    sa = box(a)
    srgb = np.stack([box(prem[:, :, i]) for i in range(3)], axis=2)
    with np.errstate(divide="ignore", invalid="ignore"):
        rgb = np.where(sa[:, :, None] > 0.5,
                       srgb / np.maximum(sa[:, :, None] / 255.0, 1e-6), 0.0)
    return np.clip(rgb, 0, 255), sa


def build_global_palette(samples, n_colors):
    strip = np.concatenate(samples, axis=0)
    strip = strip[strip[:, 3] > 200][:, :3]
    if len(strip) > 250000:
        idx = np.random.RandomState(0).choice(len(strip), 250000, replace=False)
        strip = strip[idx]
    im = Image.fromarray(strip.astype(np.uint8).reshape(1, -1, 3), mode="RGB")
    q = im.quantize(colors=n_colors, method=Image.Quantize.MEDIANCUT)
    return np.array(q.getpalette()[: n_colors * 3], dtype=np.uint8).reshape(-1, 3)


def make_pal_image(pal_rgb):
    flat = pal_rgb.reshape(-1).tolist() + [0] * (768 - pal_rgb.size)
    p = Image.new("P", (1, 1))
    p.putpalette(flat[:768])
    return p


def quantize_to(rgb_arr, mask, pal_img):
    im = Image.fromarray(np.clip(rgb_arr, 0, 255).astype(np.uint8), mode="RGB")
    out = np.array(im.quantize(palette=pal_img, dither=Image.Dither.NONE)
                   .convert("RGB")).astype(np.float32)
    out[~mask] = 0
    return out


def clean_alpha(sa, thresh=ALPHA_THRESHOLD):
    """Binary silhouette, drop specks, fill pinholes."""
    m = sa >= thresh
    try:
        from scipy import ndimage
        lab, n = ndimage.label(m)
        if n > 1:
            sizes = ndimage.sum(m, lab, range(1, n + 1))
            keep = np.zeros(n + 1, bool)
            keep[1:] = sizes >= 4
            m = keep[lab]
        filled = ndimage.binary_fill_holes(m)
        if filled.sum() - m.sum() <= max(2, m.size * 0.02):
            m = filled
    except Exception:
        pass
    return m


def debevel(rgb):
    """Flatten low-frequency bevel shading while keeping the texture."""
    out = rgb.copy()
    prof = out.mean(axis=2).mean(axis=1)
    lo, hi = max(1, int(len(prof) * 0.3)), max(2, int(len(prof) * 0.7))
    target = float(np.median(prof[lo:hi]))
    out *= np.clip(target / np.maximum(prof, 1e-6), 0.72, 1.35)[:, None, None]

    prof = out.mean(axis=2).mean(axis=0)
    lo, hi = max(1, int(len(prof) * 0.3)), max(2, int(len(prof) * 0.7))
    target = float(np.median(prof[lo:hi]))
    out *= np.clip(target / np.maximum(prof, 1e-6), 0.72, 1.35)[None, :, None]
    return np.clip(out, 0, 255)


def stitch_edges(rgb, sides):
    """Force opposite border pixels equal so a tiled floor shows no seam."""
    out = rgb.copy()
    if "h" in sides:
        avg = (out[:, 0, :] + out[:, -1, :]) * 0.5
        out[:, 0, :] = avg
        out[:, -1, :] = avg
    if "v" in sides:
        avg = (out[0, :, :] + out[-1, :, :]) * 0.5
        out[0, :, :] = avg
        out[-1, :, :] = avg
    if "bottom" in sides:
        out[-1, :, :] = out[-2, :, :]
    return out


def snap(v, lo=1):
    return max(lo, int(round(v)))


# ---------------------------------------------------------------- pipeline
def main():
    js = open(os.path.join(ROOT, "game.js"), encoding="utf-8").read()

    def scan(pattern, order):
        """order = 1-based group indices in (w, h, key) order."""
        out = {}
        for m in re.finditer(pattern, js):
            key = m.group(order[2])
            out.setdefault(key, (int(float(m.group(order[0]))), int(float(m.group(order[1])))))
        return out

    # w/h can appear before OR after `type:` in the object literals
    declared = scan(r"type:\s*'([a-z0-9_]+)',\s*w:\s*([\d.]+),\s*h:\s*([\d.]+)", (2, 3, 1))
    declared.update(scan(r"w:\s*([\d.]+),\s*h:\s*([\d.]+),\s*type:\s*'([a-z0-9_]+)'", (1, 2, 3)))

    # props.push({... type: 'x', w: .., h: ..}) — the real footprint on screen
    prop_box = {}
    for m in re.finditer(r"props\.push\(\{[^}]*?type:\s*'([a-z0-9_]+)'[^}]*?\}", js):
        blk = m.group(0)
        wm = re.search(r"w:\s*([\d.]+)", blk)
        hm = re.search(r"h:\s*([\d.]+)", blk)
        if wm and hm:
            prop_box[m.group(1)] = (int(float(wm.group(1))), int(float(hm.group(1))))

    # a few sprites are a banner / pole top rather than a ground-sitting object
    ANCHOR_OVERRIDE = {"flag_vn": "top", "trophy": "top", "medal": "top", "crown": "top"}

    # sprites used by triggers.push(...) — these are stand-on surfaces
    trigger_keys = set()
    for m in re.finditer(r"triggers\.push\(\{[^}]*?\}", js):
        tm = re.search(r"type:\s*'([a-z0-9_]+)'", m.group(0))
        if tm:
            trigger_keys.add(tm.group(1))

    # ---- pass 0: raw crops, so ONE scale per category can be derived
    raw, tallest = [], {}
    for cat in sorted(os.listdir(SRC)):
        d = os.path.join(SRC, cat)
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith(".png"):
                continue
            key = f[:-4]
            rgba = unpremultiply(load_rgba(os.path.join(d, f)))
            bb = content_bbox(rgba)
            if bb is None:
                print(f"  SKIP empty {cat}/{f}")
                continue
            x0, y0, x1, y1 = bb
            crop = rgba[y0:y1, x0:x1]
            ch, cw = crop.shape[:2]
            raw.append(dict(key=key, cat=cat, crop=crop, cw=cw, ch=ch, ar=cw / ch))
            if cat in CAT_TARGET_H:
                tallest[cat] = max(tallest.get(cat, 1), ch)

    scale = {c: CAT_TARGET_H[c] / tallest[c] for c in tallest}
    print("uniform scale per category (keeps relative sizes intact):")
    for c in sorted(scale):
        print(f"  {c:<10} tallest={tallest[c]:>4}px -> {CAT_TARGET_H[c]:>3}px  x{scale[c]:.3f}")
    print()

    # ---- pass 1: size every sprite on the logical grid
    jobs, samples = [], []
    for r in raw:
        cat, key, cw, ch, ar = r["cat"], r["key"], r["cw"], r["ch"], r["ar"]
        j = dict(key=key, cat=cat, heal=TILE_HEAL.get(key, ()), mode="contain")

        if cat == "tiles":
            if key in TILE_CONTAIN:
                gh = 40 // BLOCK
                gw = snap(gh * ar)
                j.update(gw=gw, gh=gh, tw=gw * BLOCK, th=gh * BLOCK, mode="contain")
            else:
                j.update(gw=20, gh=20, tw=40, th=40, mode="fill")
        elif key in trigger_keys or key in prop_box:
            # sized by its real on-screen footprint, whatever folder it lives in
            bw, bh = prop_box.get(key) or declared.get(key) or (cw, ch)
            s = min(bw / cw, bh / ch)
            gw, gh = snap(cw * s / BLOCK), snap(ch * s / BLOCK)
            if key in trigger_keys:
                anchor = "top"          # stand-on surface -> align to box top
            else:
                anchor = ANCHOR_OVERRIDE.get(key, "bottom")
            j.update(gw=gw, gh=gh, tw=bw, th=bh, mode="fit", anchor=anchor)
        else:
            s = scale.get(cat, CAT_TARGET_H.get(cat, 32) / max(ch, 1)) / BLOCK
            gw, gh = snap(cw * s), snap(ch * s)
            j.update(gw=gw, gh=gh, tw=gw * BLOCK, th=gh * BLOCK, mode="contain")

        rgb, sa = downsample_alpha_aware(r["crop"], j["gw"], j["gh"])
        mask = clean_alpha(sa)
        if cat == "tiles" and j["mode"] == "fill":
            if key in TILE_HEAL:
                rgb = debevel(rgb)
                rgb = stitch_edges(rgb, j["heal"])
            # blocks (brick, ?-block, crate...) keep their bevel on purpose
            mask = np.ones_like(mask, bool)

        stack = np.concatenate([rgb, np.where(mask, 255, 0)[:, :, None].astype(np.float32)], axis=2)
        samples.append(stack.reshape(-1, 4))
        j["rgb"], j["mask"] = rgb, mask
        jobs.append(j)

    pal = build_global_palette(samples, PALETTE_SIZE)
    pal_img = make_pal_image(pal)
    print(f"palette: {len(pal)} colours / {len(jobs)} sprites\n")

    # ---- pass 2: quantize + write
    meta = {}
    print(f"{'key':<26}{'grid':<10}{'out':<10}{'cols':>5}  mode")
    for j in jobs:
        rgb = quantize_to(j["rgb"], j["mask"], pal_img)
        sprite = np.zeros((j["gh"], j["gw"], 4), np.uint8)
        sprite[:, :, :3] = rgb.astype(np.uint8)
        sprite[:, :, 3] = np.where(j["mask"], 255, 0).astype(np.uint8)
        small = Image.fromarray(sprite, "RGBA")

        if j["mode"] == "fill":
            out = small.resize((j["tw"], j["th"]), Image.Resampling.NEAREST)
        else:
            body = small.resize((j["gw"] * BLOCK, j["gh"] * BLOCK), Image.Resampling.NEAREST)
            if body.size != (j["tw"], j["th"]):
                canvas = Image.new("RGBA", (j["tw"], j["th"]), (0, 0, 0, 0))
                ox = (j["tw"] - body.width) // 2
                if j.get("anchor") == "top":
                    oy = 0
                else:
                    oy = j["th"] - body.height
                canvas.paste(body, (ox, oy), body)
                out = canvas
            else:
                out = body

        outdir = os.path.join(DST, j["cat"])
        os.makedirs(outdir, exist_ok=True)
        out.save(os.path.join(outdir, j["key"] + ".png"), optimize=True)
        out.save(os.path.join(DST, j["key"] + ".png"), optimize=True)

        arr = np.array(out)
        vis = arr[arr[:, :, 3] > 0]
        used = len(np.unique(vis[:, :3], axis=0)) if len(vis) else 0
        meta[j["key"]] = dict(category=j["cat"], w=out.width, h=out.height,
                              gw=j["gw"], gh=j["gh"], colors=int(used))
        print(f"{j['key']:<26}{f'{j[chr(103)+chr(119)]}x{j[chr(103)+chr(104)]}':<10}"
              f"{f'{out.width}x{out.height}':<10}{used:>5}  {j['mode']}")

    with open(os.path.join(DST, "atlas_v2.json"), "w", encoding="utf-8") as fh:
        json.dump({"block": BLOCK, "palette_size": len(pal),
                   "palette": ["#%02X%02X%02X" % tuple(c) for c in pal],
                   "scale": {k: round(v, 4) for k, v in scale.items()},
                   "sprites": meta}, fh, indent=2)
    print(f"\nwrote {len(meta)} sprites + atlas_v2.json")


if __name__ == "__main__":
    main()
