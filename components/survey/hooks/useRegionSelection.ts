"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { getCities, getDistricts, getNeighborhoods } from "@/lib/actions/survey"
import { isSeoulRegion, validateRegionsByOption } from "@/lib/region-utils"
import type { City, District, Neighborhood } from "@/lib/types"

const OPTIONS = [
  { id: 1, maxSeoul: 5, maxNonSeoul: 0, total: 5 },
  { id: 2, maxSeoul: 0, maxNonSeoul: 10, total: 10 },
  { id: 3, maxSeoul: 3, maxNonSeoul: 2, total: 5 },
]

export function useRegionSelection(selectedOption: number | null, existingRegions: string[]) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])

  // Location selectors
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [selectedCity, setSelectedCity] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("")

  // Manual mode
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualCity, setManualCity] = useState("")
  const [manualDistrict, setManualDistrict] = useState("")
  const [manualNeighborhood, setManualNeighborhood] = useState("")

  useEffect(() => {
    getCities().then(setCities)
  }, [])

  useEffect(() => {
    if (selectedCity) {
      const cityId = cities.find((c) => c.city_name === selectedCity)?.city_id
      if (cityId) {
        getDistricts(cityId).then(setDistricts)
        setSelectedDistrict("")
        setSelectedNeighborhood("")
        setNeighborhoods([])
      }
    }
  }, [selectedCity, cities])

  useEffect(() => {
    if (selectedDistrict) {
      const districtId = districts.find((d) => d.district_name === selectedDistrict)?.district_id
      if (districtId) {
        getNeighborhoods(districtId).then(setNeighborhoods)
        setSelectedNeighborhood("")
      }
    }
  }, [selectedDistrict, districts])

  const currentOption = OPTIONS.find((o) => o.id === selectedOption)

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      if (!selectedOption) return true
      if (selectedOption === 1) return city.city_name.startsWith("서울")
      if (selectedOption === 2) return !city.city_name.startsWith("서울")
      return true
    })
  }, [cities, selectedOption])

  const existingSeoulCount = existingRegions.filter(isSeoulRegion).length
  const existingNonSeoulCount = existingRegions.filter((r) => !isSeoulRegion(r)).length
  const selectedSeoulCount = selectedRegions.filter(isSeoulRegion).length
  const selectedNonSeoulCount = selectedRegions.filter((r) => !isSeoulRegion(r)).length

  const remainingSlots = useMemo(() => {
    if (!currentOption) return { seoul: 0, nonSeoul: 0, total: 0 }
    return {
      seoul: currentOption.maxSeoul - existingSeoulCount - selectedSeoulCount,
      nonSeoul: currentOption.maxNonSeoul - existingNonSeoulCount - selectedNonSeoulCount,
      total: currentOption.total - existingRegions.length - selectedRegions.length,
    }
  }, [
    currentOption,
    existingSeoulCount,
    existingNonSeoulCount,
    selectedSeoulCount,
    selectedNonSeoulCount,
    existingRegions.length,
    selectedRegions.length,
  ])

  const addRegion = useCallback((): { success: boolean; error?: string } => {
    if (!selectedOption) return { success: false, error: "옵션을 선택해주세요." }

    let regionString = ""

    if (isManualMode) {
      if (!manualCity || !manualDistrict) {
        return { success: false, error: "시/도와 시/군/구를 입력해주세요." }
      }
      regionString = `${manualCity} ${manualDistrict} ${manualNeighborhood}`.trim()
    } else {
      if (!selectedCity || !selectedDistrict || !selectedNeighborhood) {
        return { success: false, error: "지역을 선택해주세요." }
      }
      regionString = `${selectedCity} ${selectedDistrict} ${selectedNeighborhood}`
    }

    if (selectedRegions.includes(regionString) || existingRegions.includes(regionString)) {
      return { success: false, error: "이미 선택된 지역입니다." }
    }

    const validation = validateRegionsByOption(selectedOption, [regionString], [
      ...selectedRegions,
      ...existingRegions,
    ])

    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    setSelectedRegions([...selectedRegions, regionString])
    setSelectedNeighborhood("")
    return { success: true }
  }, [
    selectedOption,
    isManualMode,
    manualCity,
    manualDistrict,
    manualNeighborhood,
    selectedCity,
    selectedDistrict,
    selectedNeighborhood,
    selectedRegions,
    existingRegions,
  ])

  const removeRegion = useCallback((region: string) => {
    setSelectedRegions((prev) => prev.filter((r) => r !== region))
  }, [])

  const clearRegions = useCallback(() => {
    setSelectedRegions([])
  }, [])

  return {
    selectedRegions,
    setSelectedRegions,
    // Location selectors
    cities: filteredCities,
    districts,
    neighborhoods,
    selectedCity,
    setSelectedCity,
    selectedDistrict,
    setSelectedDistrict,
    selectedNeighborhood,
    setSelectedNeighborhood,
    // Manual mode
    isManualMode,
    setIsManualMode,
    manualCity,
    setManualCity,
    manualDistrict,
    setManualDistrict,
    manualNeighborhood,
    setManualNeighborhood,
    // Counts
    existingSeoulCount,
    existingNonSeoulCount,
    selectedSeoulCount,
    selectedNonSeoulCount,
    remainingSlots,
    currentOption,
    // Actions
    addRegion,
    removeRegion,
    clearRegions,
  }
}
