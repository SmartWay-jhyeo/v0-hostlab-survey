import { SurveyForm } from "@/components/survey"
import Link from "next/link"
import { Settings } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            HostLab
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <span className="text-gray-900 font-medium">지역 수요조사</span>
            <Link href="/admin" className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
              <Settings className="w-4 h-4" />
              <span>관리자</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">단기임대 분석 지역 수요조사</h1>
          <p className="text-gray-500">원하시는 분석 지역을 선택해주세요. 최대 10개 지역까지 선택 가능합니다.</p>
        </div>

        <SurveyForm />
      </div>
    </main>
  )
}
