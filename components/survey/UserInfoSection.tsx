"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const COHORTS = ["1기", "2기", "3기", "4기", "5기"]

interface UserInfoSectionProps {
  name: string
  cohort: string
  onNameChange: (value: string) => void
  onCohortChange: (value: string) => void
  onBlur: () => void
}

export function UserInfoSection({
  name,
  cohort,
  onNameChange,
  onCohortChange,
  onBlur,
}: UserInfoSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">기본 정보</h2>
      <p className="text-gray-500 text-sm mb-6">이름과 현재 기수를 입력해주세요.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">
            이름
          </Label>
          <Input
            id="name"
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onBlur}
            className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cohort" className="text-gray-700">
            현재 기수
          </Label>
          <Select value={cohort} onValueChange={onCohortChange}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="기수를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {COHORTS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
