#!/usr/bin/env python3
"""Fill public/audio/ and src/data/audio-*.json. Re-runnable: finished files are kept.

Usage: python3 -I scripts/build-audio.py DOWNLOADS   (needs git)
Only human recordings by native speakers, and only those the site uses:
  h/  Kanji alive words (CC BY 4.0), exact word + reading matches only
  t/  Tatoeba sentences by declared native speakers with an explicit licence
Anything else gets no audio: the site has no synthetic voice.
"""
import csv, hashlib, io, json, pathlib, re, shutil, subprocess, sys, time, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
D = pathlib.Path(sys.argv[1])
OUT = ROOT / "public/audio"
UA = {"User-Agent": "Mozilla/5.0 (compatible; furinkazan-study-site/1.0; non-commercial learning site)"}
KATA = {chr(c): chr(c - 0x60) for c in range(0x30A1, 0x30F7)}


def hira(s):
    return "".join(KATA.get(c, c) for c in s)


def reading(ja):
    return re.sub(r"[㐀-鿿豈-﫿々〆ヶ〇]+\{([^}]*)\}", r"\1", ja)


def name(key):
    return hashlib.sha1(key.encode()).hexdigest()[:12]


course = {lv: json.load(open(ROOT / f"src/data/course/{lv}.json", encoding="utf8")) for lv in "n5 n4 n3 n2 n1".split()}
topics = json.load(open(ROOT / "src/data/course/topics.json", encoding="utf8"))
words = {}
for w in [x for l in course.values() for x in l] + [x for l in topics.values() for x in l]:
    words[(w["w"], reading(w["ja"]))] = w

# 1. Kanji alive: {kname}_06_{a..l}.aac lines up with the examples column of ka_data.csv.
rows = subprocess.run(["git", "-C", str(D / "kam"), "show", "HEAD:language-data/ka_data.csv"], capture_output=True, check=True).stdout.decode("utf8")
human = {}
for r in csv.DictReader(io.StringIO(rows)):
    for i, ex in enumerate(json.loads(r["examples"] or "[]")):
        m = re.fullmatch(r"(.+?)（(.+?)）", ex[0].strip())
        if m:
            for read in re.split(r"[、,]", m.group(2)):
                human.setdefault((m.group(1), hira(read.strip())), D / "kaa/a/audio-aac" / f'{r["kname"]}_06_{chr(97 + i)}.aac')
manifest = {}
for (w, read), _ in words.items():
    src = human.get((w, hira(read)))
    if src and src.exists():
        rel = f"h/{name(w + '|' + read)}.aac"
        (OUT / "h").mkdir(parents=True, exist_ok=True)
        if not (OUT / rel).exists():
            shutil.copyfile(src, OUT / rel)
        manifest[f"{w}|{read}"] = rel
print("kanji alive", len(manifest), "of", len(words), flush=True)

# 2. Tatoeba recordings for sentences the site shows.
native = set()
with open(D / "tatoeba/user_languages.csv", encoding="utf8") as f:
    for line in f:
        p = line.rstrip("\n").split("\t")
        if p[0] == "jpn" and p[1] == "5":
            native.add(p[2])
voiced = {sid: v for sid, v in json.load(open(D / "tt/jpn_audio.json", encoding="utf8")).items() if v[2] and v[1] in native}
sents = {str(e["id"]): (e, lv) for lv, l in course.items() for w in l for e in w["ex"]}
sents.update({str(e["id"]): (e, "topic") for l in topics.values() for w in l for e in w["ex"]})
said = {}
for sid in sents.keys() & voiced.keys():
    audio, by, lic = voiced[sid][:3]
    rel = f"t/{audio}.mp3"
    if not (OUT / rel).exists():
        (OUT / "t").mkdir(parents=True, exist_ok=True)
        time.sleep(0.5)
        try:
            with urllib.request.urlopen(urllib.request.Request(f"https://tatoeba.org/audio/download/{audio}", headers=UA)) as r:
                (OUT / rel).write_bytes(r.read())
        except OSError as e:
            print("skip", sid, e, flush=True)
            continue
    said[sid] = [rel, by, lic]
print("tatoeba sentences", len(said), "of", len(sents), flush=True)

(ROOT / "src/data/audio-words.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
(ROOT / "src/data/audio-sentences.json").write_text(json.dumps(said, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
