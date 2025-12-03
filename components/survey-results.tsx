"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getSurveyResults,
  getAllServerRegions,
  deleteSurveysByRegions,
  getOptionStats,
  deleteSurveyById,
  updateSurveyRegions,
  getCrawledRegions,
  toggleRegionCrawlStatus,
  bulkUpdateCrawlStatus,
  type SurveyResponse,
  type ServerRegionInfo,
  type CrawledRegion,
} from "@/lib/actions/survey"
import {
  Users,
  MapPin,
  BarChart3,
  RefreshCw,
  Download,
  ArrowUpDown,
  Database,
  Clock,
  Trash2,
  PieChart,
  Pencil,
  X,
  Check,
  CircleDot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const OPTION_NAMES: Record<number, string> = {
  1: "서울 5개",
  2: "경기/인천/지방 10개",
  3: "서울 3개 + 지방 2개",
}

export function SurveyResults() {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([])
  const [serverRegions, setServerRegions] = useState<ServerRegionInfo[]>([])
  const [optionStats, setOptionStats] = useState({ option1: 0, option2: 0, option3: 0, unknown: 0 })
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<"name" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [deleting, setDeleting] = useState(false)

  // 개별 응답 수정/삭제 관련 state
  const [editingSurvey, setEditingSurvey] = useState<SurveyResponse | null>(null)
  const [editingRegions, setEditingRegions] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  // 크롤링 상태 관련 state
  const [crawledRegionsMap, setCrawledRegionsMap] = useState<Map<string, boolean>>(new Map())
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending")
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set())
  const [isUpdatingCrawl, setIsUpdatingCrawl] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [surveyData, regionsData, statsData, crawlData] = await Promise.all([
      getSurveyResults(),
      getAllServerRegions(),
      getOptionStats(),
      getCrawledRegions(),
    ])
    setSurveys(surveyData)
    setServerRegions(regionsData)
    setOptionStats(statsData)

    // 크롤링 상태 Map 생성
    const crawlMap = new Map<string, boolean>()
    crawlData.forEach((item: CrawledRegion) => {
      crawlMap.set(item.region_name, item.is_crawled)
    })
    setCrawledRegionsMap(crawlMap)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 중복 제거된 사용자 목록 생성 (이름+기수 기준)
  const uniqueUsersMap = new Map<string, SurveyResponse>()
  surveys.forEach((survey) => {
    const key = `${survey.user_name}-${survey.cohort}`
    // 최신 응답이 우선하도록 (날짜 정렬이 되어있다고 가정하거나, 날짜 비교)
    if (
      !uniqueUsersMap.has(key) ||
      new Date(survey.created_at) > new Date(uniqueUsersMap.get(key)!.created_at)
    ) {
      uniqueUsersMap.set(key, survey)
    }
  })
  const uniqueSurveys = Array.from(uniqueUsersMap.values())

  const serverRegionMap = new Map<string, ServerRegionInfo>()
  serverRegions.forEach((region) => {
    const key = `${region.city_name} ${region.district_name} ${region.neighborhood_name}`
    serverRegionMap.set(key, region)
  })

  const isServerRegion = (region: string) => serverRegionMap.has(region)
  const getRegionInfo = (region: string) => serverRegionMap.get(region)

  const regionCounts: Record<string, number> = {}
  // 중복 제거된 설문 기준으로 지역 카운트 집계
  uniqueSurveys.forEach((survey) => {
    survey.selected_regions.forEach((region) => {
      regionCounts[region] = (regionCounts[region] || 0) + 1
    })
  })

  // 옵션 통계도 중복 제거된 데이터 기준으로 재계산
  const currentOptionStats = { option1: 0, option2: 0, option3: 0, unknown: 0 }
  uniqueSurveys.forEach((s) => {
    if (s.option_type === 1) currentOptionStats.option1++
    else if (s.option_type === 2) currentOptionStats.option2++
    else if (s.option_type === 3) currentOptionStats.option3++
    else currentOptionStats.unknown++
  })

  const sortedRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const allRegions = Object.keys(regionCounts).sort()

  const sortedSurveys = [...surveys].sort((a, b) => {
    if (sortOrder === "name") {
      const compare = a.user_name.localeCompare(b.user_name, "ko")
      return sortDirection === "asc" ? compare : -compare
    } else {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    }
  })

  const toggleSort = (field: "name" | "date") => {
    if (sortOrder === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortOrder(field)
      setSortDirection("asc")
    }
  }

  const downloadCSV = () => {
    const regionsToExport = selectedForBulk.size > 0 ? Array.from(selectedForBulk) : currentTabRegions

    if (regionsToExport.length === 0) {
      alert("다운로드할 지역이 없습니다.")
      return
    }

    const headers = ["시/도", "시/군/구", "읍/면/동"]

    const rows = regionsToExport.map((region) => {
      const parts = region.split(" ")
      const city = parts[0] || ""
      const district = parts[1] || ""
      const neighborhood = parts.slice(2).join(" ") || ""
      return [city, district, neighborhood]
    })

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `수요조사_지역목록_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    const regionsToDelete = selectedForBulk.size > 0 ? Array.from(selectedForBulk) : []

    if (regionsToDelete.length === 0) {
      alert("삭제할 지역을 선택해주세요.")
      return
    }

    const confirmed = window.confirm(
      `선택한 ${regionsToDelete.length}개 지역을 포함한 설문 결과를 삭제하시겠습니까?\n\n삭제된 지역:\n${regionsToDelete.slice(0, 5).join("\n")}${regionsToDelete.length > 5 ? `\n... 외 ${regionsToDelete.length - 5}개` : ""}`,
    )

    if (!confirmed) return

    setDeleting(true)
    try {
      const result = await deleteSurveysByRegions(regionsToDelete)

      if (result.success) {
        alert(`${result.deletedCount}개의 설문이 수정/삭제되었습니다.`)
        setSelectedForBulk(new Set())
        await fetchData()
      } else {
        alert(`삭제 중 오류가 발생했습니다: ${result.error}`)
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.")
    } finally {
      setDeleting(false)
    }
  }

  // 개별 응답 삭제
  const handleDeleteSurvey = async (survey: SurveyResponse) => {
    const confirmed = window.confirm(
      `${survey.user_name}(${survey.cohort})님의 응답을 삭제하시겠습니까?\n\n선택 지역:\n${survey.selected_regions.slice(0, 3).join("\n")}${survey.selected_regions.length > 3 ? `\n... 외 ${survey.selected_regions.length - 3}개` : ""}`,
    )

    if (!confirmed) return

    setIsUpdating(true)
    try {
      const result = await deleteSurveyById(survey.id)
      if (result.success) {
        await fetchData()
      } else {
        alert(`삭제 중 오류가 발생했습니다: ${result.error}`)
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.")
    } finally {
      setIsUpdating(false)
    }
  }

  // 수정 모달 열기
  const openEditModal = (survey: SurveyResponse) => {
    setEditingSurvey(survey)
    setEditingRegions([...survey.selected_regions])
  }

  // 수정 모달 닫기
  const closeEditModal = () => {
    setEditingSurvey(null)
    setEditingRegions([])
  }

  // 수정에서 지역 삭제
  const removeEditingRegion = (region: string) => {
    setEditingRegions(editingRegions.filter((r) => r !== region))
  }

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingSurvey) return

    if (editingRegions.length === 0) {
      const confirmed = window.confirm(
        "모든 지역이 삭제되었습니다. 이 응답 자체를 삭제하시겠습니까?",
      )
      if (!confirmed) return
    }

    setIsUpdating(true)
    try {
      const result = await updateSurveyRegions(editingSurvey.id, editingRegions)
      if (result.success) {
        closeEditModal()
        await fetchData()
      } else {
        alert(`수정 중 오류가 발생했습니다: ${result.error}`)
      }
    } catch (error) {
      alert("수정 중 오류가 발생했습니다.")
    } finally {
      setIsUpdating(false)
    }
  }

  const formatLastCrawled = (dateStr: string | null) => {
    if (!dateStr) return "정보 없음"
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "오늘"
    if (diffDays === 1) return "어제"
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
    return date.toLocaleDateString("ko-KR")
  }

  // 크롤링 완료/미완료 지역 분류
  const completedRegions = allRegions.filter((r) => crawledRegionsMap.get(r) === true)
  const pendingRegions = allRegions.filter((r) => crawledRegionsMap.get(r) !== true)

  // 현재 탭의 지역 목록
  const currentTabRegions = activeTab === "completed" ? completedRegions : pendingRegions

  // 일괄 선택 토글
  const toggleBulkRegion = (region: string) => {
    const newSelected = new Set(selectedForBulk)
    if (newSelected.has(region)) {
      newSelected.delete(region)
    } else {
      newSelected.add(region)
    }
    setSelectedForBulk(newSelected)
  }

  const toggleAllBulk = () => {
    if (selectedForBulk.size === currentTabRegions.length) {
      setSelectedForBulk(new Set())
    } else {
      setSelectedForBulk(new Set(currentTabRegions))
    }
  }

  // 단일 지역 크롤링 상태 토글
  const handleToggleCrawlStatus = async (region: string) => {
    setIsUpdatingCrawl(true)
    try {
      const result = await toggleRegionCrawlStatus(region)
      if (result.success) {
        // 로컬 상태 업데이트
        const newMap = new Map(crawledRegionsMap)
        newMap.set(region, result.isCrawled)
        setCrawledRegionsMap(newMap)
        setSelectedForBulk(new Set()) // 선택 초기화
      }
    } catch (error) {
      alert("상태 변경 중 오류가 발생했습니다.")
    } finally {
      setIsUpdatingCrawl(false)
    }
  }

  // 일괄 크롤링 상태 변경
  const handleBulkUpdateCrawlStatus = async (isCrawled: boolean) => {
    if (selectedForBulk.size === 0) {
      alert("지역을 선택해주세요.")
      return
    }

    setIsUpdatingCrawl(true)
    try {
      const result = await bulkUpdateCrawlStatus(Array.from(selectedForBulk), isCrawled)
      if (result.success) {
        // 로컬 상태 업데이트
        const newMap = new Map(crawledRegionsMap)
        selectedForBulk.forEach((region) => {
          newMap.set(region, isCrawled)
        })
        setCrawledRegionsMap(newMap)
        setSelectedForBulk(new Set())
      }
    } catch (error) {
      alert("일괄 상태 변경 중 오류가 발생했습니다.")
    } finally {
      setIsUpdatingCrawl(false)
    }
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
      {/* 새로고침 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Users className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 참여자</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueSurveys.length}명</p>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <MapPin className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">선택된 지역</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(regionCounts).length}개</p>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">총 투표 수</p>
              <p className="text-2xl font-bold text-gray-900">
                {uniqueSurveys.reduce((acc, s) => acc + s.selected_regions.length, 0)}개
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">옵션별 통계</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">옵션 1</p>
            <p className="text-xl font-bold text-blue-900">{currentOptionStats.option1}명</p>
            <p className="text-xs text-blue-500">서울 5개</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 mb-1">옵션 2</p>
            <p className="text-xl font-bold text-green-900">{currentOptionStats.option2}명</p>
            <p className="text-xs text-green-500">경기/인천/지방 10개</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 mb-1">옵션 3</p>
            <p className="text-xl font-bold text-purple-900">{currentOptionStats.option3}명</p>
            <p className="text-xs text-purple-500">서울 3개 + 지방 2개</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">미분류</p>
            <p className="text-xl font-bold text-gray-900">{currentOptionStats.unknown}명</p>
            <p className="text-xs text-gray-500">이전 응답</p>
          </div>
        </div>
      </div>

      {/* 크롤링 상태 관리 */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CircleDot className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">크롤링 상태 관리</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDelete}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
              disabled={selectedForBulk.size === 0 || deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "삭제 중..." : `삭제하기${selectedForBulk.size > 0 ? ` (${selectedForBulk.size}개)` : ""}`}
            </Button>
            <Button onClick={downloadCSV} className="bg-gray-900 hover:bg-gray-800 text-white">
              <Download className="w-4 h-4 mr-2" />
              CSV 다운로드
              {selectedForBulk.size > 0 ? ` (${selectedForBulk.size}개)` : ` (${currentTabRegions.length}개)`}
            </Button>
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-4">
          크롤링이 완료된 지역을 관리합니다. 선택 후 삭제하거나 CSV로 다운로드할 수 있습니다.
        </p>

        {allRegions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">아직 데이터가 없습니다</p>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "pending" | "completed"); setSelectedForBulk(new Set()) }}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                미완료 ({pendingRegions.length}개)
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                완료 ({completedRegions.length}개)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingRegions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">모든 지역이 완료 처리되었습니다</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all-bulk-pending"
                        checked={selectedForBulk.size === pendingRegions.length && pendingRegions.length > 0}
                        onCheckedChange={toggleAllBulk}
                      />
                      <label htmlFor="select-all-bulk-pending" className="text-sm font-medium text-gray-700 cursor-pointer">
                        전체 선택 ({pendingRegions.length}개)
                      </label>
                    </div>
                    <Button
                      onClick={() => handleBulkUpdateCrawlStatus(true)}
                      disabled={selectedForBulk.size === 0 || isUpdatingCrawl}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isUpdatingCrawl ? "처리 중..." : `선택 완료 처리 (${selectedForBulk.size}개)`}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {pendingRegions.map((region) => {
                      const isInServer = isServerRegion(region)
                      return (
                        <div
                          key={region}
                          className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                            selectedForBulk.has(region)
                              ? "border-gray-900 bg-gray-50"
                              : isInServer
                                ? "border-green-200 bg-green-50/50 hover:border-green-300"
                                : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => toggleBulkRegion(region)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Checkbox checked={selectedForBulk.has(region)} onCheckedChange={() => toggleBulkRegion(region)} />
                            <span className="text-sm text-gray-700 truncate">{region}</span>
                            <span className="text-xs text-gray-400">{regionCounts[region]}표</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => { e.stopPropagation(); handleToggleCrawlStatus(region) }}
                            disabled={isUpdatingCrawl}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {completedRegions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">완료된 지역이 없습니다</p>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all-bulk-completed"
                        checked={selectedForBulk.size === completedRegions.length && completedRegions.length > 0}
                        onCheckedChange={toggleAllBulk}
                      />
                      <label htmlFor="select-all-bulk-completed" className="text-sm font-medium text-gray-700 cursor-pointer">
                        전체 선택 ({completedRegions.length}개)
                      </label>
                    </div>
                    <Button
                      onClick={() => handleBulkUpdateCrawlStatus(false)}
                      disabled={selectedForBulk.size === 0 || isUpdatingCrawl}
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 bg-transparent"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {isUpdatingCrawl ? "처리 중..." : `선택 미완료 처리 (${selectedForBulk.size}개)`}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                    {completedRegions.map((region) => {
                      const isInServer = isServerRegion(region)
                      return (
                        <div
                          key={region}
                          className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                            selectedForBulk.has(region)
                              ? "border-gray-900 bg-gray-50"
                              : "border-green-300 bg-green-50 hover:border-green-400"
                          }`}
                          onClick={() => toggleBulkRegion(region)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Checkbox checked={selectedForBulk.has(region)} onCheckedChange={() => toggleBulkRegion(region)} />
                            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{region}</span>
                            <span className="text-xs text-gray-400">{regionCounts[region]}표</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={(e) => { e.stopPropagation(); handleToggleCrawlStatus(region) }}
                            disabled={isUpdatingCrawl}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 인기 지역 TOP 10 */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">인기 지역 TOP 10</h2>
        <p className="text-gray-500 text-sm mb-6">가장 많이 선택된 지역 순위입니다</p>

        {sortedRegions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">아직 데이터가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {sortedRegions.map(([region, count], index) => {
              const isInServer = isServerRegion(region)
              const regionInfo = getRegionInfo(region)

              return (
                <div key={region} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0
                        ? "bg-gray-900 text-white"
                        : index === 1
                          ? "bg-gray-700 text-white"
                          : index === 2
                            ? "bg-gray-500 text-white"
                            : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{region}</span>
                        {isInServer && (
                          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                            <Database className="w-3 h-3" />
                            {regionInfo && formatLastCrawled(regionInfo.last_crawled_at)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{count}표</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: `${(count / sortedRegions[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 전체 응답 목록 */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">전체 응답 목록</h2>
        <p className="text-gray-500 text-sm mb-6">모든 참여자의 응답을 확인하세요</p>

        {surveys.length === 0 ? (
          <p className="text-center text-gray-400 py-8">아직 응답이 없습니다</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead
                    className="text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      이름
                      <ArrowUpDown className={`w-4 h-4 ${sortOrder === "name" ? "text-gray-900" : "text-gray-400"}`} />
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-600">기수</TableHead>
                  <TableHead className="text-gray-600">옵션</TableHead>
                  <TableHead className="text-gray-600">선택 지역</TableHead>
                  <TableHead
                    className="text-gray-600 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      제출 시간
                      <ArrowUpDown className={`w-4 h-4 ${sortOrder === "date" ? "text-gray-900" : "text-gray-400"}`} />
                    </div>
                  </TableHead>
                  <TableHead className="text-gray-600 text-center">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSurveys.map((survey) => (
                  <TableRow key={survey.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">{survey.user_name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">{survey.cohort}</span>
                    </TableCell>
                    <TableCell>
                      {survey.option_type ? (
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            survey.option_type === 1
                              ? "bg-blue-100 text-blue-700"
                              : survey.option_type === 2
                                ? "bg-green-100 text-green-700"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {OPTION_NAMES[survey.option_type]}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">미분류</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {survey.selected_regions.map((region) => {
                          const isInServer = isServerRegion(region)
                          return (
                            <span
                              key={region}
                              className={`px-2 py-0.5 rounded text-xs ${
                                isInServer
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                              title={isInServer ? "서버에 있는 지역" : "직접 입력한 지역"}
                            >
                              {isInServer && <Database className="w-3 h-3 inline mr-1" />}
                              {region}
                            </span>
                          )
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(survey.created_at).toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => openEditModal(survey)}
                          disabled={isUpdating}
                          title="수정"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteSurvey(survey)}
                          disabled={isUpdating}
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 수정 모달 */}
      {editingSurvey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">응답 수정</h3>
                <p className="text-sm text-gray-500">
                  {editingSurvey.user_name} ({editingSurvey.cohort})
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={closeEditModal}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <p className="text-sm text-gray-600 mb-3">
                삭제할 지역의 X 버튼을 클릭하세요. ({editingRegions.length}개 선택됨)
              </p>
              {editingRegions.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  모든 지역이 삭제되었습니다.
                  <br />
                  저장하면 이 응답이 삭제됩니다.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {editingRegions.map((region) => {
                    const isInServer = isServerRegion(region)
                    return (
                      <div
                        key={region}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                          isInServer
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {isInServer && <Database className="w-3 h-3" />}
                        <span>{region}</span>
                        <button
                          onClick={() => removeEditingRegion(region)}
                          className="ml-1 hover:text-red-600 transition-colors"
                          title="이 지역 삭제"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
              <Button variant="outline" onClick={closeEditModal} disabled={isUpdating}>
                취소
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={isUpdating}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isUpdating ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
