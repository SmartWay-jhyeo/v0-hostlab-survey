"use client"

import { useState } from "react"
import { ArrowUpDown, Pencil, Trash2, Database } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ResponseEditModal } from "./ResponseEditModal"
import { deleteSurveyById } from "@/lib/actions/survey"
import type { SurveyResponse, ServerRegionInfo } from "@/lib/types"

const OPTION_NAMES: Record<number, string> = {
  1: "서울 5개",
  2: "경기/인천/지방 10개",
  3: "서울 3개 + 지방 2개",
}

interface ResponseTableProps {
  surveys: SurveyResponse[]
  serverRegions: Map<string, ServerRegionInfo>
  onUpdate: () => void
  readOnly?: boolean
}

export function ResponseTable({ surveys, serverRegions, onUpdate, readOnly = false }: ResponseTableProps) {
  const [sortOrder, setSortOrder] = useState<"name" | "date">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [editingSurvey, setEditingSurvey] = useState<SurveyResponse | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const toggleSort = (field: "name" | "date") => {
    if (sortOrder === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortOrder(field)
      setSortDirection("asc")
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

  const handleDeleteSurvey = async (survey: SurveyResponse) => {
    const confirmed = window.confirm(
      `${survey.user_name}(${survey.cohort})님의 응답을 삭제하시겠습니까?\n\n선택 지역:\n${survey.selected_regions.slice(0, 3).join("\n")}${survey.selected_regions.length > 3 ? `\n... 외 ${survey.selected_regions.length - 3}개` : ""}`
    )

    if (!confirmed) return

    setIsUpdating(true)
    try {
      const result = await deleteSurveyById(survey.id)
      if (result.success) {
        onUpdate()
      } else {
        alert(`삭제 중 오류가 발생했습니다: ${result.error}`)
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
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
                    <ArrowUpDown
                      className={`w-4 h-4 ${sortOrder === "name" ? "text-gray-900" : "text-gray-400"}`}
                    />
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
                    <ArrowUpDown
                      className={`w-4 h-4 ${sortOrder === "date" ? "text-gray-900" : "text-gray-400"}`}
                    />
                  </div>
                </TableHead>
                {!readOnly && <TableHead className="text-gray-600 text-center">관리</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSurveys.map((survey) => (
                <TableRow key={survey.id} className="border-gray-200">
                  <TableCell className="font-medium text-gray-900">
                    {survey.user_name}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {survey.cohort}
                    </span>
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
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                        미분류
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {survey.selected_regions.map((region) => {
                        const isInServer = serverRegions.has(region)
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
                  {!readOnly && (
                    <TableCell>
                      <div className="flex items-center gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => setEditingSurvey(survey)}
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
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editingSurvey && (
        <ResponseEditModal
          survey={editingSurvey}
          serverRegions={serverRegions}
          onClose={() => setEditingSurvey(null)}
          onSuccess={() => {
            setEditingSurvey(null)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}
