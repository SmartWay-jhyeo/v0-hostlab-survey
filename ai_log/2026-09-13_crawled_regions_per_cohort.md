# 2026-09-13 크롤링 완료 상태 기수별 관리

## 문제
- `crawled_regions` 는 `region_name` 하나당 완료 여부가 한 줄뿐이었다 (UNIQUE(region_name)).
- 이전 기수에서 완료 처리된 지역(이문동, 수서동, 천호동, 신림동, 한강로2가, 부평동, 정자동, 쌍용동 등)이
  1기에서 다시 신청됐는데도 관리자 "미완료" 탭에 나타나지 않아 미수집 CSV에서 빠지고 크롤링도 누락됐다.

## 변경
### DB (`scripts/005-crawled-regions-cohort.sql`, 운영 DB 적용 완료)
- `cohort TEXT` 컬럼 추가, `UNIQUE(region_name)` 제약 제거, `UNIQUE(region_name, cohort)` 인덱스 추가
- 기존 행(128건)은 `cohort = NULL` 레거시로 남겨두고 관리자 화면에서는 사용하지 않음
- 1기/티나1기 신청 동 중 **2026-09 크롤링 파일이 실제 존재하는 동만** 완료 행 삽입 (1기 16, 티나1기 4)
  - 근거 파일: HostLab `ref/수요조사/**/*_202609*.json`, `ref/티나1기_수요조사_20260913/**/*.json`
  - 미완료로 남긴 동: 정자동, 수서동, 천호동, 신림동, 이문동, 한강로2가, 부평동, 쌍용동, 노원 중계하계역
  - 구 단위 신청("서울시 광진구" 등)은 동이 없어 처리 대상 아님

### 코드
- `lib/actions/survey.ts`: `getCrawledRegions()` 는 cohort 있는 행만 반환,
  `toggleRegionCrawlStatus(region, cohort)`, `bulkUpdateCrawlStatus(regions, isCrawled, cohort)`
- `lib/region-utils.ts`: `crawlStatusKey(cohort, region)` 헬퍼 (Map 키 = `${cohort}::${region}`)
- `components/admin/crawling/CrawlingStatusManager.tsx`: 기수 드롭다운 추가, 선택 기수 기준으로 표 수·완료 여부 계산
- `components/admin/hooks/useSurveyData.ts`, `useCrawlingStatus.ts`: 기수 키 반영
- `components/survey-results.tsx`: 미사용 구버전 컴포넌트 삭제 (구 시그니처 참조)
