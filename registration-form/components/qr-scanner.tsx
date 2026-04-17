"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface ScanResult {
  success: boolean
  message: string
  participantName?: string
  memberName?: string
}

export default function QRScanner({ onScan }: { onScan: (result: ScanResult) => void }) {
  const [isScanning, setIsScanning] = useState(true)
  const [lastScan, setLastScan] = useState<string>("")
  const scanCooldownRef = useRef<number>(0)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerId = useRef("qr-scanner-container")

  useEffect(() => {
    if (isScanning) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startScanner()
      }, 100)
      return () => clearTimeout(timer)
    } else {
      stopScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isScanning])

  const startScanner = async () => {
    const container = document.getElementById(containerId.current)
    if (!container) {
      console.error("Scanner container not found")
      return
    }

    try {
      const html5QrCode = new Html5Qrcode(containerId.current)
      scannerRef.current = html5QrCode

      // Responsive qrbox size based on screen width
      const isMobile = window.innerWidth < 640
      const qrboxSize = isMobile ? 200 : 250

      const config = {
        fps: 10,
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
      }

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        handleScan,
        (errorMessage: string) => {
          // Ignore scan errors (normal behavior when no QR in view)
        }
      )
    } catch (error) {
      console.error("Failed to start scanner:", error)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch (error) {
        console.error("Failed to stop scanner:", error)
      }
    }
  }

  const handleScan = async (result: string) => {
    // Prevent duplicate scans within 2 seconds
    const now = Date.now()
    if (now - scanCooldownRef.current < 2000) return
    if (result === lastScan) return

    scanCooldownRef.current = now
    setLastScan(result)

    try {
      const response = await fetch("/api/checkin/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qr: result }),
      })

      const data = await response.json()

      if (data.success) {
        // Play success sound
        playSuccessSound()
        // Vibrate device
        if (navigator.vibrate) {
          navigator.vibrate(200)
        }
      } else {
        // Play error sound
        playErrorSound()
        // Vibrate with error pattern
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }
      }

      onScan(data)
    } catch (error) {
      console.error("Scan error:", error)
      // Queue for offline processing
      queueOfflineScan(result)
      onScan({
        success: false,
        message: "Network error - queued for retry",
      })
    }
  }

  const playSuccessSound = () => {
    const audio = new Audio("/success.mp3")
    audio.play().catch(() => {
      // Audio play failed (browser policy), silent fail
    })
  }

  const playErrorSound = () => {
    const audio = new Audio("/error.mp3")
    audio.play().catch(() => {
      // Audio play failed (browser policy), silent fail
    })
  }

  const queueOfflineScan = (qr: string) => {
    const queue = JSON.parse(localStorage.getItem("offlineScanQueue") || "[]")
    queue.push({
      qr,
      timestamp: Date.now(),
      status: "pending",
    })
    localStorage.setItem("offlineScanQueue", JSON.stringify(queue))
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      {isScanning ? (
        <div className="relative">
          <div
            id={containerId.current}
            className="w-full bg-black rounded-lg overflow-hidden"
            style={{ minHeight: '300px', maxHeight: '500px' }}
          />
          {/* Scan overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 sm:w-64 sm:h-64 border-4 border-green-500 rounded-lg opacity-50" />
            </div>
            {/* Corner markers */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-l-4 border-green-500" />
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-t-4 border-r-4 border-green-500" />
            <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-l-4 border-green-500" />
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-8 sm:h-8 border-b-4 border-r-4 border-green-500" />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsScanning(true)}
          className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Scanner
        </button>
      )}
    </div>
  )
}
