# 캐릭터 페이지 탭 레이아웃 구현

## 작업 목적
iloa.gg 스타일로 캐릭터 상세 페이지를 재구성.
- 상단에 캐릭터 핵심 정보(이름/서버/직업/전투력/레벨 등)를 고정
- 하위 콘텐츠를 7개 탭으로 분리

## 변경 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/index.ts` | `ArmoryProfile`에 `TownLevel?: number` 추가 |
| `src/app/characters/[name]/page.tsx` | 스티키 헤더 2행으로 확장 (캐릭터 정보 표시) |
| `src/components/character/ArmoryView.tsx` | `"use client"` 변환 + 탭 구조 전면 재편 |

## 헤더 구조 (sticky, top-0)

```
← 뒤로 | 캐릭터이름 @서버 [직업]
아이템전투력  |  전투 Lv  |  원정대 Lv  |  영지 Lv  |  ⚔ 길드명
```

- `page.tsx`에서 `armory.ArmoryProfile` 데이터를 직접 렌더링
- 영지(`TownLevel`)는 API에서 값이 있을 때만 표시

## 탭 구성

| 탭명 | 내용 | 상태 |
|------|------|------|
| 전투 | 전투 스탯 + 무기/방어구 + 악세서리 + 보석 + 카드 세트 | 구현 |
| 스킬 | 활성화된 스킬 목록 | 구현 |
| 아크패시브 | 아크 패시브 각인 효과 | 구현 |
| 내실 | — | 준비 중 플레이스홀더 |
| 아바타 | — | 준비 중 플레이스홀더 |
| 통계 | — | 준비 중 플레이스홀더 |
| 캐릭터 | — | 준비 중 플레이스홀더 |

## 핵심 결정 사항

- `ArmoryView`를 `"use client"` 로 변환 → `useState`로 탭 상태 관리
- 프로필 카드 섹션 삭제 → 정보가 헤더로 이동
- 탭 바는 `sticky top-[65px]`로 헤더 바로 아래 고정
- 최대 너비 `max-w-2xl` → `max-w-4xl` 으로 확장

## 실행 방법

```bash
npm run dev
# /characters/[이름] 접속
```
