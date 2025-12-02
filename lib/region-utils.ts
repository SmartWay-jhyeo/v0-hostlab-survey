// 클라이언트에서 사용 가능한 지역 관련 유틸리티 함수들

export function isSeoulRegion(region: string): boolean {
  return region.startsWith("서울")
}

export function validateRegionsByOption(
  optionType: number,
  regions: string[],
  existingRegions: string[] = [],
): { valid: boolean; error?: string } {
  const allRegions = [...existingRegions, ...regions]
  const seoulCount = allRegions.filter(isSeoulRegion).length
  const nonSeoulCount = allRegions.filter((r) => !isSeoulRegion(r)).length

  switch (optionType) {
    case 1: // 서울 5개
      if (nonSeoulCount > 0) {
        return { valid: false, error: "옵션 1은 서울 지역만 선택할 수 있습니다." }
      }
      if (seoulCount > 5) {
        return { valid: false, error: `서울 지역은 최대 5개까지 선택 가능합니다. (현재 ${seoulCount}개)` }
      }
      break
    case 2: // 경기/인천/지방 10개
      if (seoulCount > 0) {
        return { valid: false, error: "옵션 2는 경기/인천/지방 지역만 선택할 수 있습니다." }
      }
      if (nonSeoulCount > 10) {
        return { valid: false, error: `경기/인천/지방 지역은 최대 10개까지 선택 가능합니다. (현재 ${nonSeoulCount}개)` }
      }
      break
    case 3: // 서울 3개 + 지방 2개
      if (seoulCount > 3) {
        return { valid: false, error: `서울 지역은 최대 3개까지 선택 가능합니다. (현재 ${seoulCount}개)` }
      }
      if (nonSeoulCount > 2) {
        return { valid: false, error: `경기/인천/지방 지역은 최대 2개까지 선택 가능합니다. (현재 ${nonSeoulCount}개)` }
      }
      break
    default:
      return { valid: false, error: "올바른 옵션을 선택해주세요." }
  }

  return { valid: true }
}
