"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleDot, Trash2, Download, Clock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RegionList } from "./RegionList"
import { useBulkSelection, useCrawlingStatus } from "../hooks"
import { crawlStatusKey } from "@/lib/region-utils"
import type { ServerRegionInfo, SurveyResponse } from "@/lib/types"

interface CrawlingStatusManagerProps {
  /** 중복 제거된 활성 기수 응답 (이름+기수 기준) */
  uniqueSurveys: SurveyResponse[]
  activeCohorts: string[]
  /** key = `${cohort}::${region}` */
  crawledRegions: Map<string, boolean>
  setCrawledRegions: React.Dispatch<React.SetStateAction<Map<string, boolean>>>
  serverRegions: Map<string, ServerRegionInfo>
  onRefresh: () => void
}

export function CrawlingStatusManager({
  uniqueSurveys,
  activeCohorts,
  crawledRegions,
  setCrawledRegions,
  serverRegions,
  onRefresh,
}: CrawlingStatusManagerProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending")
  const [cohort, setCohort] = useState<string>(activeCohorts[0] ?? "")

  // 기수 목록이 바뀌면(마무리 등) 선택값 보정
  useEffect(() => {
    if (!activeCohorts.includes(cohort)) setCohort(activeCohorts[0] ?? "")
  }, [activeCohorts, cohort])

  const { selected, toggle, toggleAll, clear } = useBulkSelection<string>()

  const {
    isUpdating,
    isDeleting,
    handleToggleStatus,
    handleBulkUpdate,
    handleDelete,
    downloadCSV,
  } = useCrawlingStatus({
    cohort,
    onRefresh,
    clearSelection: clear,
    crawledRegions,
    setCrawledRegions,
  })

  // 선택한 기수의 지역별 표 수
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    uniqueSurveys
      .filter((s) => s.cohort === cohort)
      .forEach((s) => {
        s.selected_regions.forEach((region) => {
          counts[region] = (counts[region] || 0) + 1
        })
      })
    return counts
  }, [uniqueSurveys, cohort])

  const allRegions = Object.keys(regionCounts).sort()
  const isCrawled = (r: string) => crawledRegions.get(crawlStatusKey(cohort, r)) === true
  const pendingRegions = allRegions.filter((r) => !isCrawled(r))
  const completedRegions = allRegions.filter(isCrawled)
  const currentTabRegions = activeTab === "pending" ? pendingRegions : completedRegions

  const handleTabChange = (value: string) => {
    setActiveTab(value as "pending" | "completed")
    clear()
  }

  const handleCohortChange = (value: string) => {
    setCohort(value)
    clear()
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CircleDot className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">크롤링 상태 관리</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleDelete(Array.from(selected))}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
            disabled={selected.size === 0 || isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting
              ? "삭제 중..."
              : `삭제하기${selected.size > 0 ? ` (${selected.size}개)` : ""}`}
          </Button>
          <Button
            onClick={() =>
              downloadCSV(selected.size > 0 ? Array.from(selected) : currentTabRegions)
            }
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV 다운로드
            {selected.size > 0 ? ` (${selected.size}개)` : ` (${currentTabRegions.length}개)`}
          </Button>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-4">
        크롤링 완료 여부는 기수별로 관리됩니다. 기수를 선택한 뒤 완료/미완료 처리, 삭제, CSV 다운로드를 할 수 있습니다.
      </p>

      {activeCohorts.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">기수:</span>
          <Select value={cohort} onValueChange={handleCohortChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="기수 선택" />
            </SelectTrigger>
            <SelectContent>
              {activeCohorts.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {allRegions.length === 0 ? (
        <p className="text-center text-gray-400 py-8">아직 데이터가 없습니다</p>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
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
            <RegionList
              regions={pendingRegions}
              regionCounts={regionCounts}
              serverRegions={serverRegions}
              selectedRegions={selected}
              mode="pending"
              isUpdating={isUpdating}
              onToggleRegion={toggle}
              onToggleAll={() => toggleAll(pendingRegions)}
              onToggleStatus={handleToggleStatus}
              onBulkUpdate={() => handleBulkUpdate(Array.from(selected), true)}
            />
          </TabsContent>

          <TabsContent value="completed">
            <RegionList
              regions={completedRegions}
              regionCounts={regionCounts}
              serverRegions={serverRegions}
              selectedRegions={selected}
              mode="completed"
              isUpdating={isUpdating}
              onToggleRegion={toggle}
              onToggleAll={() => toggleAll(completedRegions)}
              onToggleStatus={handleToggleStatus}
              onBulkUpdate={() => handleBulkUpdate(Array.from(selected), false)}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
