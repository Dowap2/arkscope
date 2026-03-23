# 떠돌이 상인 크롤러 조사

## 목표
kloa.gg/merchant에서 실시간 상인 현황을 가져와 특정 아이템이 있을 때 디스코드 봇으로 알림 전송

---

## 조사 내용

### kloa.gg/merchant 페이지 분석

- **프레임워크**: Next.js 16, SSG (`__N_SSG: true`)
- **Build ID**: `KSH-ghp4SEeZqPjsxRjoE`
- **정적 데이터 엔드포인트**: `https://kloa.gg/_next/data/KSH-ghp4SEeZqPjsxRjoE/merchant.json`

### 정적 데이터 구조 (`__NEXT_DATA__`)

```
pageProps.initialData.scheme
├── schedules[]  - 요일(0-6)별 활성 시간대 및 그룹(1-3) 정보
└── regions[]    - 22개 지역별 NPC/아이템 정보
    ├── id, name (지역명), npcName, group
    └── items[]
        ├── id, type (1=캐릭터 / 2=소비아이템 / 3=특수아이템)
        ├── name, grade (0-4), icon
        └── default, hidden
```

**22개 지역**: 아르테미스, 유디아, 루테란 서부/동부, 토토이크, 애니츠, 아르데타인, 베른 북부/남부, 슈샤이어, 로헨델, 욘, 페이튼, 파푸니카, 로웬, 엘가시아, 플레체, 볼다이크, 쿠르잔 남부/북부, 림레이크 남섬

### 실시간 API 탐색 결과

| 엔드포인트 | 결과 |
|---|---|
| `/api/merchant` | 404 |
| `/api/merchants` | 404 |
| `/api/merchant/reports` | 404 |
| `/_next/static/chunks/pages/merchant.js` | 404 |

- WebFetch는 JS를 실행하지 않아 클라이언트사이드 API 호출 탐지 불가
- 실시간 제보 데이터는 JS 렌더링 후에야 로드되는 것으로 추정

### lostmerchants.com 검토 → 제외

- 해외(글로벌) 서버 전용 → 한국 서버 해당 없음

---

## 결론 및 다음 방향

**채택 방향**: Python(Playwright) 크롤러로 JS 렌더링 후 데이터 추출 → TypeScript 봇에서 처리

- Python: `playwright` 또는 `selenium`으로 페이지 렌더링 후 현재 활성 상인 데이터 파싱
- TypeScript 봇: Python 스크립트 실행 → JSON 결과 파싱 → 타겟 아이템 감지 → 디스코드 채널 알림

---

## 현재 봇 구조

| 파일 | 역할 |
|---|---|
| `discord/bot.ts` | 클라이언트 초기화, 커맨드 라우팅 |
| `discord/commands/raids.ts` | `/raids`, `/tier`, `/characters` 커맨드 |
| `discord/lib/level.ts` | 레벨 구간 유틸 |
| `discord/deploy.ts` | 슬래시 커맨드 등록 |
