"use client"

import { useState, useCallback } from "react"

export function useBulkSelection<T = string>() {
  const [selected, setSelected] = useState<Set<T>>(new Set())

  const toggle = useCallback((item: T) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback((items: T[]) => {
    setSelected((prev) => {
      if (prev.size === items.length && items.length > 0) {
        return new Set()
      }
      return new Set(items)
    })
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])

  const isAllSelected = useCallback(
    (items: T[]) => items.length > 0 && selected.size === items.length,
    [selected]
  )

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    isAllSelected,
  }
}
