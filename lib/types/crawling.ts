export type CrawledRegion = {
  id: string
  region_name: string
  /** 수요조사 기수. null = 기수 도입 이전 레거시 기록 */
  cohort: string | null
  is_crawled: boolean
  crawled_at: string | null
  created_at: string
}
