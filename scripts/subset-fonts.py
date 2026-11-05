#!/usr/bin/env python3
"""Subset the self-hosted fonts to glyphs the built site actually uses.

Usage: subset-fonts.py [SRC_DIR] (needs fonttools and brotli)
Run once before the first build (kana only), then build, run again, build again.
"""
import pathlib, re, subprocess, sys, urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "src/assets/fonts"
SRC = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / ".font-src"
BASE = "https://raw.githubusercontent.com/google/fonts/main/ofl"
FONTS = {
    "ShipporiMincho-Regular.ttf": f"{BASE}/shipporimincho/ShipporiMincho-Regular.ttf",
    "YujiSyuku-Regular.ttf": f"{BASE}/yujisyuku/YujiSyuku-Regular.ttf",
}
KANA = "".join(map(chr, [*range(0x3000, 0x3040), *range(0x3041, 0x3097), *range(0x3099, 0x30A0), *range(0x30A1, 0x3100)]))
CORE = "風林火山疾如徐侵掠不動"  # must match the unicode-range in global.css
LATIN = "U+20-7E,U+A0-FF,U+100-17F,U+2010-2027"


class Collector(HTMLParser):
    """Text under lang="ja" goes to `ja`; text under class~="brush" also goes to `brush`."""

    VOID = {"meta", "link", "img", "br", "hr", "input", "source", "path"}

    def __init__(self):
        super().__init__()
        self.stack, self.ja, self.brush = [], set(), set()

    def handle_starttag(self, tag, attrs):
        if tag in self.VOID:
            return
        a = dict(attrs)
        top = self.stack[-1] if self.stack else (False, False)
        lang = a.get("lang")
        is_ja = lang == "ja" or (top[0] and not lang)
        is_brush = "brush" in (a.get("class") or "").split() or top[1]
        self.stack.append((is_ja, is_brush))

    def handle_endtag(self, tag):
        if tag not in self.VOID and self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if self.stack and self.stack[-1][0]:
            self.ja.update(data)
        if self.stack and self.stack[-1][1]:
            self.brush.update(data)


def subset(src, out, text=None, unicodes=None):
    args = [sys.executable, "-m", "fontTools.subset", str(src), f"--output-file={out}",
            "--flavor=woff2", "--layout-features=*", "--no-hinting", "--name-IDs=*"]  # name table keeps the OFL notice
    args += [f"--unicodes={unicodes}"] if unicodes else [f"--text={text}"]
    subprocess.run(args, check=True)
    print(f"{out.name}: {out.stat().st_size / 1024:.1f} KB")


SRC.mkdir(exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
for name, url in FONTS.items():
    if not (SRC / name).exists():
        urllib.request.urlretrieve(url, SRC / name)

col = Collector()
dist = ROOT / "dist"
if dist.exists():
    for page in dist.rglob("*.html"):
        # These pages hold thousands of rare kanji and use the system font (.sys-ja) so the webfont stays small.
        if page.relative_to(dist).parts[0] in ("words", "kanji", "grammar", "scenes", "anime", "library", "review"):
            continue
        col.feed(page.read_text(encoding="utf8"))
        col.stack.clear()
# Characters only client scripts render: solar terms, source kanji, review cards.
for js in [ROOT / "src/data/eras.js", ROOT / "src/lib/kana.js"]:
    col.ja.update(js.read_text(encoding="utf8"))
for path in (ROOT / "src/data/lessons").glob("*.js"):
    col.ja.update(path.read_text(encoding="utf8"))
kanji = "".join(sorted(c for c in col.ja if re.match(r"[㐀-鿿豈-﫿]", c)))
brush = "".join(sorted(c for c in col.brush if not c.isspace())) or "風林火山"

mincho, yuji = SRC / "ShipporiMincho-Regular.ttf", SRC / "YujiSyuku-Regular.ttf"
subset(mincho, OUT / "latin.woff2", unicodes=LATIN)
subset(mincho, OUT / "kana.woff2", text=KANA)
subset(mincho, OUT / "kanji.woff2", text=kanji or "日本語")
subset(yuji, OUT / "brush-core.woff2", text=CORE)
subset(yuji, OUT / "brush.woff2", text="".join(c for c in brush if c not in CORE) or "和")
print(f"kanji {len(kanji)}, brush {len(brush)}")
