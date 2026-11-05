#!/usr/bin/env python3
"""Build public/data/strokes.json from KanjiVG (CC BY-SA 3.0): kana -> ordered SVG paths in a 109x109 box."""
import json, re, urllib.request, concurrent.futures as cf, pathlib
BASE = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/0{:04x}.svg"
HIRA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"
KATA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン"
def fetch(ch):
    svg = urllib.request.urlopen(BASE.format(ord(ch)), timeout=30).read().decode()
    paths = re.findall(r'<path[^>]*\sd="([^"]+)"', svg)
    assert paths, ch
    return ch, paths
with cf.ThreadPoolExecutor(12) as ex:
    data = dict(ex.map(fetch, HIRA + KATA))
assert len(data) == len(HIRA + KATA)
out = pathlib.Path(__file__).parent.parent / "public/data/strokes.json"
out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
print(len(data), "kana", out.stat().st_size, "bytes")
