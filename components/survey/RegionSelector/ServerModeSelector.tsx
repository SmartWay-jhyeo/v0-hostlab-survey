"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { City, District, Neighborhood } from "@/lib/types"

interface ServerModeSelectorProps {
  cities: City[]
  districts: District[]
  neighborhoods: Neighborhood[]
  selectedCity: string
  selectedDistrict: string
  selectedNeighborhood: string
  onCityChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onNeighborhoodChange: (value: string) => void
  onAddRegion: () => void
  disabled: boolean
}

export function ServerModeSelector({
  cities,
  districts,
  neighborhoods,
  selectedCity,
  selectedDistrict,
  selectedNeighborhood,
  onCityChange,
  onDistrictChange,
  onNeighborhoodChange,
  onAddRegion,
  disabled,
}: ServerModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-700">시/도</Label>
          <Select value={selectedCity} onValueChange={onCityChange}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="시/도 선택" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.city_id} value={city.city_name}>
                  {city.city_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700">시/군/구</Label>
          <Select
            value={selectedDistrict}
            onValueChange={onDistrictChange}
            disabled={!selectedCity}
          >
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="시/군/구 선택" />
            </SelectTrigger>
            <SelectContent>
              {districts.map((district) => (
                <SelectItem key={district.district_id} value={district.district_name}>
                  {district.district_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-700">읍/면/동 (선택)</Label>
          <Select
            value={selectedNeighborhood}
            onValueChange={onNeighborhoodChange}
            disabled={!selectedDistrict}
          >
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="읍/면/동 선택" />
            </SelectTrigger>
            <SelectContent>
              {neighborhoods.map((neighborhood) => (
                <SelectItem
                  key={neighborhood.neighborhood_id}
                  value={neighborhood.neighborhood_name}
                >
                  {neighborhood.neighborhood_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        onClick={onAddRegion}
        disabled={disabled || !selectedCity || !selectedDistrict}
        className="bg-gray-900 hover:bg-gray-800 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        지역 추가
      </Button>
    </div>
  )
}
