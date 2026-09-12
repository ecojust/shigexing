import csv, glob, os, json, re

def clean(s):
    s = (s or "").strip()
    s = re.sub(r"\s+", "", s)
    return s

def age_int(r):
    """解析“年岁”列。CSV 中年岁列只在诗人活着时填写，卒后追封/赐谥等记录为空"""
    m = re.search(r"\d+", clean(r.get("年岁")))
    return int(m.group()) if m else None

def year_value(recs):
    """由真实数据推导人生曲线高度：作品多/任职高则高，贬谪/离世则低"""
    joined = " ".join(r["activity"] for r in recs) + " " + " ".join(r["office"] for r in recs)
    if any(k in joined for k in ["卒", "溺水", "惊悸而卒", "淹死"]):
        return 0
    if any(k in joined for k in ["贬", "斥出", "罪", "狱", "杀官奴", "拘审", "逐出", "病死"]):
        v = 2
    else:
        v = 1
    works = [r for r in recs if r["work"] and r["work"] not in ("", "原作已佚")]
    v += min(len(works), 6) * 1.4
    offices = [r for r in recs if r["office"] and r["office"] not in ("", "王府侍读")]
    if offices:
        v += 2
    famous = {"滕王阁", "滕王阁序", "长安古意", "代李敬业传檄天下文", "在狱咏蝉", "从军行", "送杜少府之任蜀州"}
    if any(r["work"] in famous for r in recs):
        v += 2
    return max(0, min(10, round(v)))

out = {}
for path in sorted(glob.glob("src/datacsv/*.csv")):
    name = os.path.basename(path).replace("行迹_", "").replace(".csv", "")
    years = {}
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            activity = clean(r.get("活动内容或创作缘起"))
            # 过滤明显是后代/后人追述、非诗人本人行迹的杂行
            if any(k in activity for k in ["世孙", "裔孙", "后裔", "七世", "子孙", "家谱", "族谱", "后人追述", "后世"]):
                continue
            y = clean(r.get("年份"))
            if not y.isdigit():
                continue
            y = int(y)
            if not (600 <= y <= 1300):
                continue
            work = clean(r.get("系年作品"))
            rec = {
                "month": clean(r.get("月")),
                "state": clean(r.get("州")),
                "city": clean(r.get("市")),
                "county": clean(r.get("县") or r.get("地点名胜")),
                "lng": clean(r.get("经度")),
                "lat": clean(r.get("纬度")),
                "office": clean(r.get("任职官名")),
                "activity": activity,
                "work": work,
            }
            years.setdefault(y, []).append((rec, age_int(r) is not None))
    # 生卒年只依据填写了“年岁”的记录：追封、赐谥、后人修墓等卒后记录年份不可用
    alive_years = [y for y, recs in years.items() if any(age for rec, age in recs)]
    birth = min(alive_years) if alive_years else min(years)
    death = max(alive_years) if alive_years else max(years)
    # 每年保留：先有实质活动/作品的记录，不够时再用"居于家乡"；仅保留在世年份
    post = {}
    for y in sorted(years):
        if not (birth <= y <= death):
            continue
        recs = [rec for rec, age in years[y]]
        important = [x for x in recs if x["activity"] and "居于家乡" not in x["activity"]]
        if important:
            post[y] = important
        else:
            post[y] = recs[:1]
    # 出生年取最小年份
    def place_for(recs):
        r = next((x for x in recs if x["city"] and x["county"]), recs[0])
        return f"{r['city']}（{r['county']}）" if r["city"] and r["county"] else (r["city"] or r["county"] or "")

    def event_for(recs):
        r = recs[0]
        act = r["activity"] or ""
        if r["work"]:
            return f"{r['work']}；{act}"
        return act or "生活于此"

    years_list = []
    for y in sorted(post):
        recs = post[y]
        years_list.append({
            "time": y,
            "value": year_value(recs),
            "event": event_for(recs),
            "place": place_for(recs),
            "lng": recs[0]["lng"],
            "lat": recs[0]["lat"],
        })
    out[name] = {
        "name": name,
        "birth": birth,
        "death": death,
        "life": years_list,
    }

with open("src/timeline/tracks.js", "w", encoding="utf-8") as f:
    f.write("// 由 src/datacsv/*.csv 生成（生成脚本见 tools/import_tracks.py）\n")
    f.write("export const poetTracks = ")
    f.write(json.dumps(out, ensure_ascii=False, indent=1))
    f.write(";\n")

for k, v in out.items():
    print(k, "birth", v["birth"], "death", v["death"], "points", len(v["life"]))
print("written src/timeline/tracks.js")