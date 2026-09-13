-- 크롤링 완료 상태를 기수별로 관리 (2026-09-13)
-- 배경: region_name 하나당 완료 여부가 한 줄만 있어 이전 기수에서 완료된 지역이
--       새 기수에서 다시 신청돼도 "미완료" 탭에 나타나지 않던 문제 해결.

ALTER TABLE crawled_regions ADD COLUMN IF NOT EXISTS cohort TEXT;

-- 기존 region_name 단독 UNIQUE 제약 제거 (기수별로 같은 지역이 여러 행 가능)
ALTER TABLE crawled_regions DROP CONSTRAINT IF EXISTS crawled_regions_region_name_key;

-- (region_name, cohort) 조합 유일. cohort IS NULL 인 행은 기수 도입 이전의 레거시 기록.
CREATE UNIQUE INDEX IF NOT EXISTS idx_crawled_regions_name_cohort
  ON crawled_regions (region_name, cohort);

CREATE INDEX IF NOT EXISTS idx_crawled_regions_cohort ON crawled_regions (cohort);

COMMENT ON COLUMN crawled_regions.cohort IS '수요조사 기수. NULL = 기수 도입 이전 레거시 기록(관리자 화면에서 사용하지 않음)';
