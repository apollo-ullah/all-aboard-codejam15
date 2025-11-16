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
    label: 'Initializing Browser.cash agent',
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
    <div className="w-full max-w-2xl space-y-6 p-6 rounded-xl border border-white/20 backdrop-blur-md" style={{ backgroundColor: 'rgba(204, 200, 226, 0.6)' }}>
      <div className="flex items-center gap-3">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        <div>
          <h3 className="text-lg font-semibold text-white">Analyzing Website</h3>
          <p className="text-sm text-white/60 truncate">{url}</p>
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
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isCurrent
                  ? 'bg-purple-500/20 border border-purple-400/30'
                  : isComplete
                  ? 'bg-green-500/10 border border-green-400/20'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className={`flex-shrink-0 ${isCurrent ? 'text-purple-400' : isComplete ? 'text-green-400' : 'text-white/40'}`}>
                {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isCurrent ? 'text-white' : isComplete ? 'text-green-300' : 'text-white/60'}`}>
                  {step.label}
                </div>
              </div>
              {isComplete && (
                <div className="text-xs text-green-400">✓</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t border-white/10">
        <div className="text-xs font-medium text-white/60 mb-3">Intelligence Gathered:</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-blue-400">{pagesAnalyzed}</div>
            <div className="text-xs text-white/60 mt-1">Pages Analyzed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-purple-400">{wordsProcessed.toLocaleString()}</div>
            <div className="text-xs text-white/60 mt-1">Words Processed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-green-400">{featuresFound}</div>
            <div className="text-xs text-white/60 mt-1">Features Found</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-white/40">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
        <span>Powered by Browser.cash Agent API</span>
      </div>
    </div>
  )
}
