#!/usr/bin/env python3
"""Build src/data/wiki/*.json and public/img/c/*.webp: excerpts of ja/zh Wikipedia (CC BY-SA 4.0) with their free lead image.

Usage: python -I scripts/fetch-wiki.py CACHE_DIR   (needs opencc-python-reimplemented and ffmpeg)
Topics: scripts/culture.txt plus the works in src/data/anime.js. Responses are cached, so a re-run costs nothing.
"""
import datetime, json, pathlib, re, subprocess, sys, time, urllib.parse, urllib.request
from opencc import OpenCC

ROOT = pathlib.Path(__file__).resolve().parent.parent
CACHE = pathlib.Path(sys.argv[1])
OUT = ROOT / "src/data/wiki"
IMG = ROOT / "public/img/c"
UA = {"User-Agent": "furinkazan-study-site/1.0 (https://furinkazan.vercel.app/; non-commercial learning site)"}
T2S = OpenCC("t2s")
SKIP = re.compile(r"脚注|出典|参考|関連|外部リンク|注釈|登場人物|キャスト|声の出演|スタッフ|あらすじ|ストーリー|書誌|単行本|既刊|評価|受賞|テレビ|放送|主題歌|各話|ゲーム|映画|注释|参考|外部链接|相关|登场|角色|剧情|声优|制作人员|脚注|注解|参见|註释|备注")
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
IMG.mkdir(parents=True, exist_ok=True)


def get(host, params, name):
    path = CACHE / name
    if path.exists():
        return json.loads(path.read_text(encoding="utf8"))
    url = f"https://{host}/w/api.php?" + urllib.parse.urlencode({"format": "json", "formatversion": 2, **params})
    for wait in (3, 30, 90, 180):
        time.sleep(wait)
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r:
                data = json.load(r)
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf8")
            return data
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
    raise SystemExit("rate limited: " + url)


def page(lang, title, tag):
    d = get(f"{lang}.wikipedia.org", {"action": "query", "redirects": 1, "titles": title, "prop": "extracts|pageimages|langlinks|info",
                                      "explaintext": 1, "lllang": "zh", "lllimit": 1, "pilicense": "free", "piprop": "name", "inprop": "url"}, f"{tag}.{lang}.json")
    p = d["query"]["pages"][0]
    return None if p.get("missing") else p


def excerpt(text, limit, intro_only):
    """Lead plus following sections until the limit, whole paragraphs only. Returns [{h}|{p}] blocks."""
    blocks, n, skipping = [], 0, False
    for line in text.split("\n"):
        line = re.sub(r"[（(][\s、,，;；:：]*[）)]", "", line).strip()
        if not line:
            continue
        m = re.fullmatch(r"(=+)\s*(.+?)\s*\1", line)
        if m:
            if intro_only or (n >= limit):
                break
            skipping = bool(SKIP.search(m.group(2)))
            if not skipping:
                blocks.append({"h": m.group(2)})
            continue
        if skipping or len(line) < 8:
            continue
        blocks.append({"p": line})
        n += len(line)
        if n >= limit:
            break
    while blocks and "h" in blocks[-1]:
        blocks.pop()
    return blocks


def image(name, slug):
    d = get("commons.wikimedia.org", {"action": "query", "titles": f"File:{name}", "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 960}, f"{slug}.img.json")
    info = d["query"]["pages"][0].get("imageinfo", [None])[0]
    if not info:
        return None
    meta = info["extmetadata"]
    lic = meta.get("LicenseShortName", {}).get("value", "")
    artist = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip()[:120]
    out = IMG / f"{slug}.webp"
    if not out.exists():
        raw = CACHE / f"{slug}.imgraw"
        if not raw.exists():
            time.sleep(2)
            with urllib.request.urlopen(urllib.request.Request(info.get("thumburl") or info["url"], headers=UA)) as r:
                raw.write_bytes(r.read())
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-vf", "scale='min(960,iw)':-2", "-q:v", "72", str(out)], check=False)
        if not out.exists():
            return None
    size = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(out)], capture_output=True, text=True).stdout.strip().split(",")
    return {"src": f"/img/c/{slug}.webp", "w": int(size[0]), "h": int(size[1]), "by": artist, "lic": lic, "page": info["descriptionurl"]}


def topics():
    for line in (ROOT / "scripts/culture.txt").read_text(encoding="utf8").splitlines():
        if line and not line.startswith("#"):
            p = line.split("|")
            yield {"slug": p[0], "cat": p[1], "title": p[2], "art": p[3] if len(p) > 3 else None, "art2": p[4] if len(p) > 4 else None}
    src = (ROOT / "src/data/anime.js").read_text(encoding="utf8")
    for slug, title in re.findall(r"slug: '([^']+)'.*?src: wiki\('([^']+)'\)", src):
        yield {"slug": f"anime-{slug}", "cat": "anime", "title": title.replace("_", " "), "art": None, "art2": None}


today = datetime.date.today().isoformat()
index, missing = [], []
for t in topics():
    ja = page("ja", t["title"], t["slug"])
    if not ja:
        missing.append(t["title"])
        continue
    anime = t["cat"] == "anime"
    zh_title = (ja.get("langlinks") or [{}])[0].get("title")
    zh = page("zh", zh_title, t["slug"]) if zh_title else None
    ja_blocks = excerpt(ja["extract"], 500 if anime else 1500, False)
    zh_blocks = [({"h": T2S.convert(b["h"])} if "h" in b else {"p": T2S.convert(b["p"])}) for b in excerpt(zh["extract"], 400 if anime else 1100, False)] if zh else []
    img = image(ja["pageimage"], t["slug"]) if ja.get("pageimage") else None
    first = next((b["p"] for b in zh_blocks if "p" in b), "")
    summary = (re.match(r".{8,90}?[。！？]", first) or [first[:80]])[0]
    rec = {"slug": t["slug"], "cat": t["cat"], "ja": ja["title"], "zh": T2S.convert(zh["title"]) if zh else None, "summary": summary,
           "jaUrl": ja["fullurl"], "zhUrl": zh["fullurl"] if zh else None, "date": today, "art": t["art"], "art2": t["art2"], "img": img,
           "jaText": ja_blocks, "zhText": zh_blocks}
    (OUT / f'{t["slug"]}.json').write_text(json.dumps(rec, ensure_ascii=False), encoding="utf8")
    index.append({k: rec[k] for k in ("slug", "cat", "ja", "zh", "summary", "img")})
    print(t["slug"], ja["title"], "|", rec["zh"], sum(len(b.get("p", "")) for b in ja_blocks), sum(len(b.get("p", "")) for b in zh_blocks), "img" if img else "-", flush=True)
(OUT / "index.json").write_text(json.dumps(index, ensure_ascii=False), encoding="utf8")
print("topics", len(index), "missing", missing, "no zh", [i["ja"] for i in index if not i["zh"]], "no image", sum(1 for i in index if not i["img"]))
