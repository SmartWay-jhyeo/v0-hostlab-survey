-- region_demand_surveys 테이블에 option_type 컬럼 추가
-- option_type: 1 = 서울 5개, 2 = 경기/인천/지방 10개, 3 = 서울 3개 + 지방 2개

ALTER TABLE region_demand_surveys
ADD COLUMN IF NOT EXISTS option_type INTEGER;

-- 기존 데이터는 NULL로 유지 (이전에 제출된 응답)
COMMENT ON COLUMN region_demand_surveys.option_type IS '선택 옵션: 1=서울5개, 2=경기인천지방10개, 3=서울3개+지방2개';
