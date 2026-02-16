"use client"

import { useMemo } from "react"
import { PieChart } from "lucide-react"
import type { SurveyResponse } from "@/lib/types"

const OPTION_CONFIG = [
  { key: "option1", type: 1, label: "옵션 1", desc: "서울 5개", colors: "blue" },
  { key: "option2", type: 2, label: "옵션 2", desc: "경기/인천/지방 10개", colors: "green" },
  { key: "option3", type: 3, label: "옵션 3", desc: "서울 3개 + 지방 2개", colors: "purple" },
  { key: "unknown", type: null, label: "미분류", desc: "이전 응답", colors: "gray" },
] as const

const COLOR_CLASSES = {
  blue: "bg-blue-50 border-blue-200 text-blue-600 text-blue-900 text-blue-500",
  green: "bg-green-50 border-green-200 text-green-600 text-green-900 text-green-500",
  purple: "bg-purple-50 border-purple-200 text-purple-600 text-purple-900 text-purple-500",
  gray: "bg-gray-50 border-gray-200 text-gray-600 text-gray-900 text-gray-500",
}

interface OptionCardProps {
  label: string
  desc: string
  count: number
  colors: keyof typeof COLOR_CLASSES
}

function OptionCard({ label, desc, count, colors }: OptionCardProps) {
  return (
    <div className={`p-4 rounded-lg border bg-${colors}-50 border-${colors}-200`}>
      <p className={`text-sm text-${colors}-600 mb-1`}>{label}</p>
      <p className={`text-xl font-bold text-${colors}-900`}>{count}명</p>
      <p className={`text-xs text-${colors}-500`}>{desc}</p>
    </div>
  )
}

interface OptionStatsProps {
  uniqueSurveys: SurveyResponse[]
}

export function OptionStats({ uniqueSurveys }: OptionStatsProps) {
  const stats = useMemo(() => {
    const result = { option1: 0, option2: 0, option3: 0, unknown: 0 }
    uniqueSurveys.forEach((s) => {
      if (s.option_type === 1) result.option1++
      else if (s.option_type === 2) result.option2++
      else if (s.option_type === 3) result.option3++
      else result.unknown++
    })
    return result
  }, [uniqueSurveys])

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-semibold text-gray-900">옵션별 통계</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">옵션 1</p>
          <p className="text-xl font-bold text-blue-900">{stats.option1}명</p>
          <p className="text-xs text-blue-500">서울 5개</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 mb-1">옵션 2</p>
          <p className="text-xl font-bold text-green-900">{stats.option2}명</p>
          <p className="text-xs text-green-500">경기/인천/지방 10개</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 mb-1">옵션 3</p>
          <p className="text-xl font-bold text-purple-900">{stats.option3}명</p>
          <p className="text-xs text-purple-500">서울 3개 + 지방 2개</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">미분류</p>
          <p className="text-xl font-bold text-gray-900">{stats.unknown}명</p>
          <p className="text-xs text-gray-500">이전 응답</p>
        </div>
      </div>
    </div>
  )
}
