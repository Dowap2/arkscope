# 떠돌이 상인 크롤러 구현

**날짜**: 2026-03-23
**작업 유형**: 신규 기능 개발

---

## 목적

kloa.gg/merchant의 실시간 떠돌이 상인 현황을 가져와 Discord 봇으로 특정 아이템 알림 전송

---

## 발견한 API

| 용도 | URL |
|---|---|
| 스킴 (지역·아이템 메타) | `https://kloa.gg/merchant` → `__NEXT_DATA__` 파싱 |
| 실시간 제보 | `https://api.korlark.com/lostark/merchant/reports?server={n}` |

**실시간 API 응답 구조**
```json
[
  {
    "startTime": "...", "endTime": "...",
    "reports": [
      { "regionId": "1", "itemIds": ["2","5","6"], "upVoteCount": 0, "status": 2 }
    ]
  }
]
```
- 슬롯 5개 반환, 현재 시각이 포함된 슬롯 사용
- `itemIds` / `regionId` → 스킴과 조합해 이름·등급·타입 조회
- `upVoteCount` 최다 제보를 지역별 대표로 채택

**서버 번호**

| 번호 | 서버 | | 번호 | 서버 |
|---|---|---|---|---|
| 1 | 루페온 | | 5 | 카단 |
| 2 | 실리안 | | 6 | 카마인 |
| 3 | 아만 | | 7 | 카제로스 |
| 4 | 아브렐슈드 | | 8 | 엔제리카 |

---

## 생성/수정한 파일

| 파일 | 유형 | 설명 |
|---|---|---|
| `crawler/merchant.py` | 신규 | JSON 출력 크롤러 (봇/파싱용) |
| `crawler/merchant_show.py` | 신규 | 터미널 가독성 출력 (서버 선택 → 현황) |
| `crawler/requirements.txt` | 수정 | 표준 라이브러리만 사용, 추가 설치 없음 |
| `discord/commands/merchant.ts` | 신규 | Discord `/merchant` 커맨드 |
| `discord/bot.ts` | 수정 | merchant 커맨드 + 폴러 연결 |
| `discord/deploy.ts` | 수정 | merchant 커맨드 슬래시 등록 |
| `.gitignore` | 수정 | `merchant-watches.json`, `merchant_debug.json` 추가 |
| `CLAUDE.md` | 수정 | 작업 후 md 요약 규칙 추가 |

---

## 크롤러 구조

### `crawler/merchant.py` (JSON 출력)

```
kloa.gg/merchant HTML → __NEXT_DATA__ → 스킴(지역·아이템 룩업)
api.korlark.com/reports → 현재 슬롯 필터 → 지역별 최다 upVote 제보 채택
stdout → JSON
```

```bash
python crawler/merchant.py              # 서버 1
python crawler/merchant.py --server 5   # 카단
```

### `crawler/merchant_show.py` (터미널 출력)

```bash
python crawler/merchant_show.py 5        # 카단
python crawler/merchant_show.py --list   # 서버 목록
```

출력 예시:
```
  ────────────────────────────────────────────
  🧭  떠돌이 상인 현황
  📡  카단  (서버 5)
  🕐  10:30 ~ 16:00 KST   |   15개 지역
  ────────────────────────────────────────────

  📍 아르테미스  ·  벤
     🟦  바루투  희귀 · 캐릭터
     🟪  더욱 화려한 꽃다발  영웅 · 소비
```

---

## Discord 커맨드

| 서브커맨드 | 기능 |
|---|---|
| `/merchant check [item] [server]` | 현재 상인 현황 임베드 출력 |
| `/merchant watch` | 감시 아이템 목록 조회 |
| `/merchant add <item> [channel] [server]` | 감시 아이템 등록 |
| `/merchant remove <item>` | 감시 아이템 삭제 |

**임베드 레이아웃** (description 기반, inline 필드 없음)
```
🧭 떠돌이 상인  ·  카단

**아르테미스** · 벤
🟦 바루투  🟪 더욱 화려한 꽃다발  🟪 레온하트 감자

**루테란 서부** · 말론
🟦 하셀링크  🟪 견고한 새장  ...
```

등급 이모지: ⬜ 일반 / 🟩 고급 / 🟦 희귀 / 🟪 영웅 / 🟧 전설

**알림 폴러**
감시 목록: `discord/merchant-watches.json` (gitignore)
실행 시각: **KST 10:30 / 16:30 / 22:30** (슬롯 전환 +30초, setTimeout 재귀 스케줄)

---

## 실행

```bash
# 봇 실행
npm run discord:bot

# 슬래시 커맨드 등록 (변경 시마다)
npm run discord:deploy

# 터미널에서 바로 확인
python crawler/merchant_show.py 5
```
