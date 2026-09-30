"""Turn a logo drawn on a black background into transparent PNGs.

Usage:
  python logo_layers.py SOURCE OUT_DIR [--size 256] [--split]

Writes OUT_DIR/logo-mark.png (whole logo, transparent). With --split, also finds the empty gap
between an outer ring and the centre mark from the radial brightness profile, and writes
logo-ring.png and logo-centre.png, which stack back into logo-mark.png exactly.

Alpha comes from brightness (max channel), and colour is un-premultiplied against black, so
anti-aliased edges blend cleanly on any background. Needs Pillow and NumPy.
"""
import argparse
import os

import numpy as np
from PIL import Image


def load(path):
    src = np.asarray(Image.open(path).convert('RGB')).astype(np.float32) / 255
    mx = src.max(axis=2)
    alpha = np.clip((mx - 0.02) / 0.98, 0, 1)  # drop near-black noise
    rgb = np.where(alpha[..., None] > 0, src / np.maximum(mx[..., None], 1e-6), 0)
    return rgb, alpha, mx


def save(rgb, alpha, mask, size, path):
    out = np.dstack([rgb, alpha * mask]) * 255
    img = Image.fromarray(out.round().astype(np.uint8), 'RGBA')
    img.resize((size, size), Image.LANCZOS).save(path, optimize=True)
    print('wrote', path)


def find_gap(mx):
    """Middle of the widest empty band of the radial profile between 30% and 90% of the radius."""
    h, w = mx.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot(xx - (w - 1) / 2, yy - (h - 1) / 2) / (min(h, w) / 2)
    edges = np.arange(0.30, 1.00, 0.01)
    empty = [mx[(r >= e) & (r < e + 0.01)].mean() < 0.01 for e in edges]
    inked = [i for i, e in enumerate(empty) if not e]
    if not inked:
        raise SystemExit('No ink found in the logo.')
    first_ink, last_ink = inked[0], inked[-1]
    # Only a gap with ink on both sides separates a ring from a centre mark; the empty margin
    # outside the ring is usually wider and must not win.
    best, run_start, best_len = None, None, 0
    for i, is_empty in enumerate(empty + [False]):
        if is_empty and run_start is None:
            run_start = i
        elif not is_empty and run_start is not None:
            if run_start > first_ink and i <= last_ink and i - run_start > best_len:
                best_len, best = i - run_start, (edges[run_start] + edges[i - 1] + 0.01) / 2
            run_start = None
    if best is None:
        raise SystemExit('No empty ring gap found; cannot split this logo.')
    return best, r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source')
    ap.add_argument('out_dir')
    ap.add_argument('--size', type=int, default=256)
    ap.add_argument('--split', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.out_dir, exist_ok=True)
    rgb, alpha, mx = load(a.source)
    save(rgb, alpha, 1.0, a.size, os.path.join(a.out_dir, 'logo-mark.png'))
    if a.split:
        gap, r = find_gap(mx)
        print(f'split at {gap:.2f} of the radius')
        save(rgb, alpha, r >= gap, a.size, os.path.join(a.out_dir, 'logo-ring.png'))
        save(rgb, alpha, r < gap, a.size, os.path.join(a.out_dir, 'logo-centre.png'))


if __name__ == '__main__':
    main()
