"use client"

import { Check, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RegionItem } from "./RegionItem"
import type { ServerRegionInfo } from "@/lib/types"

interface RegionListProps {
  regions: string[]
  regionCounts: Record<string, number>
  serverRegions: Map<string, ServerRegionInfo>
  selectedRegions: Set<string>
  mode: "pending" | "completed"
  isUpdating: boolean
  onToggleRegion: (region: string) => void
  onToggleAll: () => void
  onToggleStatus: (region: string) => void
  onBulkUpdate: () => void
}

export function RegionList({
  regions,
  regionCounts,
  serverRegions,
  selectedRegions,
  mode,
  isUpdating,
  onToggleRegion,
  onToggleAll,
  onToggleStatus,
  onBulkUpdate,
}: RegionListProps) {
  const isPending = mode === "pending"
  const isAllSelected = regions.length > 0 && selectedRegions.size === regions.length

  if (regions.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8">
        {isPending ? "모든 지역이 완료 처리되었습니다" : "완료된 지역이 없습니다"}
      </p>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`select-all-bulk-${mode}`}
            checked={isAllSelected}
            onCheckedChange={onToggleAll}
          />
          <label
            htmlFor={`select-all-bulk-${mode}`}
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            전체 선택 ({regions.length}개)
          </label>
        </div>
        <Button
          onClick={onBulkUpdate}
          disabled={selectedRegions.size === 0 || isUpdating}
          className={
            isPending
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 bg-transparent"
          }
          variant={isPending ? "default" : "outline"}
        >
          {isPending ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <X className="w-4 h-4 mr-2" />
          )}
          {isUpdating
            ? "처리 중..."
            : `선택 ${isPending ? "완료" : "미완료"} 처리 (${selectedRegions.size}개)`}
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
        {regions.map((region) => (
          <RegionItem
            key={region}
            region={region}
            count={regionCounts[region] || 0}
            isSelected={selectedRegions.has(region)}
            isServerRegion={serverRegions.has(region)}
            mode={mode}
            isUpdating={isUpdating}
            onToggleSelect={() => onToggleRegion(region)}
            onToggleStatus={() => onToggleStatus(region)}
          />
        ))}
      </div>
    </>
  )
}
