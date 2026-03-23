# 캐릭터 디테일 페이지 정보 전체 표시

## 작업 목적
API에서 가져올 수 있는 모든 정보(무기/방어구, 악세서리, 각인, 보석, 카드 세트, 스킬)를 정리해서 표시

## 변경한 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/lib/lostark/api.ts` | 필터에 `cards+combat-skills` 추가 |
| `src/types/index.ts` | `ArmoryCard`, `ArmoryCardItem`, `ArmoryCardEffect`, `ArmorySkill`, `SkillTripod`, `SkillRune` 타입 추가 |
| `src/components/character/ArmoryView.tsx` | 전체 섹션 개편 |

## 표시 섹션 순서

1. **프로필** - 이미지, 이름, 서버, 클래스, 레벨, 아이템 레벨, 길드, 원정대
2. **전투 스탯** - 치명/특화/제압/신속/인내/숙련 (6열 그리드)
3. **무기·방어구** - 무기/투구/상의/하의/장갑/어깨 (+강화 수치, 품질, 등급 색상)
4. **악세서리** - 목걸이/귀걸이/반지/팔찌/어빌리티 스톤 (품질, 연마효과, 각인)
5. **장착 각인** - 아크패시브 우선, 구형 fallback
6. **보석** - 레벨순 정렬, 스킬명 + 효과 설명
7. **카드 세트 효과** - 활성화된 세트 보너스만 표시
8. **스킬** - 레벨 > 1 이거나 트라이포드 선택된 스킬, 룬 표시

## 핵심 컴포넌트
- `EquipmentCard` - 무기/방어구 (이름에서 +강화 추출, HTML strip)
- `AccessoryCard` - 악세서리 (parseTooltip 재사용)
- `SkillCard` - 스킬 + 선택된 트라이포드 + 룬
