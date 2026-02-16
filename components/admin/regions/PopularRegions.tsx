"use client"

import { Database } from "lucide-react"
import type { ServerRegionInfo } from "@/lib/types"

interface PopularRegionsProps {
  regionCounts: Record<string, number>
  serverRegions: Map<string, ServerRegionInfo>
}

function formatLastCrawled(dateStr: string | null) {
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

export function PopularRegions({ regionCounts, serverRegions }: PopularRegionsProps) {
  const sortedRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">인기 지역 TOP 10</h2>
      <p className="text-gray-500 text-sm mb-6">가장 많이 선택된 지역 순위입니다</p>

      {sortedRegions.length === 0 ? (
        <p className="text-center text-gray-400 py-8">아직 데이터가 없습니다</p>
      ) : (
        <div className="space-y-3">
          {sortedRegions.map(([region, count], index) => {
            const isInServer = serverRegions.has(region)
            const regionInfo = serverRegions.get(region)

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
  )
}
