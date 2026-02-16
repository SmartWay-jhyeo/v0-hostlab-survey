"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Types - re-export from lib/types
export type {
  SurveyResponse,
  SubmitSurveyInput,
  OptionStats,
  City,
  District,
  Neighborhood,
  ServerRegionInfo,
  CrawledRegion,
} from "@/lib/types"

import type { SurveyResponse, City, District, Neighborhood, ServerRegionInfo, CrawledRegion } from "@/lib/types"

// ============================================
// Survey CRUD functions
// ============================================

export async function checkExistingUser(
  userName: string,
  cohort: string
): Promise<{
  exists: boolean
  existingRegions: string[]
  existingOptionType: number | null
}> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("region_demand_surveys")
    .select("selected_regions, option_type")
    .eq("user_name", userName)
    .eq("cohort", cohort)

  if (error || !data || data.length === 0) {
    return { exists: false, existingRegions: [], existingOptionType: null }
  }

  const allRegions = data.flatMap((d) => d.selected_regions || [])
  const optionType = data[0]?.option_type || null
  return { exists: true, existingRegions: allRegions, existingOptionType: optionType }
}

export async function submitSurvey(data: {
  userName: string
  cohort: string
  selectedRegions: string[]
  optionType: number
}) {
  const supabase = await getSupabaseServerClient()

  const { data: existingUser } = await supabase
    .from("region_demand_surveys")
    .select("id")
    .eq("user_name", data.userName)
    .eq("cohort", data.cohort)
    .single()

  if (existingUser) {
    const { error } = await supabase
      .from("region_demand_surveys")
      .update({
        selected_regions: data.selectedRegions,
        option_type: data.optionType,
      })
      .eq("id", existingUser.id)

    if (error) {
      console.error("Survey update error:", error)
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await supabase.from("region_demand_surveys").insert({
      user_name: data.userName,
      cohort: data.cohort,
      selected_regions: data.selectedRegions,
      option_type: data.optionType,
    })

    if (error) {
      console.error("Survey submission error:", error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function getSurveyResults(): Promise<SurveyResponse[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("region_demand_surveys")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Fetch surveys error:", error)
    return []
  }

  return data || []
}

export async function deleteSurveysByRegions(
  regions: string[]
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const supabase = await getSupabaseServerClient()

  const { data: surveys, error: fetchError } = await supabase
    .from("region_demand_surveys")
    .select("id, selected_regions")

  if (fetchError) {
    console.error("Fetch surveys for delete error:", fetchError)
    return { success: false, deletedCount: 0, error: fetchError.message }
  }

  const surveyIdsToDelete: string[] = []
  const updateData: { id: string; newRegions: string[] }[] = []

  surveys?.forEach((survey) => {
    const remainingRegions = survey.selected_regions.filter(
      (region: string) => !regions.includes(region)
    )

    if (remainingRegions.length !== survey.selected_regions.length) {
      if (remainingRegions.length === 0) {
        surveyIdsToDelete.push(survey.id)
      } else {
        updateData.push({ id: survey.id, newRegions: remainingRegions })
      }
    }
  })

  let deletedCount = 0

  if (surveyIdsToDelete.length > 0) {
    const { data: deleteResult, error: deleteError } = await supabase
      .from("region_demand_surveys")
      .delete()
      .in("id", surveyIdsToDelete)
      .select()

    if (deleteError) {
      console.error("Delete surveys error:", deleteError)
      return { success: false, deletedCount: 0, error: deleteError.message }
    }
    deletedCount += deleteResult?.length || 0
  }

  for (const item of updateData) {
    const { data: updateResult, error: updateError } = await supabase
      .from("region_demand_surveys")
      .update({ selected_regions: item.newRegions })
      .eq("id", item.id)
      .select()

    if (!updateError && updateResult && updateResult.length > 0) {
      deletedCount++
    }
  }

  revalidatePath("/admin")
  return { success: true, deletedCount }
}

export async function getOptionStats(): Promise<{
  option1: number
  option2: number
  option3: number
  unknown: number
}> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("region_demand_surveys")
    .select("option_type")

  if (error || !data) {
    return { option1: 0, option2: 0, option3: 0, unknown: 0 }
  }

  const stats = { option1: 0, option2: 0, option3: 0, unknown: 0 }
  data.forEach((d) => {
    switch (d.option_type) {
      case 1:
        stats.option1++
        break
      case 2:
        stats.option2++
        break
      case 3:
        stats.option3++
        break
      default:
        stats.unknown++
    }
  })

  return stats
}

export async function deleteSurveyById(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from("region_demand_surveys")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Delete survey by id error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

export async function updateSurveyRegions(
  id: string,
  newRegions: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServerClient()

  if (newRegions.length === 0) {
    return deleteSurveyById(id)
  }

  const { error } = await supabase
    .from("region_demand_surveys")
    .update({ selected_regions: newRegions })
    .eq("id", id)

  if (error) {
    console.error("Update survey regions error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}

// ============================================
// Region functions
// ============================================

export async function getCities(): Promise<City[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("cities")
    .select("city_id, city_name")
    .order("city_name")

  if (error) {
    console.error("Fetch cities error:", error)
    return []
  }

  return data || []
}

export async function getDistricts(cityId: number): Promise<District[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("districts")
    .select("district_id, district_name, city_id")
    .eq("city_id", cityId)
    .order("district_name")

  if (error) {
    console.error("Fetch districts error:", error)
    return []
  }

  return data || []
}

export async function getNeighborhoods(districtId: number): Promise<Neighborhood[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("neighborhoods")
    .select("neighborhood_id, neighborhood_name, district_id, last_crawled_at")
    .eq("district_id", districtId)
    .order("neighborhood_name")

  if (error) {
    console.error("Fetch neighborhoods error:", error)
    return []
  }

  return data || []
}

export async function getAllServerRegions(): Promise<ServerRegionInfo[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase.from("neighborhoods").select(`
      neighborhood_name,
      last_crawled_at,
      districts!inner (
        district_name,
        cities!inner (
          city_name
        )
      )
    `)

  if (error) {
    console.error("Fetch all server regions error:", error)
    return []
  }

  return (data || []).map((item: any) => ({
    city_name: item.districts.cities.city_name,
    district_name: item.districts.district_name,
    neighborhood_name: item.neighborhood_name,
    last_crawled_at: item.last_crawled_at,
  }))
}

// ============================================
// Crawling functions
// ============================================

export async function getCrawledRegions(): Promise<CrawledRegion[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("crawled_regions")
    .select("*")
    .order("region_name")

  if (error) {
    console.error("Fetch crawled regions error:", error)
    return []
  }

  return data || []
}

export async function toggleRegionCrawlStatus(
  regionName: string
): Promise<{ success: boolean; isCrawled: boolean; error?: string }> {
  const supabase = await getSupabaseServerClient()

  const { data: existing } = await supabase
    .from("crawled_regions")
    .select("id, is_crawled")
    .eq("region_name", regionName)
    .single()

  if (existing) {
    const newStatus = !existing.is_crawled
    const { error } = await supabase
      .from("crawled_regions")
      .update({
        is_crawled: newStatus,
        crawled_at: newStatus ? new Date().toISOString() : null,
      })
      .eq("id", existing.id)

    if (error) {
      console.error("Toggle crawl status error:", error)
      return { success: false, isCrawled: existing.is_crawled, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true, isCrawled: newStatus }
  } else {
    const { error } = await supabase.from("crawled_regions").insert({
      region_name: regionName,
      is_crawled: true,
      crawled_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Insert crawled region error:", error)
      return { success: false, isCrawled: false, error: error.message }
    }

    revalidatePath("/admin")
    return { success: true, isCrawled: true }
  }
}

export async function bulkUpdateCrawlStatus(
  regionNames: string[],
  isCrawled: boolean
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  const supabase = await getSupabaseServerClient()

  let updatedCount = 0

  for (const regionName of regionNames) {
    const { data: existing } = await supabase
      .from("crawled_regions")
      .select("id")
      .eq("region_name", regionName)
      .single()

    if (existing) {
      const { error } = await supabase
        .from("crawled_regions")
        .update({
          is_crawled: isCrawled,
          crawled_at: isCrawled ? new Date().toISOString() : null,
        })
        .eq("id", existing.id)

      if (!error) updatedCount++
    } else {
      const { error } = await supabase.from("crawled_regions").insert({
        region_name: regionName,
        is_crawled: isCrawled,
        crawled_at: isCrawled ? new Date().toISOString() : null,
      })

      if (!error) updatedCount++
    }
  }

  revalidatePath("/admin")
  return { success: true, updatedCount }
}

// ============================================
// Cohort Archive functions
// ============================================

export async function getArchivedCohorts(): Promise<string[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from("archived_cohorts")
    .select("cohort")
    .order("archived_at", { ascending: false })

  if (error) {
    console.error("Fetch archived cohorts error:", error)
    return []
  }

  return (data || []).map((item) => item.cohort)
}

export async function archiveCohort(
  cohort: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.from("archived_cohorts").insert({
    cohort,
  })

  if (error) {
    console.error("Archive cohort error:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}
