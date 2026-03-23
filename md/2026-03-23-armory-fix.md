# 악세서리/보석 효과 표시 버그 수정

## 작업 목적
디버그 엔드포인트로 실제 API 응답을 확인한 뒤, 타입 정의와 파싱 로직을 실제 구조에 맞게 수정

## 변경한 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/types/index.ts` | 실제 API 구조에 맞게 타입 전면 수정 |
| `src/components/character/ArmoryView.tsx` | parseTooltip 및 렌더링 로직 전면 수정 |

## 핵심 수정 사항

### 1. 타입 오류 수정 (`types/index.ts`)
- `CharacterArmory.ArmoryEngrave` → `ArmoryEngraving` (필드명 오류)
- `ArmoryGemItem`: `Class`, `EffectType` 제거 → `Grade`, `Tooltip` 추가
- `ArmoryGem.Effects`: `ArmoryGemEffect[]` → `{ Description: string; Skills: ArmoryGemSkillEffect[] } | null`
- `ArmoryEngrave`: `ArkPassiveEffects: ArkPassiveEffect[] | null` 추가
- `ArkPassiveEffect` 타입 추가: `{ Name, Description, Grade, Level, AbilityStoneLevel }`
- `ArmoryGemSkillEffect` 타입 추가: `{ GemSlot, Name, Description: string[], Option, Icon }`

### 2. 각인 표시 수정 (`ArmoryView.tsx`)
- `armory.ArmoryEngraving?.ArkPassiveEffects` 우선 사용 (아크패시브)
- 없으면 구형 `Effects` fallback
- `Name` + `Lv.{Level}` 형태로 표시

### 3. 악세서리 tooltip 파싱 수정 (`parseTooltip`)
- 품질: `ItemTitle.value.qualityValue` (integer, -1 = 없음)
- 스탯 레이블: `"연마 효과"`, `"팔찌 효과"`, `"특수 효과"` (HTML strip 후 비교)
- 내용 분리: `<br>` 태그 기준으로 split 후 HTML strip
- 아이템명 HTML strip 처리

### 4. 보석 효과 표시 수정
- `gemData.Effects.Skills` 배열에서 `GemSlot === gem.Slot` 매칭
- `skill.Description`이 `string[]`이므로 `join(" ")`으로 합산
- 보석 타입 색상: `gem.Name`을 HTML strip 후 겁화/멸화/홍염/작열/광휘 포함 여부로 판별

## 실행 방법
```bash
npm run dev
```
