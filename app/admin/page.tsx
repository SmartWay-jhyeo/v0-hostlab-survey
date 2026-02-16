"use client"

import type React from "react"

import { useState } from "react"
import { AdminDashboard } from "@/components/admin"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ADMIN_PASSWORD = "hostlab2025"

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("비밀번호가 올바르지 않습니다.")
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            HostLab
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900">
              수요조사
            </Link>
            <span className="text-gray-900 font-medium">관리자</span>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto">
            <div className="border border-gray-200 rounded-lg p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
              <p className="text-gray-500 text-sm mb-6">결과를 확인하려면 관리자 비밀번호를 입력하세요.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  />
                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  로그인
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">수요조사 결과</h1>
              <p className="text-gray-500">제출된 수요조사 응답을 확인합니다.</p>
            </div>
            <AdminDashboard />
          </>
        )}
      </div>
    </main>
  )
}
