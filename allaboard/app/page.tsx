'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Settings2, Zap, ArrowLeft, MessageSquare, Loader2 } from 'lucide-react'
import Background from '@/components/background'
import StoryboardCanvas from '@/components/StoryboardCanvas'
import StoryboardAssistant from '@/components/StoryboardAssistant'
import PresentationViewer from '@/components/PresentationViewer'
import AIInsightsPanel from '@/components/AIInsightsPanel'
import TimeSavingsDisplay from '@/components/TimeSavingsDisplay'
import ScrapingProgress from '@/components/ScrapingProgress'
import { DemoVideoGenerator } from '@/components/DemoVideoGenerator'
import { api } from '@/lib/api'
import { Storyboard } from '@/types'
import { applyNarrativeArc } from '@/lib/narrativeArcs'

type Mode = 'speed' | 'simple' | 'advanced'
type OutputType = 'video' | 'slides'
type StyleType = 'vc-pitch' | 'hackathon' | 'recruiter' | 'sales' | 'onboarding' | 'technical'
type AnalysisMode = 'standard' | 'competitive' | 'briefing' | 'partnership'
type Stage = 'input' | 'scraping' | 'storyboard' | 'generating' | 'presentation'

const styles = [
  { value: 'vc-pitch', label: 'VC Pitch Deck' },
  { value: 'hackathon', label: 'Hackathon Demo' },
  { value: 'recruiter', label: 'Portfolio Showcase' },
  { value: 'sales', label: 'Product Demo' },
  { value: 'onboarding', label: 'Team Onboarding' },
  { value: 'technical', label: 'Technical Walkthrough' },
]

const sectors = [
  'Finance', 'Healthcare', 'Deeptech', 'AI', 'Bio and Health', 'Consumer',
  'SaaS', 'Fintech', 'Education', 'Robotics/Hardware', 'E-commerce',
  'Enterprise Security', 'Media/Entertainment', 'Transportation/Mobility',
  'Government/Public Sector', 'Food Tech', 'Gaming'
]

export default function Home() {
  // UI State
  const [mode, setMode] = useState<Mode>('simple')
  const [outputType, setOutputType] = useState<OutputType>('slides')
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  // Form State
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [style, setStyle] = useState<StyleType>('vc-pitch')
  const [sector, setSector] = useState('')
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('competitive')

  // Application State
  const [stage, setStage] = useState<Stage>('input')
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null)
  const [sourceUrl, setSourceUrl] = useState('') // Store the original URL permanently
  const [presentationUrl, setPresentationUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState<string | undefined>(undefined)
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>(undefined)
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined)
  const [slideCount, setSlideCount] = useState(0)
  const [pagesScraped, setPagesScraped] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(true)
  const [demoVideoOpen, setDemoVideoOpen] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState<string>('')
  const [processStartTime, setProcessStartTime] = useState<number | undefined>(undefined)

  // Backend connection status
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)

  useEffect(() => {
    if (url) {
      setShowPlaceholder(false)
    } else {
      setShowPlaceholder(true)
    }
  }, [url])

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        await api.testConnection()
        setBackendConnected(true)
        console.log('✅ Backend connection verified')
      } catch (error: any) {
        setBackendConnected(false)
        console.error('❌ Backend connection failed:', error)
      }
    }
    testConnection()
  }, [])

  const handleGenerate = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setStage('scraping')
    setError(null)
    setProcessStartTime(Date.now())
    setSourceUrl(url.trim()) // Save the URL permanently

    try {
      // Test connection first
      await api.testConnection()
      setBackendConnected(true)

      // Scrape and generate storyboard with analysis mode
      const response = await api.scrapeWebsite(url.trim(), analysisMode)
      console.log('📦 Received storyboard response:', response)

      if (response.storyboard) {
        setStoryboard(response.storyboard)
        setPagesScraped(response.scrapedData?.pagesScraped || 0)
        setStage('storyboard')
      } else {
        throw new Error('No storyboard data received')
      }
    } catch (error: any) {
      console.error('Generate error:', error)
      setError(error.message || 'Failed to generate storyboard')
      setStage('input')
      setBackendConnected(false)
    }
  }

  const handleGenerateSlides = async () => {
    if (!storyboard) return

    setStage('generating')
    setError(null)

    try {
      // Map style to YC or Finance
      const slideStyle: 'YC' | 'Finance' = style === 'vc-pitch' || style === 'hackathon' ? 'YC' : 'Finance'

      const response = await api.generateSlides(storyboard, slideStyle)
      setPresentationUrl(response.presentationUrl)
      setEmbedUrl(response.embedUrl)
      setDownloadUrl(response.downloadUrl)
      setPdfUrl(response.pdfUrl)
      setSlideCount(response.slideCount)
      setStage('presentation')
    } catch (error: any) {
      console.error('Slide generation error:', error)
      setError(error.message || 'Failed to generate slides')
      setStage('storyboard')
    }
  }

  const handleGenerateDemoVideo = async () => {
    console.log('🎬🎬🎬 DEMO VIDEO BUTTON CLICKED!', { storyboard, url, sourceUrl })
    
    if (!storyboard || !sourceUrl) {
      console.error('❌ Missing storyboard or URL:', { storyboard, url, sourceUrl })
      alert('Please generate a storyboard first!')
      return
    }
    
    console.log('✅ Starting video generation with URL:', sourceUrl)
    setIsGeneratingVideo(true)
    setVideoProgress('🎬 Starting AI demo video generation...')
    
    try {
      setVideoProgress('🚀 Launching browser and starting recording...')
      console.log('📞 Calling API with URL:', sourceUrl)
      
      const response = await api.generateDemoVideo(sourceUrl, storyboard, {
        duration: 45,
        voiceModel: 'alloy',
      })
      
      console.log('✅ Video generated!', response)
      setVideoProgress('✅ Demo video generated successfully!')
      
      // Download the video automatically
      setTimeout(() => {
        const videoFilename = response.videoPath.split('/').pop() || ''
        const downloadUrl = api.getDemoVideoUrl(videoFilename)
        console.log('📥 Downloading video:', downloadUrl)
        window.open(downloadUrl, '_blank')
        setVideoProgress('')
      }, 1500)
      
    } catch (err: any) {
      console.error('❌ Demo video generation error:', err)
      setVideoProgress(`❌ Error: ${err.message || 'Failed to generate demo video'}`)
      setTimeout(() => setVideoProgress(''), 5000)
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  const handleLoadTestData = () => {
    const testStoryboard: Storyboard = {
      title: 'STORYTEX AI Platform',
      tagline: 'Transforming websites into compelling presentations',
      nodes: [
        {
          id: 'node-1',
          type: 'title',
          title: 'STORYTEX',
          content: 'AI-powered website-to-presentation platform',
          speakerNotes: 'Welcome to STORYTEX, the revolutionary platform that transforms any website into a professional presentation using AI-powered web scraping and intelligent content analysis.',
          position: { x: 0, y: 0 }
        },
        {
          id: 'node-2',
          type: 'problem',
          title: 'The Problem',
          content: '• Manual presentation creation is time-consuming\n• Extracting key information from websites is tedious\n• Maintaining consistent narrative flow is challenging',
          speakerNotes: 'Creating presentations from web content typically requires hours of manual work, copying and pasting information, and struggling to maintain a coherent narrative structure.',
          position: { x: 350, y: 0 }
        },
        {
          id: 'node-3',
          type: 'solution',
          title: 'Our Solution',
          content: '• AI agentic web scraping with Browser.cash\n• GPT-4o powered storyboard generation\n• Interactive drag-and-drop editing canvas\n• GAMMA API slide generation',
          speakerNotes: 'STORYTEX uses cutting-edge AI to automatically scrape websites, analyze content, and generate structured storyboards that can be edited interactively before converting to professional slides.',
          position: { x: 700, y: 0 }
        },
        {
          id: 'node-4',
          type: 'feature',
          title: 'Smart Web Scraping',
          content: '• Browser.cash AI agents for intelligent content extraction\n• Multi-page analysis (main + adjacent pages)\n• Context-aware content filtering',
          speakerNotes: 'Our platform leverages Browser.cash AI agents to intelligently navigate and extract meaningful content from websites, analyzing not just the main page but relevant adjacent pages for comprehensive understanding.',
          position: { x: 1050, y: 0 }
        },
        {
          id: 'node-5',
          type: 'feature',
          title: 'AI Storyboard Generation',
          content: '• OpenAI GPT-4o for content analysis\n• Narrative arc templates (YC, Finance)\n• Structured presentation flow\n• Speaker notes generation',
          speakerNotes: 'Using OpenAI GPT-4o, we transform raw web content into structured storyboards with proper narrative flow, complete with speaker notes and optimized for different presentation styles.',
          position: { x: 1400, y: 0 }
        },
        {
          id: 'node-6',
          type: 'feature',
          title: 'Interactive Canvas',
          content: '• React Flow-based drag-and-drop editing\n• Real-time node manipulation\n• AI assistant for improvements\n• Narrative arc application',
          speakerNotes: 'The interactive canvas allows users to fine-tune their presentations with drag-and-drop editing, AI-powered suggestions, and the ability to apply different narrative structures.',
          position: { x: 1750, y: 0 }
        },
        {
          id: 'node-7',
          type: 'benefit',
          title: 'Key Benefits',
          content: '• 90% reduction in presentation creation time\n• Professional, consistent narrative structure\n• Seamless integration with existing workflows\n• Multiple output formats (slides, video)',
          speakerNotes: 'Users experience dramatic time savings while producing higher-quality presentations with professional narrative structure and multiple export options.',
          position: { x: 2100, y: 0 }
        },
        {
          id: 'node-8',
          type: 'cta',
          title: 'Try STORYTEX Today',
          content: '🚀 Transform any website into a compelling presentation\n• Enter a URL\n• Get AI-generated storyboard\n• Edit interactively\n• Export professional slides',
          speakerNotes: 'Ready to revolutionize your presentation workflow? Try STORYTEX today and experience the power of AI-driven content transformation.',
          position: { x: 2450, y: 0 }
        }
      ]
    }

    console.log('🧪 Loading test storyboard data')
    setStoryboard(testStoryboard)
    setStage('storyboard')
    setError(null)
  }

  const handleReset = () => {
    setStage('input')
    setUrl('')
    setSourceUrl('')
    setStoryboard(null)
    setPresentationUrl('')
    setEmbedUrl(undefined)
    setDownloadUrl(undefined)
    setPdfUrl(undefined)
    setSlideCount(0)
    setError(null)
    setDescription('')
  }

  const handleClosePresentation = () => {
    setStage('storyboard')
  }

  const handleApplyArc = () => {
    if (!storyboard) return
    const slideStyle: 'YC' | 'Finance' = style === 'vc-pitch' || style === 'hackathon' ? 'YC' : 'Finance'
    const updated = applyNarrativeArc(storyboard, slideStyle)
    setStoryboard(updated)
  }

  const handleNodesChange = useCallback((nodes: Storyboard['nodes']) => {
    setStoryboard(prev => prev ? { ...prev, nodes } : null)
  }, [])

  const modeConfig = {
    speed: { label: 'Speed', icon: Zap, color: 'text-violet-500' },
    simple: { label: 'Simple', icon: Sparkles, color: 'text-purple-500' },
    advanced: { label: 'Advanced', icon: Settings2, color: 'text-indigo-500' }
  }

  const CurrentModeIcon = modeConfig[mode].icon

  // Render different stages
  if (stage === 'scraping') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background flex flex-col items-center justify-center p-6">
        <Background />
        <div className="relative z-10 w-full max-w-6xl space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: '#6B5B95' }}>Analyzing Your Project</h2>
            <p className="text-white/70">Extracting insights from your website or repo to build your pitch deck</p>
          </div>

          <div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 py-8 rounded-2xl backdrop-blur-2xl border-2 border-white/30 shadow-2xl"
            style={{ 
              backgroundColor: 'rgba(178, 175, 210, 0.2)',
              boxShadow: '0 20px 60px rgba(107, 91, 149, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            }}
          >
            <ScrapingProgress url={url} />
            {processStartTime && (
              <TimeSavingsDisplay stage="scraping" startTime={processStartTime} />
            )}
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'generating') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-background flex flex-col items-center justify-center">
        <Background />
          <div className="relative z-10 text-center space-y-4">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Creating Your Pitch Deck...</h2>
          <p className="text-muted-foreground">Generating VC-ready slides that do your project justice</p>
          <p className="text-sm text-muted-foreground/60">This may take a few minutes</p>
        </div>
      </div>
    )
  }

  if (stage === 'storyboard' && storyboard) {
    const slideStyle: 'YC' | 'Finance' = style === 'vc-pitch' || style === 'hackathon' ? 'YC' : 'Finance'

    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-[#E8E6F2] via-[#D4D1E8] to-[#C5C1DC] relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#A9A4CC]/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#B8B3D6]/30 rounded-full blur-3xl"></div>
        
        {/* Header - Glassmorphism */}
        <div className="bg-white/40 backdrop-blur-xl shadow-lg px-6 py-4 flex items-center justify-between border-b border-white/40 z-10 relative">
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="text-gray-700 hover:text-gray-900 flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/70 transition-all duration-200 backdrop-blur-sm border border-[#A9A4CC]/25 hover:border-[#A9A4CC]/40 shadow-sm"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div className="h-6 w-px bg-[#A9A4CC]/30"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{storyboard.title}</span>
              {storyboard.tagline && (
                <span className="text-xs text-gray-600 font-medium">• {storyboard.tagline}</span>
              )}
            </div>
            {(storyboard.targetAudience || storyboard.coreInnovation) && (
              <>
                <div className="h-6 w-px bg-[#A9A4CC]/30"></div>
                <button
                  onClick={() => setInsightsPanelOpen(!insightsPanelOpen)}
                  className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm border shadow-sm ${
                    insightsPanelOpen
                      ? 'bg-[#A9A4CC] text-white border-[#A9A4CC]/60 shadow-lg shadow-[#A9A4CC]/30 scale-[0.98]'
                      : 'bg-white/60 text-gray-700 border-[#A9A4CC]/30 hover:bg-white/80 hover:text-gray-900 hover:border-[#A9A4CC]/40'
                  }`}
                  title="Toggle AI Insights"
                >
                  🧠 AI Insights
                </button>
              </>
            )}
            <div className="h-6 w-px bg-[#A9A4CC]/30"></div>
            <button
              onClick={handleApplyArc}
              className="text-sm px-4 py-2 bg-[#A9A4CC]/20 text-[#7A6FA8] border border-[#A9A4CC]/40 rounded-xl hover:bg-[#A9A4CC]/30 hover:text-[#6B5F98] transition-all duration-200 backdrop-blur-sm font-medium shadow-sm"
              title="Reorder slides to match narrative arc"
            >
              📊 Apply Narrative Arc
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-[#7A6FA8] bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-[#A9A4CC]/30 shadow-sm">
              {storyboard.nodes.length} {storyboard.nodes.length === 1 ? 'slide' : 'slides'}
            </div>
            <button
              onClick={() => setAssistantOpen(!assistantOpen)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm border flex items-center gap-2 shadow-sm hover:shadow-md ${
                assistantOpen
                  ? 'bg-gradient-to-r from-[#A9A4CC] to-[#B8B3D6] text-white border-[#A9A4CC]/50 shadow-lg shadow-[#A9A4CC]/25 scale-[0.98]'
                  : 'bg-white/60 text-gray-700 border-[#A9A4CC]/30 hover:bg-white/80 hover:text-gray-900 hover:border-[#A9A4CC]/40'
              }`}
              title="AI Assistant"
            >
              <MessageSquare size={18} /> AI Assistant
            </button>
            <button
              onClick={handleGenerateDemoVideo}
              disabled={isGeneratingVideo}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 backdrop-blur-sm border flex items-center gap-2 shadow-sm hover:shadow-md ${
                isGeneratingVideo
                  ? 'bg-gradient-to-r from-[#A9A4CC] to-[#C5B8D6] text-white border-[#A9A4CC]/50 shadow-lg shadow-[#A9A4CC]/25 cursor-wait'
                  : 'bg-white/60 text-gray-700 border-[#A9A4CC]/30 hover:bg-white/80 hover:text-gray-900 hover:border-[#A9A4CC]/40 hover:scale-[1.02]'
              }`}
              title="Generate AI Demo Video"
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  🎬 Demo Video
                </>
              )}
            </button>
            <button
              onClick={handleGenerateSlides}
              className="bg-gradient-to-r from-[#22C55E] to-[#10B981] text-white px-7 py-2.5 rounded-xl font-semibold hover:from-[#16A34A] hover:to-[#059669] transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-500/30 border border-green-400/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              Generate Slides
            </button>
          </div>
        </div>

        {/* Video Progress Toast */}
        {videoProgress && (
          <div className="absolute top-20 right-6 z-50 bg-gradient-to-r from-[#A9A4CC] to-[#C5B8D6] text-white px-6 py-3 rounded-xl shadow-xl shadow-[#A9A4CC]/30 backdrop-blur-xl border border-white/20 animate-in slide-in-from-top">
            <p className="text-sm font-medium">{videoProgress}</p>
          </div>
        )}

        {/* Canvas with optional sidebar */}
        <div className="flex-1 overflow-hidden relative flex">
          <div className="flex-1 overflow-hidden relative">
            <StoryboardCanvas
              initialNodes={storyboard.nodes}
              onNodesChange={handleNodesChange}
            />
            <StoryboardAssistant
              storyboard={storyboard}
              style={slideStyle}
              isOpen={assistantOpen}
              onClose={() => setAssistantOpen(false)}
              onStoryboardUpdate={(updated) => setStoryboard(updated)}
            />
          </div>

          {/* AI Insights Sidebar - Light Purple Glassmorphism */}
          {insightsPanelOpen && (storyboard.targetAudience || storyboard.coreInnovation) && (
            <div className="w-96 bg-gradient-to-br from-white/50 to-[#A9A4CC]/20 backdrop-blur-xl border-l border-white/40 p-6 overflow-y-auto">
              <AIInsightsPanel storyboard={storyboard} pagesScraped={pagesScraped} />
            </div>
          )}
        </div>

        {/* Demo Video Generator Section - Light Glassmorphism Style */}
        {(() => {
          console.log('🎬 Demo Video render check:', { demoVideoOpen, hasUrl: !!url, hasStoryboard: !!storyboard });
          if (demoVideoOpen && url && storyboard) {
            console.log('🎬 Rendering DemoVideoGenerator component');
            return (
              <div className="border-t border-white/40 bg-gradient-to-b from-white/30 to-[#A9A4CC]/20 backdrop-blur-xl p-6 overflow-y-auto max-h-96">
                <DemoVideoGenerator url={url} storyboard={storyboard} />
              </div>
            );
          }
          return null;
        })()}
      </div>
    )
  }

  if (stage === 'presentation' && presentationUrl) {
    return (
      <PresentationViewer
        presentationUrl={presentationUrl}
        embedUrl={embedUrl}
        downloadUrl={downloadUrl}
        pdfUrl={pdfUrl}
        slideCount={slideCount}
        onClose={handleClosePresentation}
      />
    )
  }

  // Input stage (default)
  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex flex-col">
      <Background />

      {/* Header */}
      <div className="relative z-50 border-b border-border/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center -ml-4">
            <img src="/cortex.png" alt="CORTEX" className="w-[120px] h-[120px] object-contain" />
            <span className="text-2xl font-bold text-foreground tracking-tight leading-tight">CORTEX</span>
          </div>

          {/* Mode selector */}
          <div className="relative">
            <button
              onClick={() => setModeMenuOpen(!modeMenuOpen)}
              className="glass flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent/50 transition-all text-sm font-medium"
            >
              <CurrentModeIcon className={`w-4 h-4 ${modeConfig[mode].color}`} strokeWidth={2} />
              <span>{modeConfig[mode].label}</span>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${modeMenuOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {modeMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 glass rounded-xl overflow-hidden shadow-xl border border-border/40 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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

      {/* Backend Connection Warning */}
      {backendConnected === false && (
        <div className="relative z-10 max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <strong>⚠️ Warning: </strong>Cannot connect to backend server. Make sure it's running on port 3000.
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="relative z-10 max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error: </strong>{error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-4">

          {/* Motto */}
          <h1 className="text-center text-3xl font-bold tracking-tight mb-8" style={{ color: '#3E3875' }}>
            Every product deserves a voice
          </h1>

          <div className="relative w-full overflow-visible rounded-2xl">
            {/* Outer glow ring */}
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-tr from-primary/30 via-secondary/20 to-primary/30 opacity-60 blur-xl"></div>

            {/* Main glow effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-2xl">
              <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-primary/50 via-secondary/40 to-primary/40 opacity-50 blur-[80px] animate-pulse-slow"></div>
              <div className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-secondary/40 to-primary/50 opacity-40 blur-[60px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Enhanced glass layer */}
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
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onFocus={() => setShowPlaceholder(false)}
                    onBlur={() => !url && setShowPlaceholder(true)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    className="flex-1 bg-transparent border-none outline-none text-sm md:text-base font-medium tracking-tight text-foreground placeholder:text-transparent"
                  />

                  {showPlaceholder && !url && (
                    <div className="absolute left-[52px] pointer-events-none">
                      <div className="text-sm md:text-base font-medium tracking-tight text-muted-foreground/60">
                        {'Paste GitHub repo URL (recommended) or website...'.split('').map((char, i) => (
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
                  placeholder="Add context about your pitch or target audience... (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-background/80 backdrop-blur-sm border-2 border-border/40 rounded-xl resize-none focus:border-primary/50 transition-all text-sm shadow-md"
                />
              )}

              {mode === 'advanced' && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add context about your pitch, target VCs, or key points to emphasize... (optional)"
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

              {/* Analysis Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Analysis Mode</label>
                <div className="grid grid-cols-4 gap-2 glass rounded-lg p-1.5">
                  <button
                    onClick={() => setAnalysisMode('standard')}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      analysisMode === 'standard'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setAnalysisMode('competitive')}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      analysisMode === 'competitive'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    Competitive
                  </button>
                  <button
                    onClick={() => setAnalysisMode('briefing')}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      analysisMode === 'briefing'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    Briefing
                  </button>
                  <button
                    onClick={() => setAnalysisMode('partnership')}
                    className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                      analysisMode === 'partnership'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    Partnership
                  </button>
                </div>
              </div>

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
                  disabled={!url}
                  className="flex-1 h-9 rounded-lg font-medium text-sm disabled:opacity-50 shimmer disabled:shimmer-none transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Zap className="w-4 h-4 mr-2" strokeWidth={2} />
                  {analysisMode === 'competitive' ? 'Analyze Competitor' :
                   analysisMode === 'briefing' ? 'Generate Briefing' :
                   analysisMode === 'partnership' ? 'Create Pitch' : 'Generate Deck'}
                </Button>
              </div>
            </div>
          </div>

          {/* Test Buttons Row */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={handleLoadTestData}
              variant="outline"
              size="sm"
              className="text-xs bg-background/50 backdrop-blur border-border/40 hover:bg-accent/50"
            >
              Load Test Data
            </Button>
            <Button
              onClick={() => {
                const testUrl = prompt('Enter a Gamma presentation URL to test:', 'https://gamma.app/docs/your-presentation-id');
                if (testUrl) {
                  setPresentationUrl(testUrl);
                  setEmbedUrl(undefined);
                  setDownloadUrl(undefined);
                  setPdfUrl(undefined);
                  setSlideCount(10);
                  setStage('presentation');
                }
              }}
              variant="outline"
              size="sm"
              className="text-xs bg-background/50 backdrop-blur border-border/40 hover:bg-accent/50"
            >
              Test Presentation Viewer
            </Button>
          </div>

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
