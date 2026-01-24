'use client'

import { Suspense } from 'react'
import DashboardClient from './gauge/[id]/DashboardClient'

// Loading fallback for Suspense
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
        <span className="text-gray-500">Loading dashboard...</span>
      </div>
    </div>
  )
}

// Main page - uses shared DashboardClient without initialGaugeId
// This restores gauge selection from localStorage
export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardClient />
    </Suspense>
  )
}
