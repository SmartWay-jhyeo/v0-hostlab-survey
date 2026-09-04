import { getSurveyResults, getArchivedCohorts } from "@/lib/actions/survey"
import Link from "next/link"
import { Settings, Users, MapPin, BarChart3 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>
}) {
  const { cohort: selectedCohort } = await searchParams
  const [surveys, archivedCohorts] = await Promise.all([getSurveyResults(), getArchivedCohorts()])

  // 중복 제거 (이름+기수 기준, 최신 응답 우선 - getSurveyResults가 created_at 내림차순 정렬)
  const seen = new Set<string>()
  const uniqueSurveys = surveys.filter((survey) => {
    const key = `${survey.user_name}-${survey.cohort}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // 데이터에 존재하는 기수 목록 (기수 번호 내림차순)
  const cohorts = Array.from(new Set(uniqueSurveys.map((s) => s.cohort))).sort((a, b) =>
    b.localeCompare(a, "ko", { numeric: true })
  )

  const filtered = selectedCohort
    ? uniqueSurveys.filter((s) => s.cohort === selectedCohort)
    : uniqueSurveys

  const regionCounts: Record<string, number> = {}
  filtered.forEach((survey) => {
    survey.selected_regions.forEach((region) => {
      regionCounts[region] = (regionCounts[region] || 0) + 1
    })
  })

  const sortedRegions = Object.entries(regionCounts).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko")
  )
  const maxCount = sortedRegions[0]?.[1] ?? 0
  const totalSelections = sortedRegions.reduce((sum, [, count]) => sum + count, 0)

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            HostLab
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              지역 수요조사
            </Link>
            <span className="text-gray-900 font-medium">통계</span>
            <Link href="/admin" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
              <Settings className="w-4 h-4" />
              <span>관리자</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">지역 선택 통계</h1>
          <p className="text-gray-500">어떤 지역이 가장 많이 선택되었는지 확인할 수 있습니다.</p>
        </div>

        {/* 기수 필터 */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Link
            href="/stats"
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !selectedCohort
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-900"
            }`}
          >
            전체
          </Link>
          {cohorts.map((cohort) => (
            <Link
              key={cohort}
              href={`/stats?cohort=${encodeURIComponent(cohort)}`}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedCohort === cohort
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-900"
              }`}
            >
              {cohort}
              {archivedCohorts.includes(cohort) && <span className="ml-1 text-xs opacity-60">(마무리)</span>}
            </Link>
          ))}
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              <span>참여 인원</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{filtered.length}명</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <MapPin className="w-4 h-4" />
              <span>선택된 지역</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{sortedRegions.length}개</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>총 선택 수</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSelections}표</p>
          </div>
        </div>

        {/* 지역별 순위 */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            지역별 선택 순위{selectedCohort ? ` (${selectedCohort})` : " (전체 기수)"}
          </h2>
          {sortedRegions.length === 0 ? (
            <p className="text-gray-500 text-sm">아직 수집된 응답이 없습니다.</p>
          ) : (
            <ol className="space-y-3">
              {sortedRegions.map(([region, count], index) => (
                <li key={region} className="flex items-center gap-3">
                  <span
                    className={`w-7 shrink-0 text-right text-sm tabular-nums ${
                      index < 3 ? "font-bold text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="text-sm text-gray-900 truncate">{region}</span>
                      <span className="text-sm text-gray-500 shrink-0 tabular-nums">
                        {count}표
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full"
                        style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </main>
  )
}
