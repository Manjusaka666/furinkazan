#!/usr/bin/env python3
"""Build src/data/library/*.json from Aozora Bunko, per scripts/library.json. Add a work there and re-run.

Usage: python3 -I scripts/fetch-library.py CACHE_DIR
Aozora marks works public domain under Japanese law. We also require the author to have died by CUTOFF, so the
text is free under life+70 terms too (Switzerland, the EU), where this site's reader lives.
"""
import csv, io, json, pathlib, re, sys, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = pathlib.Path(sys.argv[1])
OUT = ROOT / "src/data/library"
CUTOFF = 1955
MAX_CHARS = 130_000  # beyond this a single static page is too heavy; link out instead
CATALOG_URL = "https://www.aozora.gr.jp/index_pages/list_person_all_extended_utf8.zip"

GAIJI_JIS = re.compile(r"(?:第[34]水準)?(\d)-(\d{1,2})-(\d{1,2})")


def gaiji(note):
    """※［＃…］ names a character outside Shift_JIS by Unicode or JIS X 0213 position."""
    m = re.search(r"U\+([0-9A-Fa-f]{4,6})", note)
    if m:
        return chr(int(m.group(1), 16))
    m = GAIJI_JIS.search(note)
    if m:
        plane, row, cell = map(int, m.groups())
        raw = bytes([0xA0 + row, 0xA0 + cell]) if plane == 1 else bytes([0x8F, 0xA0 + row, 0xA0 + cell])
        try:
            return raw.decode("euc_jis_2004")
        except UnicodeDecodeError:
            pass
    return "〓"


def body_of(text):
    text = text.replace("\r\n", "\n")
    # Header ends at the second rule of dashes; footer starts at 底本：
    parts = re.split(r"\n-{20,}\n", text, maxsplit=2)
    body = parts[2] if len(parts) == 3 else text
    body = re.split(r"\n底本[：:]", body)[0]
    body = re.sub(r"※［＃([^］]*)］", lambda m: gaiji(m.group(1)), body)
    body = re.sub(r"［＃[^］]*］", "", body)
    body = re.sub(r"〔[^〕]*〕", lambda m: m.group(0), body)
    # ｜base《ruby》 and kanji-run《ruby》 become the site's base{ruby}; ruby on kana bases is dropped, ruby.js only marks kanji.
    def rb(m):
        base, read = m.group(1) or m.group(2), m.group(3)
        return f"{base}{{{read}}}" if re.fullmatch(r"[㐀-鿿豈-﫿々〆ヶ〇]+", base) else base
    body = re.sub(r"(?:｜([^《\n]+)|([㐀-鿿豈-﫿々〆ヶ〇]+))《([^》\n]+)》", rb, body)
    body = re.sub(r"《[^》\n]*》", "", body)
    body = body.replace("｜", "")
    return [p.strip("　 ") for p in body.split("\n") if p.strip("　 ")]


def fetch(url, name):
    path = CACHE / name
    if not path.exists():
        with urllib.request.urlopen(url) as r:
            path.write_bytes(r.read())
    return path


CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(fetch(CATALOG_URL, "catalog.zip")) as z:
    rows = list(csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode("utf-8-sig"))))
by_id = {}
for r in rows:
    by_id.setdefault(r["作品ID"], []).append(r)

manifest = json.loads((ROOT / "scripts/library.json").read_text(encoding="utf8"))
index, skipped = [], []
for w in manifest:
    entries = by_id.get(w["id"])
    assert entries, f'{w["slug"]}: id {w["id"]} not in catalog'
    r = entries[0]
    assert r["作品著作権フラグ"] == "なし", w["slug"]
    people = [(e["姓"] + e["名"], e["役割フラグ"], e["没年月日"][:4]) for e in entries]
    for name, _, died in people:
        assert died and int(died) <= CUTOFF, f'{w["slug"]}: {name} died {died}, still in copyright under life+70'
    url = r["テキストファイルURL"]
    assert url.endswith(".zip"), w["slug"]
    with zipfile.ZipFile(fetch(url, f'{w["id"]}.zip')) as z:
        txt = next(n for n in z.namelist() if n.lower().endswith(".txt"))
        raw = z.read(txt).decode("shift_jis_2004", errors="replace")
    paras = body_of(raw)
    chars = sum(len(re.sub(r"\{[^}]*\}", "", p)) for p in paras)
    if chars > MAX_CHARS:
        skipped.append((w["slug"], chars))
        continue
    assert chars > 200, f'{w["slug"]}: parsed only {chars} chars'
    author = next(n for n, role, _ in people if role == "著者")
    translator = next((n for n, role, _ in people if role == "翻訳者"), None)
    meta = {
        "slug": w["slug"], "lv": w["lv"], "cat": w["cat"], "zh": w["zh"], "chars": chars,
        "title": r["作品名"], "subtitle": r["副題"], "kana": r["文字遣い種別"], "author": author, "translator": translator,
        "card": r["図書カードURL"], "base": f'{r["底本名1"]}（{r["底本出版社名1"]}）',
        "input": r["入力者"], "proof": r["校正者"],
    }
    (OUT / f'{w["slug"]}.json').write_text(json.dumps({**meta, "paras": paras}, ensure_ascii=False), encoding="utf8")
    index.append(meta)
    bad = sum(p.count("〓") for p in paras)
    print(f'{w["slug"]:22} {w["lv"]} {chars:7} chars {len(paras):5} paras  {r["作品名"]} / {author}{"  gaiji-missing:" + str(bad) if bad else ""}')
(OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf8")
print("works", len(index), "total chars", sum(m["chars"] for m in index), "skipped (too long)", skipped)
