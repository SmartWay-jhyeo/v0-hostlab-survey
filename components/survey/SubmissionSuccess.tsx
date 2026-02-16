"use client"

import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SubmissionSuccessProps {
  onReset: () => void
}

export function SubmissionSuccess({ onReset }: SubmissionSuccessProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-8">
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-gray-900" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">제출 완료!</h3>
        <p className="text-gray-500 mb-6">수요조사에 참여해 주셔서 감사합니다.</p>
        <Button onClick={onReset} className="bg-gray-900 hover:bg-gray-800 text-white">
          다시 제출하기
        </Button>
      </div>
    </div>
  )
}
