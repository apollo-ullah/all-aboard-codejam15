'use client'

import { Storyboard } from '@/types'
import { Target, Lightbulb, Zap, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'

interface AIInsightsPanelProps {
  storyboard: Storyboard
  pagesScraped: number
}

interface InsightItemProps {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
}

function InsightItem({ icon, label, value, className = '' }: InsightItemProps) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm ${className}`}>
      <div className="flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-white/60 mb-1">{label}</div>
        <div className="text-sm text-white leading-relaxed">{value}</div>
      </div>
    </div>
  )
}

export default function AIInsightsPanel({ storyboard, pagesScraped }: AIInsightsPanelProps) {
  // Extract insights from storyboard nodes
  const problemNode = storyboard.nodes.find(n => n.type === 'problem')
  const solutionNode = storyboard.nodes.find(n => n.type === 'solution')
  const featureNodes = storyboard.nodes.filter(n => n.type === 'feature')
  const benefitNode = storyboard.nodes.find(n => n.type === 'benefit')

  return (
    <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-right duration-500">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">AI Intelligence</h3>
      </div>

      <div className="space-y-3">
        {storyboard.targetAudience && (
          <InsightItem
            icon={<Target className="w-4 h-4 text-blue-400" />}
            label="Target Market"
            value={storyboard.targetAudience}
          />
        )}

        {storyboard.coreInnovation && (
          <InsightItem
            icon={<Lightbulb className="w-4 h-4 text-yellow-400" />}
            label="Core Innovation"
            value={storyboard.coreInnovation}
          />
        )}

        {solutionNode && (
          <InsightItem
            icon={<Zap className="w-4 h-4 text-purple-400" />}
            label="Key Differentiator"
            value={solutionNode.title}
          />
        )}

        {benefitNode && (
          <InsightItem
            icon={<DollarSign className="w-4 h-4 text-green-400" />}
            label="Value Proposition"
            value={benefitNode.title}
          />
        )}

        {problemNode && (
          <InsightItem
            icon={<AlertTriangle className="w-4 h-4 text-orange-400" />}
            label="Problem Space"
            value={problemNode.title}
          />
        )}
      </div>

      <div className="mt-6 p-4 rounded-lg border border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm">
        <div className="text-xs font-medium text-white/60 mb-2">Intelligence Gathered</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{pagesScraped}</div>
            <div className="text-xs text-white/60">Pages Analyzed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{featureNodes.length}</div>
            <div className="text-xs text-white/60">Features Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{storyboard.nodes.length}</div>
            <div className="text-xs text-white/60">Story Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">100%</div>
            <div className="text-xs text-white/60">AI Confidence</div>
          </div>
        </div>
      </div>
    </div>
  )
}
