#!/usr/bin/env python3
"""
kloa.gg/merchant 떠돌이 상인 크롤러 (Playwright 불필요)

- 스킴  : kloa.gg/merchant HTML → __NEXT_DATA__ 파싱
- 제보  : api.korlark.com/lostark/merchant/reports?server={SERVER}

실행:
  python crawler/merchant.py
  python crawler/merchant.py --server 2   # 서버 번호 지정 (기본 1)
"""

import json
import re
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen

# Windows 터미널 인코딩 무관하게 UTF-8로 출력
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ─── 설정 ────────────────────────────────────────────────────────────────────

SERVER = 1
for i, arg in enumerate(sys.argv):
    if arg == "--server" and i + 1 < len(sys.argv):
        SERVER = int(sys.argv[i + 1])

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json, text/html, */*",
}

# ─── HTTP ────────────────────────────────────────────────────────────────────

def fetch_json(url: str) -> object:
    req = Request(url, headers=HEADERS)
    with urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def fetch_html(url: str) -> str:
    req = Request(url, headers={**HEADERS, "Accept": "text/html"})
    with urlopen(req, timeout=15) as r:
        raw = r.read()
    # 인코딩 감지
    for enc in ("utf-8", "utf-8-sig", "euc-kr"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")

# ─── 스킴 (지역·아이템 메타데이터) ───────────────────────────────────────────

def get_scheme() -> dict:
    html = fetch_html("https://kloa.gg/merchant")
    m = re.search(
        r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
        html, re.DOTALL
    )
    if not m:
        raise RuntimeError("__NEXT_DATA__ 블록을 찾지 못했습니다.")
    data = json.loads(m.group(1))
    return data["props"]["pageProps"]["initialData"]["scheme"]


def build_lookups(scheme: dict) -> tuple[dict, dict]:
    """
    region_map: str(regionId) → {id, name, npcName, group, items_by_id}
    item_map  : str(itemId)   → {id, name, grade, type}
    """
    region_map: dict = {}
    item_map: dict = {}

    for region in scheme.get("regions", []):
        rid = str(region["id"])
        items_by_id: dict = {}
        for item in region.get("items", []):
            iid = str(item["id"])
            items_by_id[iid] = item
            item_map[iid] = item
        region_map[rid] = {**region, "items_by_id": items_by_id}

    return region_map, item_map

# ─── 실시간 제보 ──────────────────────────────────────────────────────────────

def get_reports(server: int) -> list:
    return fetch_json(
        f"https://api.korlark.com/lostark/merchant/reports?server={server}"
    )


def current_slot(reports_data: list) -> dict | None:
    """현재 시각이 포함된 슬롯 반환. 활성 슬롯이 없으면 None."""
    now = datetime.now(timezone.utc)
    for slot in reports_data:
        start = datetime.fromisoformat(slot["startTime"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(slot["endTime"].replace("Z", "+00:00"))
        if start <= now <= end:
            return slot
    return None

# ─── 메인 ─────────────────────────────────────────────────────────────────────

def main():
    scheme = get_scheme()
    region_map, _ = build_lookups(scheme)

    reports_data = get_reports(SERVER)
    slot = current_slot(reports_data)

    if not slot:
        print(json.dumps({"error": "활성 슬롯 없음"}, ensure_ascii=False))
        sys.exit(1)

    # 지역별 최우선 제보 (upVoteCount 최다, 동점이면 최신)
    best_by_region: dict[str, dict] = {}
    for report in slot.get("reports", []):
        rid = str(report["regionId"])
        prev = best_by_region.get(rid)
        if prev is None or report["upVoteCount"] > prev["upVoteCount"]:
            best_by_region[rid] = report

    active: list = []
    for rid, report in sorted(best_by_region.items(), key=lambda kv: int(kv[0])):
        region = region_map.get(rid, {})
        items = [
            {
                "id": iid,
                "name": region.get("items_by_id", {}).get(iid, {}).get("name", f"item#{iid}"),
                "grade": region.get("items_by_id", {}).get(iid, {}).get("grade"),
                "type":  region.get("items_by_id", {}).get(iid, {}).get("type"),
            }
            for iid in report.get("itemIds", [])
        ]
        active.append({
            "regionId":   rid,
            "region":     region.get("name", f"지역{rid}"),
            "npcName":    region.get("npcName", ""),
            "group":      region.get("group"),
            "items":      items,
            "upVotes":    report["upVoteCount"],
            "reportedAt": report["createdAt"],
        })

    print(json.dumps({
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "server":      SERVER,
        "slotStart":   slot["startTime"],
        "slotEnd":     slot["endTime"],
        "merchants":   active,
    }, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.exit(1)
