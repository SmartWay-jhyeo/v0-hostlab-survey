"use client"

import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface RegionItemProps {
  region: string
  count: number
  isSelected: boolean
  isServerRegion: boolean
  mode: "pending" | "completed"
  isUpdating: boolean
  onToggleSelect: () => void
  onToggleStatus: () => void
}

export function RegionItem({
  region,
  count,
  isSelected,
  isServerRegion,
  mode,
  isUpdating,
  onToggleSelect,
  onToggleStatus,
}: RegionItemProps) {
  const isPending = mode === "pending"

  return (
    <div
      className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
        isSelected
          ? "border-gray-900 bg-gray-50"
          : isPending
            ? isServerRegion
              ? "border-green-200 bg-green-50/50 hover:border-green-300"
              : "border-gray-200 hover:border-gray-300"
            : "border-green-300 bg-green-50 hover:border-green-400"
      }`}
      onClick={onToggleSelect}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
        />
        {!isPending && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
        <span className="text-sm text-gray-700 truncate">{region}</span>
        <span className="text-xs text-gray-400">{count}표</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className={`h-7 px-2 ${
          isPending
            ? "text-green-600 hover:text-green-700 hover:bg-green-50"
            : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        }`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleStatus()
        }}
        disabled={isUpdating}
      >
        {isPending ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </Button>
    </div>
  )
}
