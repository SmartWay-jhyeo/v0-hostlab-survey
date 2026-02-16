export type SurveyResponse = {
  id: string
  user_name: string
  cohort: string
  selected_regions: string[]
  option_type: number | null
  created_at: string
}

export type SubmitSurveyInput = {
  userName: string
  cohort: string
  selectedRegions: string[]
  optionType: number
}

export type OptionStats = {
  option1: number
  option2: number
  option3: number
  unknown: number
}
