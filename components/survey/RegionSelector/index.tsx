"use client"

import { ServerModeSelector } from "./ServerModeSelector"
import { ManualModeInput } from "./ManualModeInput"
import type { City, District, Neighborhood } from "@/lib/types"

interface RegionSelectorProps {
  selectedOption: number
  // Location selectors
  cities: City[]
  districts: District[]
  neighborhoods: Neighborhood[]
  selectedCity: string
  selectedDistrict: string
  selectedNeighborhood: string
  onCityChange: (value: string) => void
  onDistrictChange: (value: string) => void
  onNeighborhoodChange: (value: string) => void
  // Manual mode
  isManualMode: boolean
  onToggleMode: () => void
  manualCity: string
  manualDistrict: string
  manualNeighborhood: string
  onManualCityChange: (value: string) => void
  onManualDistrictChange: (value: string) => void
  onManualNeighborhoodChange: (value: string) => void
  // Counts
  existingSeoulCount: number
  existingNonSeoulCount: number
  selectedSeoulCount: number
  selectedNonSeoulCount: number
  maxSeoul: number
  maxNonSeoul: number
  totalRemaining: number
  // Actions
  onAddRegion: () => void
}

export function RegionSelector({
  selectedOption,
  cities,
  districts,
  neighborhoods,
  selectedCity,
  selectedDistrict,
  selectedNeighborhood,
  onCityChange,
  onDistrictChange,
  onNeighborhoodChange,
  isManualMode,
  onToggleMode,
  manualCity,
  manualDistrict,
  manualNeighborhood,
  onManualCityChange,
  onManualDistrictChange,
  onManualNeighborhoodChange,
  existingSeoulCount,
  existingNonSeoulCount,
  selectedSeoulCount,
  selectedNonSeoulCount,
  maxSeoul,
  maxNonSeoul,
  totalRemaining,
  onAddRegion,
}: RegionSelectorProps) {
  const getDescription = () => {
    switch (selectedOption) {
      case 1:
        return "서울 지역 최대 5개 선택"
      case 2:
        return "경기/인천/지방 지역 최대 10개 선택"
      case 3:
        return "서울 최대 3개 + 경기/인천/지방 최대 2개"
      default:
        return ""
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">지역 선택</h2>
        <button
          onClick={onToggleMode}
          className="text-sm text-gray-500 hover:text-gray-900 underline"
        >
          {isManualMode ? "서버 지역에서 선택" : "직접 입력하기"}
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-2">{getDescription()}</p>
      <div className="text-sm text-gray-600 mb-6">
        {selectedOption === 1 && (
          <span>
            서울: {selectedSeoulCount + existingSeoulCount}/{maxSeoul}개
          </span>
        )}
        {selectedOption === 2 && (
          <span>
            경기/인천/지방: {selectedNonSeoulCount + existingNonSeoulCount}/{maxNonSeoul}개
          </span>
        )}
        {selectedOption === 3 && (
          <span>
            서울: {selectedSeoulCount + existingSeoulCount}/{maxSeoul}개 | 경기/인천/지방:{" "}
            {selectedNonSeoulCount + existingNonSeoulCount}/{maxNonSeoul}개
          </span>
        )}
      </div>

      {isManualMode ? (
        <ManualModeInput
          manualCity={manualCity}
          manualDistrict={manualDistrict}
          manualNeighborhood={manualNeighborhood}
          onCityChange={onManualCityChange}
          onDistrictChange={onManualDistrictChange}
          onNeighborhoodChange={onManualNeighborhoodChange}
          onAddRegion={onAddRegion}
          disabled={totalRemaining <= 0}
        />
      ) : (
        <ServerModeSelector
          cities={cities}
          districts={districts}
          neighborhoods={neighborhoods}
          selectedCity={selectedCity}
          selectedDistrict={selectedDistrict}
          selectedNeighborhood={selectedNeighborhood}
          onCityChange={onCityChange}
          onDistrictChange={onDistrictChange}
          onNeighborhoodChange={onNeighborhoodChange}
          onAddRegion={onAddRegion}
          disabled={totalRemaining <= 0}
        />
      )}
    </div>
  )
}

export { ServerModeSelector } from "./ServerModeSelector"
export { ManualModeInput } from "./ManualModeInput"
