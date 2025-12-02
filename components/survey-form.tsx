"use client"
import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, MapPin, Plus, X } from "lucide-react"
import {
  submitSurvey,
  checkExistingUser,
  getCities,
  getDistricts,
  getNeighborhoods,
  type City,
  type District,
  type Neighborhood,
} from "@/lib/actions/survey"
import { isSeoulRegion, validateRegionsByOption } from "@/lib/region-utils"

const COHORTS = ["1기", "2기", "3기", "4기"]

const OPTIONS = [
  {
    id: 1,
    title: "옵션 1: 서울 집중",
    description: "서울 지역 최대 5개 선택",
    maxSeoul: 5,
    maxNonSeoul: 0,
    total: 5,
  },
  {
    id: 2,
    title: "옵션 2: 경기/인천/지방 집중",
    description: "경기/인천/지방 지역 최대 10개 선택",
    maxSeoul: 0,
    maxNonSeoul: 10,
    total: 10,
  },
  {
    id: 3,
    title: "옵션 3: 서울 + 지방 혼합",
    description: "서울 최대 3개 + 경기/인천/지방 최대 2개",
    maxSeoul: 3,
    maxNonSeoul: 2,
    total: 5,
  },
]

export function SurveyForm() {
  const [name, setName] = useState("")
  const [cohort, setCohort] = useState("")
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isOptionLocked, setIsOptionLocked] = useState(false)

  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedDistrict, setSelectedDistrict] = useState<string>("")
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("")

  const [isManualMode, setIsManualMode] = useState(false)
  const [manualCity, setManualCity] = useState("")
  const [manualDistrict, setManualDistrict] = useState("")
  const [manualNeighborhood, setManualNeighborhood] = useState("")

  const [showExistingModal, setShowExistingModal] = useState(false)
  const [existingRegions, setExistingRegions] = useState<string[]>([])

  const currentOption = OPTIONS.find((o) => o.id === selectedOption)
  const existingSeoulCount = existingRegions.filter(isSeoulRegion).length
  const existingNonSeoulCount = existingRegions.filter((r) => !isSeoulRegion(r)).length
  const selectedSeoulCount = selectedRegions.filter(isSeoulRegion).length
  const selectedNonSeoulCount = selectedRegions.filter((r) => !isSeoulRegion(r)).length

  const remainingSeoulSlots = currentOption ? currentOption.maxSeoul - existingSeoulCount - selectedSeoulCount : 0
  const remainingNonSeoulSlots = currentOption
    ? currentOption.maxNonSeoul - existingNonSeoulCount - selectedNonSeoulCount
    : 0
  const totalRemainingSlots = currentOption ? currentOption.total - existingRegions.length - selectedRegions.length : 0

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

  const filteredCities = cities.filter((city) => {
    if (!selectedOption) return true
    if (selectedOption === 1) return city.city_name.startsWith("서울")
    if (selectedOption === 2) return !city.city_name.startsWith("서울")
    // 옵션 3은 모든 지역 선택 가능하지만 제한 있음
    return true
  })

  const handleAddRegion = () => {
    if (!selectedCity || !selectedDistrict || !selectedNeighborhood || !selectedOption) return

    const regionString = `${selectedCity} ${selectedDistrict} ${selectedNeighborhood}`

    // 중복 체크
    if (selectedRegions.includes(regionString) || existingRegions.includes(regionString)) {
      alert("이미 선택된 지역입니다.")
      return
    }

    const isSeoul = isSeoulRegion(regionString)
    console.log("[v0] isSeoulRegion result:", isSeoul)

    const validation = validateRegionsByOption(selectedOption, [regionString], [...selectedRegions, ...existingRegions])
    console.log("[v0] Validation result:", validation)

    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setSelectedRegions([...selectedRegions, regionString])
    setSelectedNeighborhood("")
  }

  const handleRemoveRegion = (region: string) => {
    setSelectedRegions(selectedRegions.filter((r) => r !== region))
  }

  const handleSubmit = () => {
    if (!name || !cohort || !selectedOption || selectedRegions.length === 0) return

    startTransition(async () => {
      const { exists, existingRegions: existing, existingOptionType } = await checkExistingUser(name, cohort)

      if (exists) {
        setExistingRegions(existing)

        if (existingOptionType && existingOptionType !== selectedOption) {
          setError(`이미 옵션 ${existingOptionType}으로 등록되어 있습니다. 옵션을 변경할 수 없습니다.`)
          setSelectedOption(existingOptionType)
          setIsOptionLocked(true)
          return
        }

        // 유효성 검사
        const validation = validateRegionsByOption(selectedOption, selectedRegions, existing)
        if (!validation.valid) {
          setError(validation.error || "지역 추가에 실패했습니다.")
          return
        }

        setShowExistingModal(true)
        return
      }

      await doSubmit()
    })
  }

  const doSubmit = async () => {
    if (!selectedOption) return

    const result = await submitSurvey({
      userName: name,
      cohort,
      selectedRegions,
      optionType: selectedOption,
    })

    if (result.success) {
      setSubmitted(true)
      setShowExistingModal(false)
    } else {
      setError(result.error || "제출에 실패했습니다.")
    }
  }

  const handleConfirmAddMore = () => {
    startTransition(async () => {
      await doSubmit()
    })
  }

  const handleUserInfoBlur = async () => {
    if (name && cohort) {
      const { exists, existingRegions: existing, existingOptionType } = await checkExistingUser(name, cohort)
      if (exists && existingOptionType) {
        setExistingRegions(existing)
        setSelectedOption(existingOptionType)
        setIsOptionLocked(true)
      } else {
        setIsOptionLocked(false)
      }
    }
  }

  if (submitted) {
    return (
      <div className="border border-gray-200 rounded-lg p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-gray-900" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">제출 완료!</h3>
          <p className="text-gray-500 mb-6">수요조사에 참여해 주셔서 감사합니다.</p>
          <Button
            onClick={() => {
              setSubmitted(false)
              setName("")
              setCohort("")
              setSelectedRegions([])
              setSelectedOption(null)
              setIsOptionLocked(false)
              setExistingRegions([])
            }}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            다시 제출하기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {showExistingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">기존 응답이 있습니다</h3>
            <p className="text-gray-600 text-sm mb-4">
              {name}님 ({cohort})은 이미 수요조사에 참여하셨습니다.
            </p>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">기존 선택 지역 ({existingRegions.length}개):</p>
              <div className="flex flex-wrap gap-1">
                {existingRegions.map((region, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {region}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              새로운 {selectedRegions.length}개 지역을 추가로 저장하시겠습니까?
              <br />
              <span className="text-gray-400">
                (총 {existingRegions.length + selectedRegions.length}/{currentOption?.total || 0}개)
              </span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setShowExistingModal(false)}>
                취소
              </Button>
              <Button
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                onClick={handleConfirmAddMore}
                disabled={isPending}
              >
                {isPending ? "저장 중..." : "추가 저장"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
              onChange={(e) => setName(e.target.value)}
              onBlur={handleUserInfoBlur}
              className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cohort" className="text-gray-700">
              현재 기수
            </Label>
            <Select
              value={cohort}
              onValueChange={(value) => {
                setCohort(value)
                // 기수 변경 시 기존 사용자 확인
                if (name && value) {
                  checkExistingUser(name, value).then(({ exists, existingRegions: existing, existingOptionType }) => {
                    if (exists && existingOptionType) {
                      setExistingRegions(existing)
                      setSelectedOption(existingOptionType)
                      setIsOptionLocked(true)
                    } else {
                      setIsOptionLocked(false)
                      setExistingRegions([])
                    }
                  })
                }
              }}
            >
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

      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">분석 옵션 선택</h2>
        <p className="text-gray-500 text-sm mb-6">
          원하시는 분석 옵션을 선택해주세요.
          {isOptionLocked && <span className="text-amber-600 ml-2">(이미 등록된 옵션으로 고정됩니다)</span>}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => !isOptionLocked && setSelectedOption(option.id)}
              disabled={isOptionLocked && selectedOption !== option.id}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedOption === option.id
                  ? "border-gray-900 bg-gray-50"
                  : isOptionLocked
                    ? "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-1">{option.title}</h3>
              <p className="text-sm text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>

        {existingRegions.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              기존에 {existingRegions.length}개 지역이 등록되어 있습니다.
              {currentOption && ` (최대 ${currentOption.total - existingRegions.length}개 추가 가능)`}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {existingRegions.map((region, idx) => (
                <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                  {region}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedOption && (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-gray-900">지역 선택</h2>
            <button
              onClick={() => setIsManualMode(!isManualMode)}
              className="text-sm text-gray-500 hover:text-gray-900 underline"
            >
              {isManualMode ? "서버 지역에서 선택" : "직접 입력하기"}
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-2">{currentOption?.description}</p>
          <div className="text-sm text-gray-600 mb-6">
            {selectedOption === 1 && (
              <span>
                서울: {selectedSeoulCount + existingSeoulCount}/{currentOption?.maxSeoul}개
              </span>
            )}
            {selectedOption === 2 && (
              <span>
                경기/인천/지방: {selectedNonSeoulCount + existingNonSeoulCount}/{currentOption?.maxNonSeoul}개
              </span>
            )}
            {selectedOption === 3 && (
              <span>
                서울: {selectedSeoulCount + existingSeoulCount}/{currentOption?.maxSeoul}개 | 경기/인천/지방:{" "}
                {selectedNonSeoulCount + existingNonSeoulCount}/{currentOption?.maxNonSeoul}개
              </span>
            )}
          </div>

          {isManualMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">시/도</Label>
                  <Input
                    placeholder="예: 강원특별자치도"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">시/군/구</Label>
                  <Input
                    placeholder="예: 양양군"
                    value={manualDistrict}
                    onChange={(e) => setManualDistrict(e.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">읍/면/동 (선택)</Label>
                  <Input
                    placeholder="예: 강현면"
                    value={manualNeighborhood}
                    onChange={(e) => setManualNeighborhood(e.target.value)}
                    className="border-gray-300"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddRegion}
                disabled={totalRemainingSlots <= 0}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                지역 추가
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">시/도</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="시/도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCities.map((city) => (
                        <SelectItem key={city.city_id} value={city.city_name}>
                          {city.city_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">시/군/구</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict} disabled={!selectedCity}>
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
                    onValueChange={setSelectedNeighborhood}
                    disabled={!selectedDistrict}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue placeholder="읍/면/동 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {neighborhoods.map((neighborhood) => (
                        <SelectItem key={neighborhood.neighborhood_id} value={neighborhood.neighborhood_name}>
                          {neighborhood.neighborhood_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddRegion}
                disabled={totalRemainingSlots <= 0 || !selectedCity || !selectedDistrict}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                지역 추가
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedOption && (
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">선택된 지역</h2>
              <p className="text-gray-500 text-sm">
                {selectedRegions.length}개 선택
                {existingRegions.length > 0 && (
                  <span className="text-gray-400 ml-1">
                    (기존 {existingRegions.length}개 + 신규 {selectedRegions.length}개 = 총{" "}
                    {existingRegions.length + selectedRegions.length}/{currentOption?.total}개)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[48px]">
            {selectedRegions.length === 0 ? (
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                선택된 지역이 없습니다
              </span>
            ) : (
              selectedRegions.map((region, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm ${
                    isSeoulRegion(region) ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}
                >
                  {region}
                  <button
                    onClick={() => handleRemoveRegion(region)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        </div>
      )}

      <Button
        className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base"
        onClick={handleSubmit}
        disabled={!name || !cohort || !selectedOption || selectedRegions.length === 0 || isPending}
      >
        {isPending ? "제출 중..." : "제출하기"}
      </Button>
    </div>
  )
}
