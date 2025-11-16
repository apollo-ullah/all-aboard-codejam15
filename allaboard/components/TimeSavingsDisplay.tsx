'use client'

import { useEffect, useState } from 'react'
import { Clock, Zap, TrendingUp } from 'lucide-react'

interface TimeSavingsDisplayProps {
  stage: 'scraping' | 'storyboard' | 'generating' | 'complete'
  startTime?: number
}

const STAGE_INFO = {
  scraping: {
    label: 'Website Analysis',
    manualTime: 45, // minutes
    icon: '🌐'
  },
  storyboard: {
    label: 'Story Creation',
    manualTime: 120, // minutes (2 hours)
    icon: '📝'
  },
  generating: {
    label: 'Slide Generation',
    manualTime: 60, // minutes (1 hour)
    icon: '🎨'
  },
  complete: {
    label: 'Total Process',
    manualTime: 255, // minutes (4 hours 15 minutes)
    icon: '✅'
  }
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}m ${secs}s`
}

function formatManualTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }
  return `${hours}h ${mins}m`
}

export default function TimeSavingsDisplay({ stage, startTime }: TimeSavingsDisplayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!startTime) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const stageInfo = STAGE_INFO[stage]
  const manualTimeMinutes = stageInfo.manualTime
  const savedMinutes = Math.max(0, manualTimeMinutes - Math.floor(elapsedSeconds / 60))
  const savedDollars = Math.floor(savedMinutes * (80 / 60)) // $80/hour rate

  return (
    <div className="w-full max-w-md space-y-4 p-6 rounded-xl border-2 border-white/20 bg-white/90 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Time Savings</h3>
        </div>
        <span className="text-2xl">{stageInfo.icon}</span>
      </div>

      <div className="space-y-4">
        {/* Current Progress */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">{stageInfo.label}</span>
          </div>
          <div className="text-lg font-mono font-bold text-blue-600">
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Manual Time */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border-2 border-gray-200">
          <span className="text-sm font-medium text-gray-700">Manual Time:</span>
          <div className="text-lg font-mono font-bold text-gray-500 line-through">
            {formatManualTime(manualTimeMinutes)}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-gray-200" />

        {/* Time Saved */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border-2 border-green-400 shadow-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-gray-900">Time Saved:</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatManualTime(savedMinutes)}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border-2 border-yellow-400 shadow-sm">
            <span className="text-sm font-semibold text-gray-900">Cost Savings:</span>
            <div className="text-2xl font-bold text-yellow-600">
              ${savedDollars}
            </div>
          </div>
        </div>

        {stage === 'complete' && (
          <div className="mt-4 p-4 rounded-lg bg-purple-50 border-2 border-purple-300">
            <div className="text-xs text-gray-700 text-center font-medium">
              💡 At $80/hr, that's <span className="font-bold text-purple-700">${savedDollars}</span> saved per deck.
              <br />
              10 decks/week = <span className="font-bold text-purple-700">${savedDollars * 10}/week</span> = <span className="font-bold text-purple-700">${(savedDollars * 10 * 52).toLocaleString()}/year</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
