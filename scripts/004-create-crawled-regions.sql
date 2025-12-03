-- 크롤링 완료/미완료 지역 상태 관리 테이블
CREATE TABLE IF NOT EXISTS crawled_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  region_name TEXT NOT NULL UNIQUE,
  is_crawled BOOLEAN DEFAULT FALSE,
  crawled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_crawled_regions_name ON crawled_regions(region_name);
CREATE INDEX IF NOT EXISTS idx_crawled_regions_status ON crawled_regions(is_crawled);

-- RLS 활성화
ALTER TABLE crawled_regions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자에게 CRUD 허용
CREATE POLICY "Allow select for all" ON crawled_regions
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for all" ON crawled_regions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for all" ON crawled_regions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for all" ON crawled_regions
  FOR DELETE USING (true);
