"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { submitSurvey, checkExistingUser } from "@/lib/actions/survey"
import { validateRegionsByOption } from "@/lib/region-utils"
import { useSurveyForm, useRegionSelection } from "./hooks"
import { UserInfoSection } from "./UserInfoSection"
import { OptionSelector } from "./OptionSelector"
import { RegionSelector } from "./RegionSelector"
import { SelectedRegionsList } from "./SelectedRegionsList"
import { ExistingUserModal } from "./ExistingUserModal"
import { SubmissionSuccess } from "./SubmissionSuccess"

const OPTIONS = [
  { id: 1, maxSeoul: 5, maxNonSeoul: 0, total: 5 },
  { id: 2, maxSeoul: 0, maxNonSeoul: 10, total: 10 },
  { id: 3, maxSeoul: 3, maxNonSeoul: 2, total: 5 },
]

export function SurveyForm() {
  const [submitted, setSubmitted] = useState(false)
  const [showExistingModal, setShowExistingModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  const {
    name,
    setName,
    cohort,
    setCohort,
    selectedOption,
    setSelectedOption,
    isOptionLocked,
    setIsOptionLocked,
    existingRegions,
    setExistingRegions,
    error,
    setError,
    handleUserInfoBlur,
    reset: resetForm,
  } = useSurveyForm()

  const {
    selectedRegions,
    setSelectedRegions,
    cities,
    districts,
    neighborhoods,
    selectedCity,
    setSelectedCity,
    selectedDistrict,
    setSelectedDistrict,
    selectedNeighborhood,
    setSelectedNeighborhood,
    isManualMode,
    setIsManualMode,
    manualCity,
    setManualCity,
    manualDistrict,
    setManualDistrict,
    manualNeighborhood,
    setManualNeighborhood,
    existingSeoulCount,
    existingNonSeoulCount,
    selectedSeoulCount,
    selectedNonSeoulCount,
    remainingSlots,
    currentOption,
    addRegion,
    removeRegion,
    clearRegions,
  } = useRegionSelection(selectedOption, existingRegions)

  const handleAddRegion = () => {
    const result = addRegion()
    if (!result.success && result.error) {
      alert(result.error)
    }
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

  const handleSubmit = () => {
    if (!name || !cohort || !selectedOption || selectedRegions.length === 0) return

    startTransition(async () => {
      const { exists, existingRegions: existing, existingOptionType } = await checkExistingUser(
        name,
        cohort
      )

      if (exists) {
        setExistingRegions(existing)

        if (existingOptionType && existingOptionType !== selectedOption) {
          setError(`이미 옵션 ${existingOptionType}으로 등록되어 있습니다. 옵션을 변경할 수 없습니다.`)
          setSelectedOption(existingOptionType)
          setIsOptionLocked(true)
          return
        }

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

  const handleConfirmAddMore = () => {
    startTransition(async () => {
      await doSubmit()
    })
  }

  const handleReset = () => {
    setSubmitted(false)
    resetForm()
    clearRegions()
  }

  if (submitted) {
    return <SubmissionSuccess onReset={handleReset} />
  }

  const isValid = name && cohort && selectedOption && selectedRegions.length > 0 && privacyAgreed

  return (
    <div className="space-y-8">
      <ExistingUserModal
        show={showExistingModal}
        userName={name}
        cohort={cohort}
        existingRegions={existingRegions}
        newRegions={selectedRegions}
        maxTotal={currentOption?.total || 0}
        isPending={isPending}
        onConfirm={handleConfirmAddMore}
        onCancel={() => setShowExistingModal(false)}
      />

      <UserInfoSection
        name={name}
        cohort={cohort}
        onNameChange={setName}
        onCohortChange={setCohort}
        onBlur={handleUserInfoBlur}
      />

      <OptionSelector
        selectedOption={selectedOption}
        isLocked={isOptionLocked}
        existingRegions={existingRegions}
        onSelect={setSelectedOption}
      />

      {selectedOption && (
        <>
          <RegionSelector
            selectedOption={selectedOption}
            cities={cities}
            districts={districts}
            neighborhoods={neighborhoods}
            selectedCity={selectedCity}
            selectedDistrict={selectedDistrict}
            selectedNeighborhood={selectedNeighborhood}
            onCityChange={setSelectedCity}
            onDistrictChange={setSelectedDistrict}
            onNeighborhoodChange={setSelectedNeighborhood}
            isManualMode={isManualMode}
            onToggleMode={() => setIsManualMode(!isManualMode)}
            manualCity={manualCity}
            manualDistrict={manualDistrict}
            manualNeighborhood={manualNeighborhood}
            onManualCityChange={setManualCity}
            onManualDistrictChange={setManualDistrict}
            onManualNeighborhoodChange={setManualNeighborhood}
            existingSeoulCount={existingSeoulCount}
            existingNonSeoulCount={existingNonSeoulCount}
            selectedSeoulCount={selectedSeoulCount}
            selectedNonSeoulCount={selectedNonSeoulCount}
            maxSeoul={currentOption?.maxSeoul || 0}
            maxNonSeoul={currentOption?.maxNonSeoul || 0}
            totalRemaining={remainingSlots.total}
            onAddRegion={handleAddRegion}
          />

          <SelectedRegionsList
            regions={selectedRegions}
            existingCount={existingRegions.length}
            maxTotal={currentOption?.total || 0}
            onRemove={removeRegion}
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
        </>
      )}

      {/* 개인정보 동의 */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={privacyAgreed}
            onChange={(e) => setPrivacyAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-sm text-gray-600">
            입력하신 이름과 선택 지역은 수요조사 목적으로만 사용되며, 조사 완료 후 삭제됩니다.
            <span className="text-red-500 ml-1">*</span>
          </span>
        </label>
      </div>

      <Button
        className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base"
        onClick={handleSubmit}
        disabled={!isValid || isPending}
      >
        {isPending ? "제출 중..." : "제출하기"}
      </Button>
    </div>
  )
}
