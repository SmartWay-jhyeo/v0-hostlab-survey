"use client"

import { Users, MapPin, BarChart3, LucideIcon } from "lucide-react"
import type { SurveyResponse } from "@/lib/types"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
}

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="w-6 h-6 text-gray-700" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

interface SummaryStatsProps {
  uniqueSurveys: SurveyResponse[]
  regionCounts: Record<string, number>
}

export function SummaryStats({ uniqueSurveys, regionCounts }: SummaryStatsProps) {
  const totalVotes = uniqueSurveys.reduce(
    (acc, s) => acc + s.selected_regions.length,
    0
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        icon={Users}
        label="총 참여자"
        value={`${uniqueSurveys.length}명`}
      />
      <StatCard
        icon={MapPin}
        label="선택된 지역"
        value={`${Object.keys(regionCounts).length}개`}
      />
      <StatCard
        icon={BarChart3}
        label="총 투표 수"
        value={`${totalVotes}개`}
      />
    </div>
  )
}
