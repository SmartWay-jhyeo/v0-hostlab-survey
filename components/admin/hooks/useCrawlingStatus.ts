"use client"

import { useState, useCallback } from "react"
import {
  toggleRegionCrawlStatus,
  bulkUpdateCrawlStatus,
  deleteSurveysByRegions,
} from "@/lib/actions/survey"

interface UseCrawlingStatusOptions {
  onRefresh: () => void
  clearSelection: () => void
  crawledRegions: Map<string, boolean>
  setCrawledRegions: React.Dispatch<React.SetStateAction<Map<string, boolean>>>
}

export function useCrawlingStatus({
  onRefresh,
  clearSelection,
  crawledRegions,
  setCrawledRegions,
}: UseCrawlingStatusOptions) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleStatus = useCallback(
    async (region: string) => {
      setIsUpdating(true)
      try {
        const result = await toggleRegionCrawlStatus(region)
        if (result.success) {
          const newMap = new Map(crawledRegions)
          newMap.set(region, result.isCrawled)
          setCrawledRegions(newMap)
          clearSelection()
        }
      } catch (error) {
        alert("상태 변경 중 오류가 발생했습니다.")
      } finally {
        setIsUpdating(false)
      }
    },
    [crawledRegions, setCrawledRegions, clearSelection]
  )

  const handleBulkUpdate = useCallback(
    async (regions: string[], isCrawled: boolean) => {
      if (regions.length === 0) {
        alert("지역을 선택해주세요.")
        return
      }

      setIsUpdating(true)
      try {
        const result = await bulkUpdateCrawlStatus(regions, isCrawled)
        if (result.success) {
          const newMap = new Map(crawledRegions)
          regions.forEach((region) => {
            newMap.set(region, isCrawled)
          })
          setCrawledRegions(newMap)
          clearSelection()
        }
      } catch (error) {
        alert("일괄 상태 변경 중 오류가 발생했습니다.")
      } finally {
        setIsUpdating(false)
      }
    },
    [crawledRegions, setCrawledRegions, clearSelection]
  )

  const handleDelete = useCallback(
    async (regions: string[]) => {
      if (regions.length === 0) {
        alert("삭제할 지역을 선택해주세요.")
        return
      }

      const confirmed = window.confirm(
        `선택한 ${regions.length}개 지역을 포함한 설문 결과를 삭제하시겠습니까?\n\n삭제될 지역:\n${regions.slice(0, 5).join("\n")}${regions.length > 5 ? `\n... 외 ${regions.length - 5}개` : ""}`
      )

      if (!confirmed) return

      setIsDeleting(true)
      try {
        const result = await deleteSurveysByRegions(regions)
        if (result.success) {
          alert(`${result.deletedCount}개의 설문이 수정/삭제되었습니다.`)
          clearSelection()
          onRefresh()
        } else {
          alert(`삭제 중 오류가 발생했습니다: ${result.error}`)
        }
      } catch (error) {
        alert("삭제 중 오류가 발생했습니다.")
      } finally {
        setIsDeleting(false)
      }
    },
    [clearSelection, onRefresh]
  )

  const downloadCSV = useCallback((regions: string[]) => {
    if (regions.length === 0) {
      alert("다운로드할 지역이 없습니다.")
      return
    }

    const headers = ["시/도", "시/군/구", "읍/면/동"]
    const rows = regions.map((region) => {
      const parts = region.split(" ")
      const city = parts[0] || ""
      const district = parts[1] || ""
      const neighborhood = parts.slice(2).join(" ") || ""
      return [city, district, neighborhood]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `수요조사_지역목록_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  return {
    isUpdating,
    isDeleting,
    handleToggleStatus,
    handleBulkUpdate,
    handleDelete,
    downloadCSV,
  }
}
