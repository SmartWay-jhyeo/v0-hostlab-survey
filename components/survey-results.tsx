"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  getSurveyResults,
  getAllServerRegions,
  deleteSurveysByRegions,
  getOptionStats,
  type SurveyResponse,
  type ServerRegionInfo,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

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
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState<"name" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [deleting, setDeleting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    const [surveyData, regionsData, statsData] = await Promise.all([
      getSurveyResults(),
      getAllServerRegions(),
      getOptionStats(),
    ])
    setSurveys(surveyData)
    setServerRegions(regionsData)
    setOptionStats(statsData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const serverRegionMap = new Map<string, ServerRegionInfo>()
  serverRegions.forEach((region) => {
    const key = `${region.city_name} ${region.district_name} ${region.neighborhood_name}`
    serverRegionMap.set(key, region)
  })

  const isServerRegion = (region: string) => serverRegionMap.has(region)
  const getRegionInfo = (region: string) => serverRegionMap.get(region)

  const regionCounts: Record<string, number> = {}
  surveys.forEach((survey) => {
    survey.selected_regions.forEach((region) => {
      regionCounts[region] = (regionCounts[region] || 0) + 1
    })
  })

  const sortedRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const allRegions = Object.keys(regionCounts).sort()

  const toggleRegion = (region: string) => {
    const newSelected = new Set(selectedRegions)
    if (newSelected.has(region)) {
      newSelected.delete(region)
    } else {
      newSelected.add(region)
    }
    setSelectedRegions(newSelected)
  }

  const toggleAll = () => {
    if (selectedRegions.size === allRegions.length) {
      setSelectedRegions(new Set())
    } else {
      setSelectedRegions(new Set(allRegions))
    }
  }

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
    const regionsToExport = selectedRegions.size > 0 ? Array.from(selectedRegions) : allRegions

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
    const regionsToDelete = selectedRegions.size > 0 ? Array.from(selectedRegions) : []

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
        setSelectedRegions(new Set())
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
              <p className="text-2xl font-bold text-gray-900">{surveys.length}명</p>
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
                {surveys.reduce((acc, s) => acc + s.selected_regions.length, 0)}개
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
            <p className="text-xl font-bold text-blue-900">{optionStats.option1}명</p>
            <p className="text-xs text-blue-500">서울 5개</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 mb-1">옵션 2</p>
            <p className="text-xl font-bold text-green-900">{optionStats.option2}명</p>
            <p className="text-xs text-green-500">경기/인천/지방 10개</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 mb-1">옵션 3</p>
            <p className="text-xl font-bold text-purple-900">{optionStats.option3}명</p>
            <p className="text-xs text-purple-500">서울 3개 + 지방 2개</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">미분류</p>
            <p className="text-xl font-bold text-gray-900">{optionStats.unknown}명</p>
            <p className="text-xs text-gray-500">이전 응답</p>
          </div>
        </div>
      </div>

      {/* 지역 선택 및 다운로드 */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">지역 선택 및 다운로드</h2>
            <p className="text-gray-500 text-sm">
              다운로드할 지역을 선택하세요. 선택하지 않으면 전체 지역이 다운로드됩니다.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3 text-green-600" />
                서버에 있는 지역
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                마지막 업데이트 시간
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDelete}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
              disabled={selectedRegions.size === 0 || deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "삭제 중..." : `삭제하기${selectedRegions.size > 0 ? ` (${selectedRegions.size}개)` : ""}`}
            </Button>
            <Button onClick={downloadCSV} className="bg-gray-900 hover:bg-gray-800 text-white">
              <Download className="w-4 h-4 mr-2" />
              CSV 다운로드
              {selectedRegions.size > 0 && ` (${selectedRegions.size}개)`}
            </Button>
          </div>
        </div>

        {allRegions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">아직 데이터가 없습니다</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <Checkbox
                id="select-all"
                checked={selectedRegions.size === allRegions.length}
                onCheckedChange={toggleAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer">
                전체 선택 ({allRegions.length}개)
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
              {allRegions.map((region) => {
                const regionInfo = getRegionInfo(region)
                const isInServer = isServerRegion(region)

                return (
                  <div
                    key={region}
                    className={`flex flex-col gap-1 p-3 rounded border cursor-pointer transition-colors ${
                      selectedRegions.has(region)
                        ? "border-gray-900 bg-gray-50"
                        : isInServer
                          ? "border-green-200 bg-green-50/50 hover:border-green-300"
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleRegion(region)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={selectedRegions.has(region)} onCheckedChange={() => toggleRegion(region)} />
                      <span className="text-sm text-gray-700 truncate flex-1">{region}</span>
                      <span className="text-xs text-gray-400">{regionCounts[region]}표</span>
                    </div>
                    {isInServer && regionInfo && (
                      <div className="flex items-center gap-1 ml-6 text-xs text-green-600">
                        <Database className="w-3 h-3" />
                        <span>서버 지역</span>
                        <span className="text-gray-400 ml-1">· {formatLastCrawled(regionInfo.last_crawled_at)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
