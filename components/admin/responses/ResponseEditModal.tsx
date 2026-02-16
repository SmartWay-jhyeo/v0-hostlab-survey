"use client"

import { useState } from "react"
import { X, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateSurveyRegions } from "@/lib/actions/survey"
import type { SurveyResponse, ServerRegionInfo } from "@/lib/types"

interface ResponseEditModalProps {
  survey: SurveyResponse
  serverRegions: Map<string, ServerRegionInfo>
  onClose: () => void
  onSuccess: () => void
}

export function ResponseEditModal({
  survey,
  serverRegions,
  onClose,
  onSuccess,
}: ResponseEditModalProps) {
  const [editingRegions, setEditingRegions] = useState<string[]>([...survey.selected_regions])
  const [isUpdating, setIsUpdating] = useState(false)

  const removeRegion = (region: string) => {
    setEditingRegions(editingRegions.filter((r) => r !== region))
  }

  const handleSave = async () => {
    if (editingRegions.length === 0) {
      const confirmed = window.confirm(
        "모든 지역이 삭제되었습니다. 이 응답 자체를 삭제하시겠습니까?"
      )
      if (!confirmed) return
    }

    setIsUpdating(true)
    try {
      const result = await updateSurveyRegions(survey.id, editingRegions)
      if (result.success) {
        onSuccess()
      } else {
        alert(`수정 중 오류가 발생했습니다: ${result.error}`)
      }
    } catch (error) {
      alert("수정 중 오류가 발생했습니다.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">응답 수정</h3>
            <p className="text-sm text-gray-500">
              {survey.user_name} ({survey.cohort})
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
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
                const isInServer = serverRegions.has(region)
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
                      onClick={() => removeRegion(region)}
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
          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isUpdating ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  )
}
