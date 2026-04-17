"use client"

import { useState } from "react"
import QRScanner from "@/components/qr-scanner"
import { useOfflineQueue } from "@/hooks/use-offline-queue"

interface ScanResult {
  success: boolean
  message: string
  participantName?: string
  memberName?: string
}

export default function QRScannerPage() {
  const [lastScan, setLastScan] = useState<ScanResult | null>(null)
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([])
  const { isOnline, queueSize } = useOfflineQueue()

  const handleScan = (result: ScanResult) => {
    setLastScan(result)
    setScanHistory((prev) => [result, ...prev].slice(0, 10)) // Keep last 10 scans

    // Clear the last scan result after 3 seconds
    setTimeout(() => {
      setLastScan(null)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Check-in Scanner</h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
              <span className={isOnline ? "text-green-600" : "text-red-600"}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {queueSize > 0 && (
              <div className="flex items-center gap-2 text-orange-600">
                <span>{queueSize} pending scans</span>
              </div>
            )}
          </div>
        </div>

        {/* Scanner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <QRScanner onScan={handleScan} />
        </div>

        {/* Last Scan Result */}
        {lastScan && (
          <div
            className={`rounded-lg shadow-md p-6 mb-6 ${
              lastScan.success ? "bg-green-50 border-2 border-green-500" : "bg-red-50 border-2 border-red-500"
            }`}
          >
            <div className="flex items-center gap-3">
              {lastScan.success ? (
                <div className="text-green-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="text-red-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div>
                <h3 className={`font-semibold ${lastScan.success ? "text-green-900" : "text-red-900"}`}>
                  {lastScan.success ? "Check-in Successful" : "Check-in Failed"}
                </h3>
                <p className={`text-sm ${lastScan.success ? "text-green-700" : "text-red-700"}`}>
                  {lastScan.message}
                </p>
                {lastScan.participantName && (
                  <p className="text-sm text-gray-600 mt-1">
                    {lastScan.memberName
                      ? `${lastScan.participantName} - ${lastScan.memberName}`
                      : lastScan.participantName}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Scan History */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h2>
            <div className="space-y-3">
              {scanHistory.map((scan, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    scan.success ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  {scan.success ? (
                    <div className="text-green-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${scan.success ? "text-green-900" : "text-red-900"}`}>
                      {scan.message}
                    </p>
                    {scan.participantName && (
                      <p className="text-xs text-gray-600">
                        {scan.memberName
                          ? `${scan.participantName} - ${scan.memberName}`
                          : scan.participantName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
