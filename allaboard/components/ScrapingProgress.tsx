'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Search, FileText, Brain } from 'lucide-react'

interface ScrapingProgressProps {
  url: string
  onComplete?: () => void
}

type ProgressStage =
  | 'initializing'
  | 'analyzing_homepage'
  | 'finding_links'
  | 'scraping_pages'
  | 'extracting_features'
  | 'generating_intelligence'
  | 'complete'

interface ProgressStep {
  id: ProgressStage
  label: string
  icon: React.ReactNode
  estimatedDuration: number // seconds
}

const PROGRESS_STEPS: ProgressStep[] = [
  {
    id: 'initializing',
    label: 'Initializing Playwright browser',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    estimatedDuration: 2
  },
  {
    id: 'analyzing_homepage',
    label: 'Analyzing homepage',
    icon: <Search className="w-4 h-4" />,
    estimatedDuration: 3
  },
  {
    id: 'finding_links',
    label: 'Discovering internal links',
    icon: <FileText className="w-4 h-4" />,
    estimatedDuration: 2
  },
  {
    id: 'scraping_pages',
    label: 'Scraping adjacent pages',
    icon: <FileText className="w-4 h-4" />,
    estimatedDuration: 8
  },
  {
    id: 'extracting_features',
    label: 'Extracting features & content',
    icon: <Brain className="w-4 h-4" />,
    estimatedDuration: 3
  },
  {
    id: 'generating_intelligence',
    label: 'Generating AI intelligence',
    icon: <Brain className="w-4 h-4" />,
    estimatedDuration: 5
  }
]

export default function ScrapingProgress({ url, onComplete }: ScrapingProgressProps) {
  const [currentStage, setCurrentStage] = useState<ProgressStage>('initializing')
  const [pagesAnalyzed, setPagesAnalyzed] = useState(0)
  const [wordsProcessed, setWordsProcessed] = useState(0)
  const [featuresFound, setFeaturesFound] = useState(0)

  useEffect(() => {
    // Simulate progress through stages
    let stageIndex = 0
    const interval = setInterval(() => {
      if (stageIndex < PROGRESS_STEPS.length) {
        const stage = PROGRESS_STEPS[stageIndex]
        setCurrentStage(stage.id)

        // Simulate metrics updates
        if (stage.id === 'analyzing_homepage') {
          setPagesAnalyzed(1)
          setWordsProcessed(847)
        } else if (stage.id === 'finding_links') {
          setWordsProcessed(prev => prev + 200)
        } else if (stage.id === 'scraping_pages') {
          const updatePages = setInterval(() => {
            setPagesAnalyzed(prev => {
              if (prev >= 5) {
                clearInterval(updatePages)
                return 5
              }
              return prev + 1
            })
            setWordsProcessed(prev => prev + Math.floor(Math.random() * 500) + 300)
          }, 1500)
        } else if (stage.id === 'extracting_features') {
          const updateFeatures = setInterval(() => {
            setFeaturesFound(prev => {
              if (prev >= 12) {
                clearInterval(updateFeatures)
                return 12
              }
              return prev + Math.floor(Math.random() * 3) + 1
            })
          }, 800)
        }

        stageIndex++
      } else {
        setCurrentStage('complete')
        onComplete?.()
        clearInterval(interval)
      }
    }, PROGRESS_STEPS[stageIndex]?.estimatedDuration * 1000 || 3000)

    return () => clearInterval(interval)
  }, [onComplete])

  const currentStepIndex = PROGRESS_STEPS.findIndex(s => s.id === currentStage)

  return (
    <div className="w-full max-w-2xl space-y-6 p-6 rounded-xl border-2 border-white/20 bg-white/90 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Analyzing Website</h3>
          <p className="text-sm text-gray-600 truncate font-mono">{url}</p>
        </div>
      </div>

      <div className="space-y-3">
        {PROGRESS_STEPS.map((step, index) => {
          const isComplete = index < currentStepIndex
          const isCurrent = index === currentStepIndex
          const isPending = index > currentStepIndex

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-300 ${
                isCurrent
                  ? 'bg-purple-100 border-2 border-purple-500 shadow-md'
                  : isComplete
                  ? 'bg-green-50 border-2 border-green-400'
                  : 'bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 ${isCurrent ? 'text-purple-600' : isComplete ? 'text-green-600' : 'text-gray-400'}`}>
                {isComplete ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${
                  isCurrent ? 'text-gray-900' : isComplete ? 'text-green-800' : 'text-gray-600'
                }`}>
                  {step.label}
                </div>
              </div>
              {isComplete && (
                <div className="text-sm font-bold text-green-600">✓</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t-2 border-gray-200">
        <div className="text-sm font-bold text-gray-800 mb-3">Intelligence Gathered:</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{pagesAnalyzed}</div>
            <div className="text-xs font-medium text-gray-700 mt-1">Pages Analyzed</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 border-2 border-purple-200">
            <div className="text-3xl font-bold text-purple-600">{wordsProcessed.toLocaleString()}</div>
            <div className="text-xs font-medium text-gray-700 mt-1">Words Processed</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 border-2 border-green-200">
            <div className="text-3xl font-bold text-green-600">{featuresFound}</div>
            <div className="text-xs font-medium text-gray-700 mt-1">Features Found</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
        <span>Powered by Playwright</span>
      </div>
    </div>
  )
}
