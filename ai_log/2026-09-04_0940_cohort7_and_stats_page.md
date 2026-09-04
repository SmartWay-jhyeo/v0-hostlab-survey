# 2026-09-04 기수 전환(6기→7기) 및 통계 페이지 추가

## 작업 내용

### 1. 기수 전환
- `components/survey/UserInfoSection.tsx`의 `COHORTS`에 `7기` 추가 (커밋 3c8d795)
- DB `archived_cohorts`에 `6기` 삽입 → 관리자 페이지에서 6기가 "마무리된 기수" 탭으로 이동
  - 참고: PowerShell로 REST 삽입 시 한글 인코딩이 깨져 `6?` 행이 생겼다가 삭제 후 UTF-8로 재삽입함

### 2. 통계 페이지 (/stats) 신규
- `app/stats/page.tsx` 서버 컴포넌트 (커밋 46b5a46)
- 기능:
  - 기수별 필터 (쿼리 파라미터 `?cohort=`, 마무리된 기수는 "(마무리)" 표시)
  - 요약 카드: 참여 인원 / 선택된 지역 수 / 총 선택 수
  - 지역별 선택 순위 (막대 + 표 수, 전체 지역 표시)
- 집계 방식은 admin과 동일: 이름+기수 기준 중복 제거 후 카운트
- 홈(`app/page.tsx`) 헤더에 "통계" 링크 추가

## 참고
- `components/survey-form.tsx`는 미사용 구버전 (COHORTS 1~4기로 남아있음) — 실제 사용되는 폼은 `components/survey/` 하위
- 로컬 빌드 검증 완료 (Next.js 16.1.6, `/stats`는 dynamic 라우트)
