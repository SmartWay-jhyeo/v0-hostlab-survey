"use client"

const OPTIONS = [
  {
    id: 1,
    title: "옵션 1: 서울 집중",
    description: "서울 지역 최대 5개 선택",
    total: 5,
  },
  {
    id: 2,
    title: "옵션 2: 경기/인천/지방 집중",
    description: "경기/인천/지방 지역 최대 10개 선택",
    total: 10,
  },
  {
    id: 3,
    title: "옵션 3: 서울 + 지방 혼합",
    description: "서울 최대 3개 + 경기/인천/지방 최대 2개",
    total: 5,
  },
]

interface OptionSelectorProps {
  selectedOption: number | null
  isLocked: boolean
  existingRegions: string[]
  onSelect: (option: number) => void
}

export function OptionSelector({
  selectedOption,
  isLocked,
  existingRegions,
  onSelect,
}: OptionSelectorProps) {
  const currentOption = OPTIONS.find((o) => o.id === selectedOption)

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">분석 옵션 선택</h2>
      <p className="text-gray-500 text-sm mb-6">
        원하시는 분석 옵션을 선택해주세요.
        {isLocked && (
          <span className="text-amber-600 ml-2">(이미 등록된 옵션으로 고정됩니다)</span>
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => !isLocked && onSelect(option.id)}
            disabled={isLocked && selectedOption !== option.id}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedOption === option.id
                ? "border-gray-900 bg-gray-50"
                : isLocked
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
  )
}
