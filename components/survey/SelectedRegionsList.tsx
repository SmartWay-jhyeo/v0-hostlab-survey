"use client"

import { MapPin, X } from "lucide-react"
import { isSeoulRegion } from "@/lib/region-utils"

interface SelectedRegionsListProps {
  regions: string[]
  existingCount: number
  maxTotal: number
  onRemove: (region: string) => void
}

export function SelectedRegionsList({
  regions,
  existingCount,
  maxTotal,
  onRemove,
}: SelectedRegionsListProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">선택된 지역</h2>
          <p className="text-gray-500 text-sm">
            {regions.length}개 선택
            {existingCount > 0 && (
              <span className="text-gray-400 ml-1">
                (기존 {existingCount}개 + 신규 {regions.length}개 = 총{" "}
                {existingCount + regions.length}/{maxTotal}개)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[48px]">
        {regions.length === 0 ? (
          <span className="text-gray-400 text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            선택된 지역이 없습니다
          </span>
        ) : (
          regions.map((region, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
                isSeoulRegion(region)
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {region}
              <button
                onClick={() => onRemove(region)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}
