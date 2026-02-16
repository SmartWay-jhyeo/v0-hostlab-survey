"use client"

import { useState } from "react"
import { CircleDot, Trash2, Download, Clock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RegionList } from "./RegionList"
import { useBulkSelection, useCrawlingStatus } from "../hooks"
import type { ServerRegionInfo } from "@/lib/types"

interface CrawlingStatusManagerProps {
  regionCounts: Record<string, number>
  crawledRegions: Map<string, boolean>
  setCrawledRegions: React.Dispatch<React.SetStateAction<Map<string, boolean>>>
  serverRegions: Map<string, ServerRegionInfo>
  onRefresh: () => void
}

export function CrawlingStatusManager({
  regionCounts,
  crawledRegions,
  setCrawledRegions,
  serverRegions,
  onRefresh,
}: CrawlingStatusManagerProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending")

  const { selected, toggle, toggleAll, clear, isAllSelected } = useBulkSelection<string>()

  const {
    isUpdating,
    isDeleting,
    handleToggleStatus,
    handleBulkUpdate,
    handleDelete,
    downloadCSV,
  } = useCrawlingStatus({
    onRefresh,
    clearSelection: clear,
    crawledRegions,
    setCrawledRegions,
  })

  const allRegions = Object.keys(regionCounts).sort()
  const pendingRegions = allRegions.filter((r) => crawledRegions.get(r) !== true)
  const completedRegions = allRegions.filter((r) => crawledRegions.get(r) === true)
  const currentTabRegions = activeTab === "pending" ? pendingRegions : completedRegions

  const handleTabChange = (value: string) => {
    setActiveTab(value as "pending" | "completed")
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
        크롤링이 완료된 지역을 관리합니다. 선택 후 삭제하거나 CSV로 다운로드할 수 있습니다.
      </p>

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
