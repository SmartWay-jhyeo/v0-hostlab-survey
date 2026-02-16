"use client"

import { Button } from "@/components/ui/button"

interface ExistingUserModalProps {
  show: boolean
  userName: string
  cohort: string
  existingRegions: string[]
  newRegions: string[]
  maxTotal: number
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ExistingUserModal({
  show,
  userName,
  cohort,
  existingRegions,
  newRegions,
  maxTotal,
  isPending,
  onConfirm,
  onCancel,
}: ExistingUserModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">기존 응답이 있습니다</h3>
        <p className="text-gray-600 text-sm mb-4">
          {userName}님 ({cohort})은 이미 수요조사에 참여하셨습니다.
        </p>
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            기존 선택 지역 ({existingRegions.length}개):
          </p>
          <div className="flex flex-wrap gap-1">
            {existingRegions.map((region, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                {region}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          새로운 {newRegions.length}개 지역을 추가로 저장하시겠습니까?
          <br />
          <span className="text-gray-400">
            (총 {existingRegions.length + newRegions.length}/{maxTotal}개)
          </span>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={onCancel}>
            취소
          </Button>
          <Button
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "저장 중..." : "추가 저장"}
          </Button>
        </div>
      </div>
    </div>
  )
}
