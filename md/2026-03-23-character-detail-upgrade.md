# 캐릭터 디테일 페이지 개선

## 작업 목적
1. 메인 페이지 캐릭터 검색 결과에서 캐릭터 디테일 페이지로 이동 가능하게
2. 캐릭터 디테일 페이지에서 악세서리, 각인 설명, 보석 상세 정보 표시

## 변경한 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/components/character/CharacterSearch.tsx` | 각 캐릭터 row를 `<Link>`로 래핑 → `/characters/[name]` 이동, hover 스타일 추가 |
| `src/lib/lostark/api.ts` | `filters=profiles+engravings+gems` → `filters=profiles+equipment+engravings+gems` |
| `src/types/index.ts` | `ArmoryEquipment` 타입 추가, `CharacterArmory`에 `ArmoryEquipment` 필드 추가 |
| `src/components/character/ArmoryView.tsx` | 악세서리 섹션 추가, 각인 설명 표시, 보석 상세 개선 |

## 핵심 구조/결정 사항

### 1. CharacterSearch 링크 연결
- `<div>` → `<Link href={/characters/${encodeURIComponent(c.CharacterName)}>` 교체
- `from` 파라미터 없이 이동 → 뒤로 버튼은 홈(`/`)으로 복귀

### 2. ArmoryEquipment 타입
```typescript
type ArmoryEquipment = {
  Slot: number; Name: string; Icon: string;
  Type: string; Grade: string; Tooltip: string;
};
```

### 3. 악세서리 Tooltip 파싱 (`parseTooltip`)
- Lost Ark API는 `Tooltip` 필드를 JSON 문자열로 반환
- `ItemPartBox` 타입 엘리먼트에서 품질(품질), 추가효과/전투특성 파싱
- `IndentStringGroup` 타입 엘리먼트에서 각인 효과(positive/negative) 파싱
- HTML 태그 strip 처리
- 파싱 실패 시 빈 결과 반환 (graceful degradation)

### 4. 등급 색상 시스템
- 고대: `text-yellow-200` / 유물: `text-orange-400` / 전설: `text-amber-400`
- 영웅: `text-purple-400` / 희귀: `text-blue-400`

### 5. 각인 설명 추가
- 기존: 각인 이름만 표시
- 변경: `e.Description` 필드 추가 표시 (있을 경우)

### 6. 보석 개선
- `truncate` 제거 → 전체 설명 표시
- `g.effect.Name` (스킬명)을 뱃지 옆에 명시적으로 표시
- 보석 타입별 색상 뱃지(border 포함) 추가

## 실행 방법
```bash
npm run dev
```
메인 페이지 → 캐릭터 검색 → 결과 클릭 → 캐릭터 디테일 페이지
