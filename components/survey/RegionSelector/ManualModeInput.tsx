"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ManualModeInputProps {
  manualCity: string
  manualDistrict: string
  manualNeighborhood: string
  onCityChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onNeighborhoodChange: (value: string) => void
  onAddRegion: () => void
  disabled: boolean
}

export function ManualModeInput({
  manualCity,
  manualDistrict,
  manualNeighborhood,
  onCityChange,
  onDistrictChange,
  onNeighborhoodChange,
  onAddRegion,
  disabled,
}: ManualModeInputProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700">시/도</Label>
          <Input
            placeholder="예: 강원특별자치도"
            value={manualCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700">시/군/구</Label>
          <Input
            placeholder="예: 양양군"
            value={manualDistrict}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="border-gray-300"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700">읍/면/동 (선택)</Label>
          <Input
            placeholder="예: 강현면"
            value={manualNeighborhood}
            onChange={(e) => onNeighborhoodChange(e.target.value)}
            className="border-gray-300"
          />
        </div>
      </div>
      <Button
        onClick={onAddRegion}
        disabled={disabled || !manualCity || !manualDistrict}
        className="bg-gray-900 hover:bg-gray-800 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        지역 추가
      </Button>
    </div>
  )
}
