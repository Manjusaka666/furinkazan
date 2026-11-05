#!/usr/bin/env python3
"""Fill public/audio/ and src/data/audio-*.json. Re-runnable: finished files are kept.

Usage: python3 -I scripts/build-audio.py DOWNLOADS [--sentences]   (needs ffmpeg and git; VOICEVOX engine on :50021)
Only sounds the site uses are stored, in order of preference:
  h/  Kanji alive recordings by native speakers (CC BY 4.0), exact word + reading matches only
  t/  Tatoeba recordings by declared native speakers with an explicit licence
  v/  VOICEVOX:No.7, generated here ahead of time. It is synthetic, and the site labels it so.
A generated word is kept only when the engine's moras match the reading we teach; otherwise the reading is spoken instead.
"""
import csv, hashlib, io, json, pathlib, re, shutil, subprocess, sys, tempfile, time, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
D = pathlib.Path(sys.argv[1])
OUT = ROOT / "public/audio"
ENGINE = "http://127.0.0.1:50021"
SPEAKER = 30  # No.7 アナウンス
UA = {"User-Agent": "Mozilla/5.0 (compatible; furinkazan-study-site/1.0; non-commercial learning site)"}
KATA = {chr(c): chr(c - 0x60) for c in range(0x30A1, 0x30F7)}
ALIAS = {"dzu": "づ", "jya": "じゃ", "jyu": "じゅ", "jyo": "じょ", "wo": "を"}  # Tae Kim's file names on the grammar pages
VOWEL = {**{k: "ア" for k in "アカガサザタダナハバパマヤャラワァ"}, **{k: "イ" for k in "イキギシジチヂニヒビピミリィ"}, **{k: "ウ" for k in "ウクグスズツヅヌフブプムユュルゥヴ"},
         **{k: "エ" for k in "エケゲセゼテデネヘベペメレェ"}, **{k: "オ" for k in "オコゴソゾトドノホボポモヨョロヲォ"}}


def hira(s):
    return "".join(KATA.get(c, c) for c in s)


def kata(s):
    return "".join(chr(ord(c) + 0x60) if "ぁ" <= c <= "ゖ" else c for c in s)


def plain(ja):
    return re.sub(r"\{[^}]*\}", "", ja)


def reading(ja):
    return re.sub(r"[㐀-鿿豈-﫿々〆ヶ〇]+\{([^}]*)\}", r"\1", ja)


def sound(s, loose=False):
    """Katakana reduced to what is heard: ー and うo/いe long vowels collapse; loosely, particles は/へ/を too."""
    out = []
    for c in kata(s):
        if not ("ァ" <= c <= "ヺ" or c == "ー"):
            continue
        v = VOWEL.get(out[-1]) if out else None
        if c == "ー" or (c == "ウ" and v == "オ") or (c == "イ" and v == "エ") or (v == c):
            if v:
                c = v
        out.append(c)
    t = "".join(out).replace("ヲ", "オ").replace("ヂ", "ジ").replace("ヅ", "ズ")
    if loose:
        t = t.replace("ハ", "ワ").replace("ヘ", "エ")
    # Repeated vowels count once, so トウキョウ and トーキョー compare equal.
    return re.sub(r"(.)\1+", r"\1", t.replace("オオ", "オ"))


def post(path, body=None):
    req = urllib.request.Request(f"{ENGINE}{path}", data=body or b"", headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as r:
        return r.read()


def query(text):
    return json.loads(post(f"/audio_query?speaker={SPEAKER}&text={urllib.parse.quote(text)}"))


def moras(q):
    return "".join(m["text"] for p in q["accent_phrases"] for m in p["moras"])


def render(q, out):
    q.update(speedScale=0.95, prePhonemeLength=0.05, postPhonemeLength=0.15)
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        f.write(post(f"/synthesis?speaker={SPEAKER}", json.dumps(q).encode()))
        f.flush()
        out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f.name, "-ac", "1", "-c:a", "aac", "-b:a", "40k", "-f", "adts", str(out)], check=True)


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


def save():
    (ROOT / "src/data/audio-words.json").write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    (ROOT / "src/data/audio-sentences.json").write_text(json.dumps(said, ensure_ascii=False, separators=(",", ":")), encoding="utf8")


save()

# 3. Kana, under the romaji names the pages ask for.
table = json.loads(subprocess.run(["node", "-e", "import('./src/lib/kana.js').then(k=>console.log(JSON.stringify([...k.GOJUON.flatMap(r=>r.cells),...k.DAKUON.flatMap(r=>r.cells),...k.YOON].filter(Boolean).map(c=>[c[0],c[1]]))))"], cwd=ROOT, capture_output=True, check=True).stdout)
for roma, kana in [*table, *ALIAS.items()]:
    out = OUT / f"kana/{roma}.aac"
    if not out.exists():
        render(query(kana), out)

# 4. VOICEVOX for words with no recording.
fixed = 0
for i, (w, read) in enumerate(words):
    key = f"{w}|{read}"
    if key in manifest:
        continue
    rel = f"v/{name(key)}.aac"
    if not (OUT / rel).exists():
        q = query(w)
        if sound(moras(q)) != sound(read):  # the engine read the kanji differently: speak what we teach
            fixed += 1
            print("reading", w, moras(q), read, flush=True)
            q = query(read)
        render(q, OUT / rel)
    manifest[key] = rel
    if i % 200 == 0:
        save()
        print(i, flush=True)
save()
print("voicevox words", sum(v.startswith("v/") for v in manifest.values()), "spoken from kana", fixed, flush=True)

# 5. Optional: VOICEVOX for N5/N4 sentences with no recording. A sentence the engine misreads is left out, not guessed at.
if "--sentences" in sys.argv:
    bad = 0
    for sid, (e, lv) in sents.items():
        if sid in said or lv not in ("n5", "n4"):
            continue
        rel = f"v/s{sid}.aac"
        if not (OUT / rel).exists():
            q = query(plain(e["ja"]))
            if sound(moras(q), True) != sound(reading(e["ja"]), True):
                bad += 1
                print("sentence", sid, plain(e["ja"]), moras(q), flush=True)
                continue
            render(q, OUT / rel)
        said[sid] = [rel, "VOICEVOX:No.7", ""]
    save()
    print("voicevox sentences", sum(v[0].startswith("v/") for v in said.values()), "left out", bad, flush=True)
