"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type SurveyResponse = {
  id: string
  user_name: string
  cohort: string
  selected_regions: string[]
  option_type: number | null
  created_at: string
}

export type City = {
  city_id: number
  city_name: string
}

export type District = {
  district_id: number
  district_name: string
  city_id: number
}

export type Neighborhood = {
  neighborhood_id: number
  neighborhood_name: string
  district_id: number
  last_crawled_at: string | null
}

export type ServerRegionInfo = {
  city_name: string
  district_name: string
  neighborhood_name: string
  last_crawled_at: string | null
}

export async function checkExistingUser(
  userName: string,
  cohort: string,
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

  // 모든 기존 지역 합치기
  const allRegions = data.flatMap((d) => d.selected_regions || [])
  // 첫 번째 기록의 option_type 사용 (사용자는 옵션을 변경할 수 없으므로 모두 동일함)
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

  // 기존 사용자 확인
  const { data: existingUser } = await supabase
    .from("region_demand_surveys")
    .select("id")
    .eq("user_name", data.userName)
    .eq("cohort", data.cohort)
    .single()

  if (existingUser) {
    // 업데이트
    const { error } = await supabase
      .from("region_demand_surveys")
      .update({
        selected_regions: data.selectedRegions,
        option_type: data.optionType,
        // created_at은 업데이트하지 않음 (최초 생성 시간 유지)
      })
      .eq("id", existingUser.id)

    if (error) {
      console.error("Survey update error:", error)
      return { success: false, error: error.message }
    }
  } else {
    // 신규 생성
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

export async function getCities(): Promise<City[]> {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase.from("cities").select("city_id, city_name").order("city_name")

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

export async function deleteSurveysByRegions(
  regions: string[],
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  const supabase = await getSupabaseServerClient()

  console.log("[v0] Starting delete for regions:", regions)

  // 해당 지역을 포함한 모든 설문 조회
  const { data: surveys, error: fetchError } = await supabase
    .from("region_demand_surveys")
    .select("id, selected_regions")

  if (fetchError) {
    console.error("[v0] Fetch surveys for delete error:", fetchError)
    return { success: false, deletedCount: 0, error: fetchError.message }
  }

  console.log("[v0] Found surveys:", surveys?.length)

  // 선택된 지역을 포함한 설문 ID 찾기
  const surveyIdsToDelete: string[] = []
  const updateData: { id: string; newRegions: string[] }[] = []

  surveys?.forEach((survey) => {
    const remainingRegions = survey.selected_regions.filter((region: string) => !regions.includes(region))

    if (remainingRegions.length !== survey.selected_regions.length) {
      if (remainingRegions.length === 0) {
        surveyIdsToDelete.push(survey.id)
      } else {
        updateData.push({ id: survey.id, newRegions: remainingRegions })
      }
    }
  })

  console.log("[v0] Surveys to delete:", surveyIdsToDelete.length)
  console.log("[v0] Surveys to update:", updateData.length)

  let deletedCount = 0

  if (surveyIdsToDelete.length > 0) {
    const { data: deleteResult, error: deleteError } = await supabase
      .from("region_demand_surveys")
      .delete()
      .in("id", surveyIdsToDelete)
      .select()

    console.log("[v0] Delete result - error:", deleteError, "deleted rows:", deleteResult?.length)

    if (deleteError) {
      console.error("[v0] Delete surveys error:", deleteError)
      return { success: false, deletedCount: 0, error: deleteError.message }
    }
    deletedCount += deleteResult?.length || 0
  }

  for (const item of updateData) {
    console.log("[v0] Updating survey", item.id, "with new regions:", item.newRegions)

    const { data: updateResult, error: updateError } = await supabase
      .from("region_demand_surveys")
      .update({ selected_regions: item.newRegions })
      .eq("id", item.id)
      .select()

    console.log("[v0] Update survey", item.id, "result:", updateResult, "error:", updateError)

    if (updateError) {
      console.error("[v0] Update survey error:", updateError)
    } else if (updateResult && updateResult.length > 0) {
      console.log("[v0] Successfully updated, new regions:", updateResult[0].selected_regions)
      deletedCount++
    } else {
      console.log("[v0] Update returned no rows - RLS policy may be blocking update")
    }
  }

  console.log("[v0] Total deleted/updated:", deletedCount)

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

  const { data, error } = await supabase.from("region_demand_surveys").select("option_type")

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
  id: string,
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
  newRegions: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseServerClient()

  if (newRegions.length === 0) {
    // 지역이 모두 삭제되면 응답 자체를 삭제
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

// 크롤링 상태 관련 타입 및 함수
export type CrawledRegion = {
  id: string
  region_name: string
  is_crawled: boolean
  crawled_at: string | null
  created_at: string
}

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
  regionName: string,
): Promise<{ success: boolean; isCrawled: boolean; error?: string }> {
  const supabase = await getSupabaseServerClient()

  // 기존 레코드 확인
  const { data: existing } = await supabase
    .from("crawled_regions")
    .select("id, is_crawled")
    .eq("region_name", regionName)
    .single()

  if (existing) {
    // 기존 레코드가 있으면 상태 토글
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
    // 새 레코드 생성 (완료 상태로)
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
  isCrawled: boolean,
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  const supabase = await getSupabaseServerClient()

  let updatedCount = 0

  for (const regionName of regionNames) {
    // 기존 레코드 확인
    const { data: existing } = await supabase
      .from("crawled_regions")
      .select("id")
      .eq("region_name", regionName)
      .single()

    if (existing) {
      // 기존 레코드 업데이트
      const { error } = await supabase
        .from("crawled_regions")
        .update({
          is_crawled: isCrawled,
          crawled_at: isCrawled ? new Date().toISOString() : null,
        })
        .eq("id", existing.id)

      if (!error) updatedCount++
    } else {
      // 새 레코드 생성
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
