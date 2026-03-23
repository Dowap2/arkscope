# 떠돌이 상인 슬롯 버그픽스

**날짜**: 2026-03-23
**작업 유형**: 버그픽스

---

## 문제

카단 서버처럼 현재 활성 슬롯이 없을 때(제보 없음)도 만료된 이전 슬롯 데이터가 출력되는 문제

## 원인

`current_slot()` 함수에서 현재 시각이 어떤 슬롯에도 해당하지 않으면 `reports_data[-1]` (마지막 슬롯)으로 fallback하던 코드

## 수정한 파일

| 파일 | 변경 내용 |
|---|---|
| `crawler/merchant.py` | `current_slot()` — 활성 슬롯 없으면 `None` 반환, exit 1 + `{"error": "활성 슬롯 없음"}` |
| `crawler/merchant_show.py` | 동일한 fallback 제거, "현재 활성 슬롯 없음" 메시지 출력 |

## 수정 전후

```python
# Before — 만료된 슬롯을 그대로 사용
return reports_data[-1] if reports_data else None

# After — 활성 슬롯 없으면 None
return None
```
