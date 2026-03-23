#!/usr/bin/env python3
"""
떠돌이 상인 현황 출력기

사용법:
  python crawler/merchant_show.py          # 서버 1 (루페온)
  python crawler/merchant_show.py 5        # 서버 5 (카단)
  python crawler/merchant_show.py --list   # 서버 목록 출력
"""

import json
import re
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ─── 서버 목록 ────────────────────────────────────────────────────────────────

SERVERS = {
    1: "루페온",
    2: "실리안",
    3: "아만",
    4: "아브렐슈드",
    5: "카단",
    6: "카마인",
    7: "카제로스",
    8: "엔제리카",
}

GRADE_COLOR = {
    0: "\033[37m",   # 일반 — 흰색
    1: "\033[32m",   # 고급 — 초록
    2: "\033[34m",   # 희귀 — 파랑
    3: "\033[35m",   # 영웅 — 보라
    4: "\033[33m",   # 전설 — 주황
}
GRADE_LABEL = {0: "일반", 1: "고급", 2: "희귀", 3: "영웅", 4: "전설"}
TYPE_LABEL  = {1: "캐릭터", 2: "소비", 3: "특수"}
RESET = "\033[0m"
DIM   = "\033[2m"
LINE  = "─" * 44

# ─── HTTP ─────────────────────────────────────────────────────────────────────

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

def fetch(url: str) -> bytes:
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=15) as r:
        return r.read()

# ─── 데이터 로드 ──────────────────────────────────────────────────────────────

def get_scheme() -> dict:
    html = fetch("https://kloa.gg/merchant").decode("utf-8", errors="replace")
    m = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
        html, re.DOTALL
    )
    if not m:
        raise RuntimeError("스킴 로드 실패")
    data = json.loads(m.group(1))
    return data["props"]["pageProps"]["initialData"]["scheme"]

def get_current_merchants(server: int) -> tuple[list, dict]:
    """(active_merchants, slot_info) 반환"""
    scheme = get_scheme()

    # 지역·아이템 룩업
    region_map: dict = {}
    for region in scheme.get("regions", []):
        rid = str(region["id"])
        items_by_id = {str(i["id"]): i for i in region.get("items", [])}
        region_map[rid] = {**region, "items_by_id": items_by_id}

    # 제보 데이터
    reports_data: list = json.loads(
        fetch(f"https://api.korlark.com/lostark/merchant/reports?server={server}")
    )

    # 현재 슬롯
    now = datetime.now(timezone.utc)
    slot = None
    for s in reports_data:
        start = datetime.fromisoformat(s["startTime"].replace("Z", "+00:00"))
        end   = datetime.fromisoformat(s["endTime"].replace("Z", "+00:00"))
        if start <= now <= end:
            slot = s
            break
    if slot is None:
        return [], {}

    # 지역별 최우선 제보
    best: dict[str, dict] = {}
    for report in slot.get("reports", []):
        rid = str(report["regionId"])
        if rid not in best or report["upVoteCount"] > best[rid]["upVoteCount"]:
            best[rid] = report

    # 결과 조합
    merchants = []
    for rid, report in sorted(best.items(), key=lambda kv: int(kv[0])):
        region = region_map.get(rid, {})
        items = [
            {
                "name":  region.get("items_by_id", {}).get(iid, {}).get("name", f"#{iid}"),
                "grade": region.get("items_by_id", {}).get(iid, {}).get("grade"),
                "type":  region.get("items_by_id", {}).get(iid, {}).get("type"),
            }
            for iid in report.get("itemIds", [])
        ]
        merchants.append({
            "region":  region.get("name", f"지역{rid}"),
            "npcName": region.get("npcName", ""),
            "items":   items,
            "upVotes": report["upVoteCount"],
        })

    slot_info = {
        "start": slot["startTime"],
        "end":   slot["endTime"],
    }
    return merchants, slot_info

# ─── 출력 ─────────────────────────────────────────────────────────────────────

def kst(iso: str) -> str:
    d = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    kst_h = (d.hour + 9) % 24
    return f"{kst_h:02d}:{d.minute:02d}"

def print_merchants(merchants: list, slot: dict, server: int):
    server_name = SERVERS.get(server, f"서버{server}")
    start = kst(slot["start"])
    end   = kst(slot["end"])

    print()
    print(f"  {LINE}")
    print(f"  🧭  떠돌이 상인 현황")
    print(f"  📡  {server_name}  (서버 {server})")
    print(f"  🕐  {start} ~ {end} KST   |   {len(merchants)}개 지역")
    print(f"  {LINE}")

    for m in merchants:
        upvote = f"  👍 {m['upVotes']}" if m["upVotes"] > 0 else ""
        print(f"\n  📍 {m['region']}  ·  {m['npcName']}{upvote}")
        for item in m["items"]:
            g = item.get("grade")
            t = item.get("type")
            color = GRADE_COLOR.get(g, "") if g is not None else ""
            grade = GRADE_LABEL.get(g, "") if g is not None else ""
            typ   = TYPE_LABEL.get(t, "")  if t is not None else ""
            tag   = f"  {DIM}{grade} · {typ}{RESET}" if grade or typ else ""
            print(f"     {color}{item['name']}{RESET}{tag}")

    print(f"\n  {LINE}")
    print()

# ─── 진입점 ───────────────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]

    if "--list" in args:
        print("\n  서버 목록:")
        for num, name in SERVERS.items():
            print(f"    {num}: {name}")
        print()
        return

    server = 1
    if args:
        try:
            server = int(args[0])
        except ValueError:
            print(f"사용법: python crawler/merchant_show.py [서버번호]")
            print(f"서버 목록: python crawler/merchant_show.py --list")
            sys.exit(1)

    if server not in SERVERS:
        print(f"유효하지 않은 서버 번호: {server}")
        print(f"유효 범위: {min(SERVERS)} ~ {max(SERVERS)}")
        sys.exit(1)

    print(f"  로딩 중...", end="\r")
    merchants, slot = get_current_merchants(server)

    if not merchants:
        server_name = SERVERS.get(server, f"서버{server}")
        print(f"  현재 활성 슬롯 없음 — {server_name} 서버에 제보가 없습니다.")
        return

    print_merchants(merchants, slot, server)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
    except Exception as e:
        print(f"오류: {e}")
        sys.exit(1)
