"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  getSurveyResults,
  getAllServerRegions,
  getCrawledRegions,
  getArchivedCohorts,
} from "@/lib/actions/survey"
import type { SurveyResponse, ServerRegionInfo, CrawledRegion } from "@/lib/types"

export function useSurveyData() {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([])
  const [serverRegions, setServerRegions] = useState<Map<string, ServerRegionInfo>>(new Map())
  const [crawledRegions, setCrawledRegions] = useState<Map<string, boolean>>(new Map())
  const [archivedCohorts, setArchivedCohorts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [surveyData, regionsData, crawlData, archivedData] = await Promise.all([
      getSurveyResults(),
      getAllServerRegions(),
      getCrawledRegions(),
      getArchivedCohorts(),
    ])

    setSurveys(surveyData)
    setArchivedCohorts(archivedData)

    const regionMap = new Map<string, ServerRegionInfo>()
    regionsData.forEach((r) => {
      regionMap.set(`${r.city_name} ${r.district_name} ${r.neighborhood_name}`, r)
    })
    setServerRegions(regionMap)

    const crawlMap = new Map<string, boolean>()
    crawlData.forEach((item: CrawledRegion) => {
      crawlMap.set(item.region_name, item.is_crawled)
    })
    setCrawledRegions(crawlMap)

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 활성 기수 서베이 (마무리되지 않은 기수만)
  const activeSurveys = useMemo(() => {
    return surveys.filter((survey) => !archivedCohorts.includes(survey.cohort))
  }, [surveys, archivedCohorts])

  // 중복 제거된 활성 사용자 목록 (이름+기수 기준)
  const uniqueSurveys = useMemo(() => {
    const uniqueUsersMap = new Map<string, SurveyResponse>()
    activeSurveys.forEach((survey) => {
      const key = `${survey.user_name}-${survey.cohort}`
      if (
        !uniqueUsersMap.has(key) ||
        new Date(survey.created_at) > new Date(uniqueUsersMap.get(key)!.created_at)
      ) {
        uniqueUsersMap.set(key, survey)
      }
    })
    return Array.from(uniqueUsersMap.values())
  }, [activeSurveys])

  // 지역별 카운트 (활성 기수만)
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    uniqueSurveys.forEach((survey) => {
      survey.selected_regions.forEach((region) => {
        counts[region] = (counts[region] || 0) + 1
      })
    })
    return counts
  }, [uniqueSurveys])

  // 특정 기수의 서베이 가져오기 (마무리된 기수 조회용)
  const getArchivedSurveys = useCallback((cohort: string) => {
    return surveys.filter((survey) => survey.cohort === cohort)
  }, [surveys])

  // 활성(마무리 안 된) 기수 목록
  const activeCohorts = useMemo(() => {
    const cohorts = new Set<string>()
    activeSurveys.forEach((survey) => cohorts.add(survey.cohort))
    return Array.from(cohorts).sort()
  }, [activeSurveys])

  return {
    surveys,
    activeSurveys,
    serverRegions,
    crawledRegions,
    setCrawledRegions,
    archivedCohorts,
    activeCohorts,
    uniqueSurveys,
    regionCounts,
    loading,
    refetch: fetchData,
    getArchivedSurveys,
  }
}
