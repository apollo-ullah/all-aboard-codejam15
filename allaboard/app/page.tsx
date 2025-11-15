'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Github, ChevronDown, Settings2, Zap } from 'lucide-react'
import Background from '@/components/background'

type Mode = 'speed' | 'simple' | 'advanced'
type OutputType = 'video' | 'slides'
type StyleType = 'vc-pitch' | 'hackathon' | 'recruiter' | 'sales' | 'onboarding' | 'technical'

const styles = [
  { value: 'vc-pitch', label: 'VC Pitch' },
  { value: 'hackathon', label: 'Hackathon Pitch' },
  { value: 'recruiter', label: 'Recruiter/Portfolio' },
  { value: 'sales', label: 'Sales' },
  { value: 'onboarding', label: 'Internal Team Onboarding' },
  { value: 'technical', label: 'Technical Walkthrough' },
]

const sectors = [
  'Finance', 'Healthcare', 'Deeptech', 'AI', 'Bio and Health', 'Consumer',
  'SaaS', 'Fintech', 'Education', 'Robotics/Hardware', 'E-commerce',
  'Enterprise Security', 'Media/Entertainment', 'Transportation/Mobility',
  'Government/Public Sector', 'Food Tech', 'Gaming'
]

export default function Home() {
  const [mode, setMode] = useState<Mode>('simple')
  const [outputType, setOutputType] = useState<OutputType>('video')
  const [githubUrl, setGithubUrl] = useState('')
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState<StyleType>('vc-pitch')
  const [sector, setSector] = useState('')
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  useEffect(() => {
    if (githubUrl) {
      setShowPlaceholder(false)
    } else {
      setShowPlaceholder(true)
    }
  }, [githubUrl])

  const handleGenerate = () => {
    console.log('[v0] Generate clicked', { mode, outputType, githubUrl, description, style, sector })
  }

  const modeConfig = {
    speed: { label: 'Speed', icon: Zap, color: 'text-violet-500' },
    simple: { label: 'Simple', icon: Sparkles, color: 'text-purple-500' },
    advanced: { label: 'Advanced', icon: Settings2, color: 'text-indigo-500' }
  }

  const CurrentModeIcon = modeConfig[mode].icon

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      <Background />

      <div className="relative z-50 border-b border-border/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/30 flex items-center justify-center backdrop-blur-xl border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" strokeWidth={2} />
            </div>
            <span className="font-semibold text-foreground tracking-tight">STORYTEX</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setModeMenuOpen(!modeMenuOpen)}
              className="glass flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent/50 transition-all text-sm font-medium"
            >
              <CurrentModeIcon className={`w-4 h-4 ${modeConfig[mode].color}`} strokeWidth={2} />
              <span>{modeConfig[mode].label}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${modeMenuOpen ? 'rotate-180' : ''}`} strokeWidth={2} />
            </button>

            {modeMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 glass rounded-xl overflow-hidden shadow-xl border border-border/40 mode-menu-enter">
                {(Object.keys(modeConfig) as Mode[]).map((m) => {
                  const Icon = modeConfig[m].icon
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m)
                        setModeMenuOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-all ${
                        mode === m ? 'bg-accent/30' : ''
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${modeConfig[m].color}`} strokeWidth={2} />
                      <span className="text-sm font-medium">{modeConfig[m].label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-4">
          
          <div className="relative w-full overflow-visible rounded-2xl">
            {/* Outer glow ring */}
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-tr from-primary/30 via-secondary/20 to-primary/30 opacity-60 blur-xl"></div>
            
            {/* Main glow effect - multiple layers */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
              <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-primary/50 via-secondary/40 to-primary/40 opacity-50 blur-[80px] animate-pulse-slow"></div>
              <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-secondary/40 to-primary/50 opacity-40 blur-[60px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            </div>
            
            {/* Enhanced glass layer with stronger blur and borders */}
            <div className="absolute inset-0 backdrop-blur-2xl bg-white/15 border-2 border-white/30 rounded-2xl shadow-2xl"></div>
            
            {/* Content */}
            <div className="relative rounded-2xl p-4 space-y-3">
            
              <div className="relative h-[60px] w-full rounded-2xl bg-background/80 backdrop-blur-xl border-2 border-border/40 overflow-hidden shadow-lg">
                <div className="absolute inset-0 z-10 flex items-center rounded-[inherit] p-2 pl-4">
                  <div className="relative mr-3 size-6">
                    <svg
                      width="7"
                      height="7"
                      viewBox="0 0 7 7"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute"
                      style={{
                        transform: 'translateX(8px) translateY(10px) scale(3) rotate(180deg)',
                      }}
                    >
                      <path
                        d="M4.55 2.45L3.5 0L2.45 2.45L0 3.5L2.45 4.55L3.5 7L4.55 4.55L7 3.5L4.55 2.45Z"
                        fill="hsl(var(--primary))"
                        className="animate-pulse"
                      />
                    </svg>
                    <svg
                      width="7"
                      height="7"
                      viewBox="0 0 7 7"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute"
                      style={{
                        transform: 'translateY(-6px) rotate(180deg)',
                      }}
                    >
                      <path
                        d="M4.55 2.45L3.5 0L2.45 2.45L0 3.5L2.45 4.55L3.5 7L4.55 4.55L7 3.5L4.55 2.45Z"
                        fill="hsl(var(--primary))"
                        className="animate-pulse"
                        style={{ animationDelay: '0.5s' }}
                      />
                    </svg>
                  </div>

                  <input
                    type="url"
                    placeholder=""
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    onFocus={() => setShowPlaceholder(false)}
                    onBlur={() => !githubUrl && setShowPlaceholder(true)}
                    className="flex-1 bg-transparent border-none outline-none text-sm md:text-base font-medium tracking-tight text-foreground placeholder:text-transparent"
                  />

                  {showPlaceholder && !githubUrl && (
                    <div className="absolute left-[52px] pointer-events-none">
                      <div className="text-sm md:text-base font-medium tracking-tight text-muted-foreground/60">
                        {'Paste your GitHub repository URL...'.split('').map((char, i) => (
                          <span
                            key={i}
                            className="inline-block animate-blur-in"
                            style={{
                              animationDelay: `${i * 0.03}s`,
                            }}
                          >
                            {char === ' ' ? '\u00A0' : char}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {mode === 'speed' && null}

              {mode === 'simple' && (
                <Textarea
                  placeholder="Describe what story you want to tell... (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-background/80 backdrop-blur-sm border-2 border-border/40 rounded-xl resize-none focus:border-primary/50 transition-all text-sm shadow-md"
                />
              )}

              {mode === 'advanced' && (
                <div className="space-y-3 advanced-options-enter">
                  <Textarea
                    placeholder="Describe what story you want to tell... (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="bg-background/80 backdrop-blur-sm border-2 border-border/40 rounded-xl resize-none focus:border-primary/50 transition-all text-sm shadow-md"
                  />

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Settings2 className="w-3.5 h-3.5" strokeWidth={2} />
                      Presentation Style
                    </label>
                    <Select value={style} onValueChange={(value) => setStyle(value as StyleType)}>
                      <SelectTrigger className="h-10 bg-background/80 backdrop-blur-sm border-2 border-border/40 rounded-lg text-sm shadow-md">
                        <SelectValue placeholder="Select style..." />
                      </SelectTrigger>
                      <SelectContent>
                        {styles.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-sm">
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Target Sector</label>
                    <Select value={sector} onValueChange={setSector}>
                      <SelectTrigger className="h-10 bg-background/80 backdrop-blur-sm border-2 border-border/40 rounded-lg text-sm shadow-md">
                        <SelectValue placeholder="Select sector..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map((s) => (
                          <SelectItem key={s} value={s.toLowerCase().replace(/\s+/g, '-')} className="text-sm">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <div className="flex gap-1 glass rounded-lg p-1">
                  <button
                    onClick={() => setOutputType('video')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      outputType === 'video'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => setOutputType('slides')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      outputType === 'slides'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Slides
                  </button>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!githubUrl}
                  className="flex-1 h-9 rounded-lg font-medium text-sm disabled:opacity-50 shimmer disabled:shimmer-none transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 mr-2" strokeWidth={2} />
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground/60">
            {mode === 'speed' && 'Lightning fast generation with smart defaults'}
            {mode === 'simple' && 'Customize your story with optional context'}
            {mode === 'advanced' && 'Full control over presentation style and targeting'}
          </p>
        </div>
      </div>

      {modeMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setModeMenuOpen(false)}
        />
      )}
    </div>
  )
}
