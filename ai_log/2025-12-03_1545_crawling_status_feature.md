# 크롤링 완료/미완료 지역 관리 기능 구현

**날짜**: 2025-12-03 15:45 KST
**작업자**: Claude Code

## 요약
관리자 페이지에서 수요조사에 투표된 지역들을 "완료/미완료" 탭으로 분리하여 관리하는 기능 추가

---

## 구현 내용

### 1. DB 마이그레이션
**파일**: `scripts/004-create-crawled-regions.sql`

```sql
CREATE TABLE crawled_regions (
  id UUID PRIMARY KEY,
  region_name TEXT NOT NULL UNIQUE,
  is_crawled BOOLEAN DEFAULT FALSE,
  crawled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Tabs UI 컴포넌트
**파일**: `components/ui/tabs.tsx` (신규)
- Radix UI Tabs 기반 컴포넌트
- Tabs, TabsList, TabsTrigger, TabsContent 내보내기

### 3. Server Actions 추가
**파일**: `lib/actions/survey.ts`

추가된 함수:
- `getCrawledRegions()`: 크롤링 상태 조회
- `toggleRegionCrawlStatus(regionName)`: 단일 지역 상태 토글
- `bulkUpdateCrawlStatus(regionNames, isCrawled)`: 일괄 상태 변경

### 4. UI 컴포넌트 수정
**파일**: `components/survey-results.tsx`

- 크롤링 상태 관리 섹션 추가
- 미완료/완료 탭 UI
- 개별 및 일괄 상태 변경 기능
- CSV 다운로드, 삭제 기능 통합

---

## 커밋 이력

1. `081536c` - feat: 크롤링 완료/미완료 지역 관리 기능 추가
2. `018ed3d` - refactor: 크롤링 상태 관리 섹션에 삭제/다운로드 기능 통합

---

## UI 구조

```
┌─────────────────────────────────────────────────────────────┐
│  크롤링 상태 관리           [삭제하기] [CSV 다운로드]        │
├─────────────────────────────────────────────────────────────┤
│  [미완료 (N개)] | [완료 (N개)]                               │
├─────────────────────────────────────────────────────────────┤
│  □ 전체 선택     [선택 완료 처리 (N개)]                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ □ 서울 강남구 역삼동  [5표] [✓]                          ││
│  │ □ 서울 서초구 반포동  [3표] [✓]                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 변경된 파일 목록

| 파일 | 변경 유형 |
|------|----------|
| `scripts/004-create-crawled-regions.sql` | 신규 |
| `components/ui/tabs.tsx` | 신규 |
| `lib/actions/survey.ts` | 수정 (함수 3개 추가) |
| `components/survey-results.tsx` | 수정 (UI 섹션 추가/통합) |
