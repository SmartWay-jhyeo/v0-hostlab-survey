-- 지역 수요조사 테이블 생성 (기존 테이블은 건드리지 않음)
CREATE TABLE IF NOT EXISTS region_demand_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  cohort TEXT NOT NULL,
  selected_regions TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE region_demand_surveys ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 삽입 가능
CREATE POLICY "Anyone can insert surveys" ON region_demand_surveys
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 조회 가능 (관리자 페이지에서 비밀번호로 보호)
CREATE POLICY "Anyone can read surveys" ON region_demand_surveys
  FOR SELECT USING (true);
