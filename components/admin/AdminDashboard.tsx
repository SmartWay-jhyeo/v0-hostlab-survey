"use client"

import { useState, useMemo } from "react"
import { RefreshCw, Archive } from "lucide-react"
import { useSurveyData } from "./hooks"
import { SummaryStats, OptionStats } from "./stats"
import { CrawlingStatusManager } from "./crawling"
import { PopularRegions } from "./regions"
import { ResponseTable } from "./responses"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { archiveCohort } from "@/lib/actions/survey"

export function AdminDashboard() {
  const {
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
    refetch,
    getArchivedSurveys,
  } = useSurveyData()

  const [selectedArchivedCohort, setSelectedArchivedCohort] = useState<string>("")
  const [archiving, setArchiving] = useState(false)

  // 마무리된 기수 데이터
  const archivedSurveys = useMemo(() => {
    if (!selectedArchivedCohort) return []
    return getArchivedSurveys(selectedArchivedCohort)
  }, [selectedArchivedCohort, getArchivedSurveys])

  // 마무리된 기수의 uniqueSurveys 계산
  const archivedUniqueSurveys = useMemo(() => {
    const uniqueUsersMap = new Map()
    archivedSurveys.forEach((survey) => {
      const key = `${survey.user_name}-${survey.cohort}`
      if (
        !uniqueUsersMap.has(key) ||
        new Date(survey.created_at) > new Date(uniqueUsersMap.get(key).created_at)
      ) {
        uniqueUsersMap.set(key, survey)
      }
    })
    return Array.from(uniqueUsersMap.values())
  }, [archivedSurveys])

  // 마무리된 기수의 지역별 카운트
  const archivedRegionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    archivedUniqueSurveys.forEach((survey) => {
      survey.selected_regions.forEach((region: string) => {
        counts[region] = (counts[region] || 0) + 1
      })
    })
    return counts
  }, [archivedUniqueSurveys])

  const handleArchiveCohort = async (cohort: string) => {
    if (!cohort) return
    if (!confirm(`"${cohort}" 기수를 마무리하시겠습니까?\n마무리된 기수는 현재 기수 탭에서 숨겨집니다.`)) {
      return
    }

    setArchiving(true)
    const result = await archiveCohort(cohort)
    if (result.success) {
      await refetch()
    } else {
      alert(`마무리 실패: ${result.error}`)
    }
    setArchiving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="active">현재 기수</TabsTrigger>
          <TabsTrigger value="archived">마무리된 기수</TabsTrigger>
        </TabsList>

        {/* 현재 기수 탭 */}
        <TabsContent value="active" className="space-y-6">
          {/* Archive Dropdown */}
          {activeCohorts.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Archive className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">기수 마무리:</span>
              <Select
                onValueChange={handleArchiveCohort}
                disabled={archiving}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="기수 선택" />
                </SelectTrigger>
                <SelectContent>
                  {activeCohorts.map((cohort) => (
                    <SelectItem key={cohort} value={cohort}>
                      {cohort}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {archiving && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
          )}

          {/* Summary Stats */}
          <SummaryStats uniqueSurveys={uniqueSurveys} regionCounts={regionCounts} />

          {/* Option Stats */}
          <OptionStats uniqueSurveys={uniqueSurveys} />

          {/* Crawling Status Manager */}
          <CrawlingStatusManager
            regionCounts={regionCounts}
            crawledRegions={crawledRegions}
            setCrawledRegions={setCrawledRegions}
            serverRegions={serverRegions}
            onRefresh={refetch}
          />

          {/* Popular Regions */}
          <PopularRegions regionCounts={regionCounts} serverRegions={serverRegions} />

          {/* Response Table */}
          <ResponseTable
            surveys={activeSurveys}
            serverRegions={serverRegions}
            onUpdate={refetch}
          />
        </TabsContent>

        {/* 마무리된 기수 탭 */}
        <TabsContent value="archived" className="space-y-6">
          {archivedCohorts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              마무리된 기수가 없습니다.
            </div>
          ) : (
            <>
              {/* Archived Cohort Selector */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600">기수 선택:</span>
                <Select
                  value={selectedArchivedCohort}
                  onValueChange={setSelectedArchivedCohort}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="기수 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {archivedCohorts.map((cohort) => (
                      <SelectItem key={cohort} value={cohort}>
                        {cohort}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedArchivedCohort ? (
                <>
                  {/* Summary Stats */}
                  <SummaryStats uniqueSurveys={archivedUniqueSurveys} regionCounts={archivedRegionCounts} />

                  {/* Option Stats */}
                  <OptionStats uniqueSurveys={archivedUniqueSurveys} />

                  {/* Response Table (Read-only) */}
                  <ResponseTable
                    surveys={archivedSurveys}
                    serverRegions={serverRegions}
                    onUpdate={refetch}
                    readOnly
                  />
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  조회할 기수를 선택해주세요.
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
