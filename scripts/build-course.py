#!/usr/bin/env python3
"""Build src/data/course/*.json: JLPT word units with native-speaker example sentences.

Usage: python3 -I scripts/build-course.py DATA_DIR
DATA_DIR holds: tatoeba/{jpn_sentences_detailed.tsv,cmn_sentences.tsv,jpn-cmn_links.tsv,transcriptions.csv,user_languages.csv},
jlpt/n{1..5}_vocab_cleaned.csv, thes/final.json, kaikki/zh.jsonl, jmd/jmdict-eng-*.json.
Every source is open licensed; see src/pages/sources.astro. Sentences are only taken from authors who declare
themselves native Japanese speakers on Tatoeba.
"""
import collections, csv, glob, json, pathlib, re, sys
from opencc import OpenCC  # opencc-python-reimplemented; Tatoeba's Chinese mixes traditional and simplified

T2S = OpenCC("t2s")

ROOT = pathlib.Path(__file__).resolve().parent.parent
D = pathlib.Path(sys.argv[1])
OUT = ROOT / "src/data/course"
OUT.mkdir(parents=True, exist_ok=True)
LEVELS = ["n5", "n4", "n3", "n2", "n1"]
CAP = {"n5": 26, "n4": 30, "n3": 40, "n2": 60, "n1": 70}
KANJI = r"㐀-鿿豈-﫿々〆ヶ"
# Tatoeba is open to anyone: keep vulgar and violent sentences out of a learning site.
DENY = re.compile(r"セックス|エッチ|レイプ|強姦|売春|おっぱい|ちんこ|まんこ|自殺|殺|死ね|クソ|くそ|糞|ファック|ヤる|童貞|処女|マリファナ|麻薬|ヒトラー|ナチ|奴隷|裸|ペニス|膣|精子|勃起|変態|ブス|馬鹿|バカ|アホ|戦争犯罪|テロ|爆弾")


def hira(s):
    return "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s)


def align(word, read):
    """食べる + たべる -> 食{た}べる. Falls back to the bare word when kana cannot be lined up."""
    if not re.search(f"[{KANJI}]", word):
        return word
    parts = re.findall(f"[{KANJI}]+|[^{KANJI}]+", word)
    pat = "".join("(.+?)" if re.match(f"[{KANJI}]", p) else re.escape(hira(p)) for p in parts)
    m = re.fullmatch(pat, hira(read))
    if not m:
        return word
    groups, out = iter(m.groups()), []
    for p in parts:
        out.append(f"{p}{{{next(groups)}}}" if re.match(f"[{KANJI}]", p) else p)
    return "".join(out)


def furi(tr):
    """Tatoeba's [食|た]べる notation -> the site's 食{た}べる; kana-only reading text for matching."""
    def rb(m):
        base, read = m.group(1), "".join(m.group(2).split("|"))
        return f"{base}{{{read}}}" if re.fullmatch(f"[{KANJI}]+", base) else base
    return re.sub(r"\[([^|\]]+)\|([^\]]+)\]", rb, tr), re.sub(r"\[[^|\]]+\|([^\]]+)\]", lambda m: m.group(1).replace("|", ""), tr)


# ---- sentences
native = set()
for line in open(D / "tatoeba/user_languages.csv", encoding="utf8"):
    p = line.rstrip("\n").split("\t")
    if len(p) >= 3 and p[0] == "jpn" and p[1] == "5":
        native.add(p[2])
cmn = {}
for line in open(D / "tatoeba/cmn_sentences.tsv", encoding="utf8"):
    p = line.rstrip("\n").split("\t")
    if len(p) >= 3:
        cmn[p[0]] = T2S.convert(p[2])
links = collections.defaultdict(list)
for line in open(D / "tatoeba/jpn-cmn_links.tsv", encoding="utf8"):
    a, b = line.split()
    if b in cmn:
        links[a].append(b)
trans = {}
for line in open(D / "tatoeba/transcriptions.csv", encoding="utf8"):
    p = line.rstrip("\n").split("\t")
    if len(p) >= 5 and p[1] == "jpn":
        trans[p[0]] = p[4]

sents = []
for line in open(D / "tatoeba/jpn_sentences_detailed.tsv", encoding="utf8"):
    p = line.rstrip("\n").split("\t")
    sid, ja, by = p[0], p[2], p[3]
    if by not in native or sid not in trans or not (4 <= len(ja) <= 70) or DENY.search(ja):
        continue
    f, kana = furi(trans[sid])
    if "[" in f or "|" in f:
        continue
    zh = cmn[links[sid][0]] if links.get(sid) else None
    sents.append({"id": int(sid), "ja": ja, "f": f, "kana": hira(kana), "zh": zh, "by": by})
# Only recordings with an explicit licence by a declared native speaker (Tatoeba leaves many without one).
voiced = {sid: v for sid, v in json.load(open(D / "tt/jpn_audio.json", encoding="utf8")).items() if v[2] and v[1] in native}
sents.sort(key=lambda s: (s["zh"] is None, len(s["ja"])))
print("native sentences", len(sents), "with zh", sum(1 for s in sents if s["zh"]))
by_char = collections.defaultdict(list)
for i, s in enumerate(sents):
    for c in set(s["ja"]):
        by_char[c].append(i)


def example(s):
    e = {"ja": s["f"], "id": s["id"], "by": s["by"]}
    if s["zh"]:
        e["zh"] = s["zh"]
    return e


def find(word, read):
    """Indices of sentences using the word (stem-matched so conjugations count) with the same reading."""
    conj = len(word) > 1 and re.search(r"[うくぐすつぬぶむるい]$", word) and (re.search(f"[{KANJI}]", word) or len(word) >= 4)
    stem = word[:-1] if conj else word
    rstem = hira(read)[:-1] if conj else hira(read)
    if len(stem) < 1 or (not re.search(f"[{KANJI}]", stem) and len(stem) < 3):
        return []
    # A kanji stem must stand alone: 本 is not in 本物, 絶つ is not in 絶対.
    rx = re.compile(f"(?<![{KANJI}]){re.escape(stem)}(?![{KANJI}])") if re.search(f"[{KANJI}]", stem) else None
    chars = sorted(set(stem), key=lambda c: len(by_char.get(c, ())))
    return [i for i in by_char.get(chars[0], ()) if rstem in sents[i]["kana"] and (rx.search(sents[i]["ja"]) if rx else stem in sents[i]["ja"])]


# ---- glosses: open Japanese-Chinese wordlist, then Chinese Wiktionary, then JMdict (English, flagged)
thes = json.load(open(D / "thes/final.json", encoding="utf8"))
OWN = json.loads((ROOT / "scripts/zh-glosses.json").read_text(encoding="utf8"))  # written by hand for common words the open lists miss
READ = re.compile(r"^[（(]([^）)]*)[）)]\s*[⓪①-⑨\d]?")
TAG = re.compile(r"【[^】]*】|^\s*(名词|代词|副词|连体词|感叹词|接续词|动[123]|自动[123]?|他动[123]?|形容词|形容动词|イ形|ナ形)\s*")


def thes_gloss(word, read):
    raw = thes.get(word)
    if raw is None:
        return None
    m = READ.match(raw)
    if m:
        got = re.sub(r"[\d⓪①-⑨\s]", "", m.group(1))
        # The source mixes up homographs (悪日 glossed as 欠伸): a differing reading means it is another word.
        if got and re.fullmatch(r"[ぁ-んァ-ヶー]+", got) and hira(got) != hira(read):
            return None
        raw = raw[m.end():]
    raw = TAG.sub("", raw).strip()
    raw = TAG.sub("", raw).strip()
    return raw[:48] or None


wikt = {}
for line in open(D / "kaikki/zh.jsonl", encoding="utf8"):
    d = json.loads(line)
    for s in d.get("senses", []):
        for g in s.get("glosses", []):
            g = g.strip()
            if g and "\n" not in g and "【" not in g and len(g) <= 30 and not re.search(r"日语|假名|罗马字|的(变位|汉字|平假名)", g):
                wikt.setdefault(d["word"], g)
                break
jm, dated, fresh = {}, set(), set()
jmfile = glob.glob(str(D / "jmd/jmdict-eng-*.json"))[0]
OLD = {"arch", "obs", "dated", "rare", "obsc", "ok", "oK"}
for e in json.load(open(jmfile, encoding="utf8"))["words"]:
    gloss = "; ".join(g["text"] for g in e["sense"][0]["gloss"][:3])
    kanas = [k["text"] for k in e["kana"]]
    alive = any(not (set(s.get("misc", [])) & OLD) for s in e["sense"])
    for k in e["kanji"]:
        for r in kanas:
            jm.setdefault((k["text"], hira(r)), gloss)
            (fresh if alive else dated).add((k["text"], hira(r)))
    for r in kanas:
        jm.setdefault((r, hira(r)), gloss)
        (fresh if alive else dated).add((r, hira(r)))
dated -= fresh  # kept only if no entry for this spelling has a living sense
print("JMdict marks all senses archaic/obsolete/dated/rare:", len(dated))
by_read = collections.defaultdict(set)
for k, r in jm:
    by_read[r].add(k)


def checked(word, read):
    """The lists truncate spellings (素晴らし for 素晴らしい) and mispair others (愛憎 あいにく): only pairs JMdict knows get through."""
    word = {"田ぼ": "田んぼ", "真中": "真ん中", "ゆっくりと": "ゆっくり"}.get(word, word)
    read = {("修行", "しゅうぎょう"): "しゅぎょう", ("復旧", "ふくきゅう"): "ふっきゅう", ("真ん中", "まんなか"): "まんなか"}.get((word, read), read)
    kana = re.fullmatch(r"[ぁ-んァ-ヶー]+", word)
    if kana:  # the spelling says how it reads: the list's reading column sometimes holds a neighbouring word (キログラム きろ)
        read = word
    elif read.endswith("する") and not word.endswith("する"):  # 勉強 べんきょうする
        read = read[:-2]
    read = hira(read)
    if (word, read) in {("良い", "いい"), ("一段と", "いちだんと")} or word in by_read[read]:
        return word, read
    if word.endswith("する") and kana:
        return checked(word[:-2], read[:-2])
    reads = [r for r in by_read if r.startswith(read) and len(r) - len(read) <= 3] if kana else [read]
    full = {(k, r) for r in reads for k in by_read[r] if k.startswith(word) and len(k) - len(word) <= 3}
    if len(full) == 1:
        return full.pop()
    print("  not in JMdict, dropped:", word, read)
    return None


assert checked("素晴らし", "すばらしい") == ("素晴らしい", "すばらしい") and checked("愛憎", "あいにく") is None and checked("コーヒー", "こーひー") and checked("勉強", "べんきょうする") == ("勉強", "べんきょう") and checked("キログラム", "きろ") == ("キログラム", "きろぐらむ")

# ---- word units
# The JLPT lists are old and JMdict does not mark these: the things are gone, or the job title changed (客室乗務員, 看護師, 保育士).
GONE = {"スチュワーデス", "ワープロ", "テープレコーダー", "カセット", "タイプライター", "タイピスト", "看護婦", "保母", "ラジカセ", "テレックス"}
seen, stats = set(), {}
for lv in LEVELS:
    rows = list(csv.reader(open(D / f"jlpt/{lv}_vocab_cleaned.csv", encoding="utf8")))[1:]
    words = []
    for r in rows:
        if len(r) < 2:
            continue
        word, read = r[0].strip(), re.sub(r"[()（）]", "", r[1]).strip()
        word = re.sub(r"[()（）]", "", word)
        if not word or not read or re.search(r"[=＝\s・〜～/]", word + read) or not re.fullmatch(r"[ぁ-んァ-ヶー]+", read):
            continue
        fixed = checked(word, read)
        if not fixed or fixed[0] in seen:
            continue
        word, read = fixed
        seen.add(word)
        if (word, read) in dated or word in GONE:
            print("  dated, dropped:", lv, word, read)
            continue
        hits = find(word, read)
        zh = OWN.get(word) or thes_gloss(word, read) or wikt.get(word)
        en = None if zh else jm.get((word, read))
        if not zh and not en:
            continue
        words.append({"w": word, "r": read, "ja": align(word, read), "zh": zh, "en": en, "freq": len(hits), "hits": hits})
    # Commonest first: the source lists are alphabetical, which is no order to learn in.
    words.sort(key=lambda x: -x["freq"])
    used, out = set(), []
    for x in words:
        pool = [i for i in x["hits"] if i not in used]
        short = [i for i in pool if len(sents[i]["ja"]) <= CAP[lv]]
        # Mid-length with a translation teaches more than the shortest possible 知らない。
        pick = sorted(short or pool, key=lambda i: (str(sents[i]["id"]) not in voiced, sents[i]["zh"] is None, abs(len(sents[i]["ja"]) - 15)))[:2]
        used.update(pick)
        item = {"w": x["w"], "ja": x["ja"], "ex": [example(sents[i]) for i in pick]}
        if x["zh"]:
            item["zh"] = x["zh"]
        else:
            item["en"] = x["en"]
        out.append(item)
    (OUT / f"{lv}.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    stats[lv] = (len(out), sum(1 for x in out if x.get("zh")), sum(1 for x in out if x["ex"]), sum(1 for x in out for e in x["ex"] if e.get("zh")))
    print(lv, "words", stats[lv][0], "zh", stats[lv][1], "with example", stats[lv][2], "examples with zh", stats[lv][3])

# ---- scenes and anime: hand-picked word sets (scripts/topics.json), meanings and sentences found the same way
topics, topic_words = {}, 0
for slug, spec in json.loads((ROOT / "scripts/topics.json").read_text(encoding="utf8")).items():
    items, used = [], set()
    for token in spec.split():
        word, _, read = token.partition(":")
        read = read or word
        if word not in OWN and not checked(word, read):  # OWN holds hand-checked proper names, which JMdict leaves out
            continue
        read = hira(read)
        zh = OWN.get(word) or thes_gloss(word, read) or wikt.get(word)
        en = None if zh else jm.get((word, read))
        if not zh and not en:
            print("  no gloss", slug, word)
            continue
        pool = [i for i in find(word, read) if i not in used and len(sents[i]["ja"]) <= 40]
        pick = sorted(pool, key=lambda i: (str(sents[i]["id"]) not in voiced, sents[i]["zh"] is None, abs(len(sents[i]["ja"]) - 15)))[:2]
        used.update(pick)
        item = {"w": word, "ja": align(word, read), "ex": [example(sents[i]) for i in pick]}
        item.update({"zh": zh} if zh else {"en": en})
        items.append(item)
    topics[slug] = items
    topic_words += len(items)
(OUT / "topics.json").write_text(json.dumps(topics, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
print("topics", len(topics), "words", topic_words, "no-example", sum(1 for v in topics.values() for x in v if not x["ex"]))

