"use client"

import { useState, useCallback } from "react"
import { checkExistingUser } from "@/lib/actions/survey"

export function useSurveyForm() {
  const [name, setName] = useState("")
  const [cohort, setCohort] = useState("")
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isOptionLocked, setIsOptionLocked] = useState(false)
  const [existingRegions, setExistingRegions] = useState<string[]>([])
  const [error, setError] = useState("")

  const handleUserInfoBlur = useCallback(async () => {
    if (name && cohort) {
      const { exists, existingRegions: existing, existingOptionType } = await checkExistingUser(
        name,
        cohort
      )
      if (exists && existingOptionType) {
        setExistingRegions(existing)
        setSelectedOption(existingOptionType)
        setIsOptionLocked(true)
      } else {
        setIsOptionLocked(false)
        setExistingRegions([])
      }
    }
  }, [name, cohort])

  const handleCohortChange = useCallback(
    async (value: string) => {
      setCohort(value)
      if (name && value) {
        const { exists, existingRegions: existing, existingOptionType } = await checkExistingUser(
          name,
          value
        )
        if (exists && existingOptionType) {
          setExistingRegions(existing)
          setSelectedOption(existingOptionType)
          setIsOptionLocked(true)
        } else {
          setIsOptionLocked(false)
          setExistingRegions([])
        }
      }
    },
    [name]
  )

  const reset = useCallback(() => {
    setName("")
    setCohort("")
    setSelectedOption(null)
    setIsOptionLocked(false)
    setExistingRegions([])
    setError("")
  }, [])

  return {
    name,
    setName,
    cohort,
    setCohort: handleCohortChange,
    selectedOption,
    setSelectedOption,
    isOptionLocked,
    setIsOptionLocked,
    existingRegions,
    setExistingRegions,
    error,
    setError,
    handleUserInfoBlur,
    reset,
  }
}
