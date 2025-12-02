-- region_demand_surveys 테이블에 UPDATE, DELETE 권한 추가
-- 기존 RLS 정책을 유지하면서 관리자용 UPDATE/DELETE 정책 추가

-- 기존 UPDATE 정책이 있으면 삭제
DROP POLICY IF EXISTS "Enable update for all users" ON region_demand_surveys;

-- 기존 DELETE 정책이 있으면 삭제  
DROP POLICY IF EXISTS "Enable delete for all users" ON region_demand_surveys;

-- UPDATE 정책 추가 (모든 사용자가 업데이트 가능)
CREATE POLICY "Enable update for all users" ON region_demand_surveys
FOR UPDATE USING (true) WITH CHECK (true);

-- DELETE 정책 추가 (모든 사용자가 삭제 가능)
CREATE POLICY "Enable delete for all users" ON region_demand_surveys
FOR DELETE USING (true);
