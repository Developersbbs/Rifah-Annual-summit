"use client"

import { useEffect, useState } from "react"

interface OfflineQueueItem {
  qr: string
  timestamp: number
  status: "pending" | "done" | "failed"
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueSize, setQueueSize] = useState(0)

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    // Sync queue when online
    if (!isOnline) return

    const syncQueue = async () => {
      const queue = JSON.parse(
        localStorage.getItem("offlineScanQueue") || "[]"
      ) as OfflineQueueItem[]

      let hasChanges = false

      for (const item of queue) {
        if (item.status === "done") continue

        try {
          const response = await fetch("/api/checkin/qr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ qr: item.qr }),
          })

          if (response.ok) {
            item.status = "done"
            hasChanges = true
          }
        } catch (error) {
          console.error("Failed to sync offline scan:", error)
          item.status = "failed"
          hasChanges = true
        }
      }

      if (hasChanges) {
        localStorage.setItem("offlineScanQueue", JSON.stringify(queue))
        updateQueueSize()
      }
    }

    // Sync immediately and then every 3 seconds
    syncQueue()
    const interval = setInterval(syncQueue, 3000)

    return () => clearInterval(interval)
  }, [isOnline])

  const updateQueueSize = () => {
    const queue = JSON.parse(
      localStorage.getItem("offlineScanQueue") || "[]"
    ) as OfflineQueueItem[]
    const pendingCount = queue.filter((item) => item.status === "pending").length
    setQueueSize(pendingCount)
  }

  const addToQueue = (qr: string) => {
    const queue = JSON.parse(
      localStorage.getItem("offlineScanQueue") || "[]"
    ) as OfflineQueueItem[]
    queue.push({
      qr,
      timestamp: Date.now(),
      status: "pending",
    })
    localStorage.setItem("offlineScanQueue", JSON.stringify(queue))
    updateQueueSize()
  }

  const clearQueue = () => {
    localStorage.removeItem("offlineScanQueue")
    updateQueueSize()
  }

  // Initialize queue size on mount
  useEffect(() => {
    updateQueueSize()
  }, [])

  return {
    isOnline,
    queueSize,
    addToQueue,
    clearQueue,
  }
}
