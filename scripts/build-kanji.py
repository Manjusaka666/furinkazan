#!/usr/bin/env python3
"""Build src/data/kanji.json: the 2,136 jōyō kanji with stroke paths (KanjiVG), readings and meanings (KANJIDIC2).

Usage: python3 -I scripts/build-kanji.py KANJIVG_MAIN.xml.gz KANJIDIC2.json  (needs opencc-python-reimplemented)
"""
import gzip, json, pathlib, re, sys
import opencc

ROOT = pathlib.Path(__file__).resolve().parent.parent
T2S = opencc.OpenCC("t2s")
# OpenCC's table maps traditional to shinjitai (氣→気); reversed, it takes a Japanese form back so t2s can simplify it.
JP2T = {}
for line in (pathlib.Path(opencc.__file__).parent / "dictionary/JPVariants.txt").read_text(encoding="utf8").splitlines():
    t, jp = line.split("\t")
    for j in jp.split():
        JP2T.setdefault(j, t)

xml = gzip.open(sys.argv[1], "rt", encoding="utf8").read()
paths = {}
for m in re.finditer(r'<kanji id="kvg:kanji_([0-9a-f]+)">(.*?)</kanji>', xml, re.S):
    paths[chr(int(m.group(1), 16))] = re.findall(r'<path [^>]*?\bd="([^"]+)"', m.group(2))

out = []
for c in json.load(open(sys.argv[2], encoding="utf8"))["characters"]:
    grade = c["misc"].get("grade")
    if grade is None or grade > 8:  # 1-6 are taught in primary school, 8 is the rest of the jōyō list
        continue
    ch = c["literal"]
    rm = c["readingMeaning"]["groups"][0] if c["readingMeaning"] and c["readingMeaning"]["groups"] else {"readings": [], "meanings": []}
    r = rm["readings"]
    simp = T2S.convert(JP2T.get(ch, ch))
    out.append({
        "c": ch, "g": grade, "n": c["misc"]["strokeCounts"][0], "jlpt": c["misc"].get("jlptLevel"), "f": c["misc"].get("frequency"),
        "on": [x["value"] for x in r if x["type"] == "ja_on"],
        "kun": [x["value"] for x in r if x["type"] == "ja_kun"],
        "en": [x["value"] for x in rm["meanings"] if x["lang"] == "en"][:4],
        **({"s": simp} if simp != ch else {}),
        "d": paths.get(ch, []),
    })
out.sort(key=lambda k: (k["g"], k["f"] or 9999))
(ROOT / "src/data/kanji.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
print("kanji", len(out), "without strokes", [k["c"] for k in out if not k["d"]][:20], "size", (ROOT / "src/data/kanji.json").stat().st_size)
