import React, { useState, useEffect, useCallback } from 'react';
import StoryboardCanvas from './components/StoryboardCanvas';
import StyleSelector from './components/StyleSelector';
import UrlInput from './components/UrlInput';
import ProgressIndicator from './components/ProgressIndicator';
import NarrativeArcButton from './components/NarrativeArcButton';
import StoryboardAssistant from './components/StoryboardAssistant';
import PresentationViewer from './components/PresentationViewer';
import LandingPage from './components/LandingPage';
import { api } from './services/api';
import { Storyboard } from './types';

type Stage = 'landing' | 'input' | 'scraping' | 'storyboard' | 'generating' | 'presentation' | 'complete';

export default function App() {
  const [stage, setStage] = useState<Stage>('landing');
  const [url, setUrl] = useState('');
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [style, setStyle] = useState<'YC' | 'Finance'>('YC');
  const [presentationUrl, setPresentationUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string | undefined>(undefined);
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>(undefined);
  const [slideCount, setSlideCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Test backend connection on mount (only if not on landing page)
  useEffect(() => {
    if (stage === 'landing') return; // Don't test on landing page
    
    const testConnection = async () => {
      try {
        await api.testConnection();
        setBackendConnected(true);
        console.log('✅ Backend connection verified');
      } catch (error: any) {
        setBackendConnected(false);
        console.error('❌ Backend connection failed:', error);
        // Don't set error on landing page
        if (stage !== 'landing') {
          setError(`Cannot connect to backend: ${error.message}`);
        }
      }
    };
    testConnection();
  }, [stage]);

  const handleScrape = async () => {
    setStage('scraping');
    setError(null);
    
    // Test connection first
    try {
      await api.testConnection();
      setBackendConnected(true);
    } catch (error: any) {
      setBackendConnected(false);
      setError(`Cannot connect to backend: ${error.message}`);
      setStage('input');
      return;
    }
    
    try {
      const response = await api.scrapeWebsite(url);
      console.log('📦 Received storyboard response:', response);
      console.log('📊 Storyboard nodes:', response.storyboard?.nodes);
      console.log('📊 Number of nodes:', response.storyboard?.nodes?.length);
      if (response.storyboard?.nodes) {
        response.storyboard.nodes.forEach((node, idx) => {
          console.log(`   Node ${idx}:`, {
            id: node.id,
            type: node.type,
            title: node.title,
            position: node.position
          });
        });
      }
      setStoryboard(response.storyboard);
      setStage('storyboard');
    } catch (error: any) {
      console.error('Scrape error:', error);
      // Use the detailed error message from the API client
      const errorMsg = error.message || error.response?.data?.error || 'Failed to scrape website';
      setError(errorMsg);
      setStage('input');
    }
  };

  const handleGenerateSlides = async () => {
    if (!storyboard) return;
    
    setStage('generating');
    setError(null);
    
    try {
      const response = await api.generateSlides(storyboard, style);
      setPresentationUrl(response.presentationUrl);
      setEmbedUrl(response.embedUrl);
      setDownloadUrl(response.downloadUrl);
      setSlideCount(response.slideCount);
      setStage('presentation'); // Go directly to presentation view
    } catch (error: any) {
      console.error('Generate error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to generate slides');
      setStage('storyboard');
    }
  };

  const handleReset = () => {
    setStage('landing');
    setUrl('');
    setStoryboard(null);
    setPresentationUrl('');
    setEmbedUrl(undefined);
    setDownloadUrl(undefined);
    setSlideCount(0);
    setError(null);
  };

  const handleStoryboardGenerated = (newStoryboard: Storyboard, outputType: 'video' | 'slides', style?: string) => {
    setStoryboard(newStoryboard);
    setStage('storyboard');
    // If style was provided from landing page, map it to YC/Finance
    if (style) {
      if (style === 'vc-pitch') {
        setStyle('YC');
      } else {
        setStyle('Finance');
      }
    }
  };

  const handleClosePresentation = () => {
    setStage('storyboard'); // Go back to storyboard editing
  };

  // Test function to load dummy storyboard data
  const handleLoadTestData = () => {
    const dummyStoryboard: Storyboard = {
      title: 'Test Product',
      tagline: 'A test product for debugging',
      nodes: [
        {
          id: 'node-1',
          type: 'title',
          title: 'Test Product',
          content: 'This is a test title node',
          speakerNotes: 'Welcome to our test product presentation',
          position: { x: 0, y: 0 }
        },
        {
          id: 'node-2',
          type: 'problem',
          title: 'The Problem',
          content: 'Users struggle with complex workflows',
          speakerNotes: 'Many users find it difficult to manage complex workflows',
          position: { x: 350, y: 0 }
        },
        {
          id: 'node-3',
          type: 'solution',
          title: 'Our Solution',
          content: 'A simple, intuitive platform',
          speakerNotes: 'We provide a simple and intuitive platform',
          position: { x: 700, y: 0 }
        },
        {
          id: 'node-4',
          type: 'feature',
          title: 'Feature 1',
          content: 'Easy to use interface',
          speakerNotes: 'Our interface is designed to be easy to use',
          position: { x: 1050, y: 0 }
        },
        {
          id: 'node-5',
          type: 'feature',
          title: 'Feature 2',
          content: 'Powerful automation',
          speakerNotes: 'Automate your workflows with powerful tools',
          position: { x: 1400, y: 0 }
        },
        {
          id: 'node-6',
          type: 'benefit',
          title: 'Key Benefits',
          content: 'Save time and increase productivity',
          speakerNotes: 'Users save time and increase productivity',
          position: { x: 1750, y: 0 }
        },
        {
          id: 'node-7',
          type: 'cta',
          title: 'Get Started',
          content: 'Sign up today and get started',
          speakerNotes: 'Sign up today to get started with our platform',
          position: { x: 2100, y: 0 }
        }
      ]
    };
    console.log('🧪 Loading test storyboard:', dummyStoryboard);
    setStoryboard(dummyStoryboard);
    setStage('storyboard');
    setError(null);
  };

  // Stable callback for node changes (must be at top level, not in JSX)
  const handleNodesChange = useCallback((nodes: Storyboard['nodes']) => {
    setStoryboard(prev => prev ? { ...prev, nodes } : null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Landing Page Stage */}
      {stage === 'landing' && (
        <LandingPage onStoryboardGenerated={handleStoryboardGenerated} />
      )}

      {/* Backend Connection Status */}
      {stage !== 'landing' && backendConnected === false && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <strong>⚠️ Warning: </strong>Cannot connect to backend server. Make sure it's running on port 3000.
          </div>
        </div>
      )}

      {/* Error Message */}
      {stage !== 'landing' && error && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error: </strong>{error}
          </div>
        </div>
      )}

      {/* Input Stage */}
      {stage === 'input' && (
        <div className="max-w-2xl mx-auto mt-20">
          <UrlInput
            url={url}
            onUrlChange={setUrl}
            onScrape={handleScrape}
            isLoading={false}
          />
          {/* Test button for dummy data */}
          <div className="mt-4 text-center">
            <button
              onClick={handleLoadTestData}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              🧪 Load Test Data (Debug: Display dummy nodes)
            </button>
          </div>
        </div>
      )}

      {/* Scraping Stage */}
      {stage === 'scraping' && (
        <ProgressIndicator
          message="Scraping website and generating storyboard..."
          subMessage="This may take a minute"
          color="blue"
        />
      )}

      {/* Storyboard Editing Stage */}
      {stage === 'storyboard' && storyboard && (
        <div className="flex flex-col h-screen">
          <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between border-b z-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStage('landing')}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                ← Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">{storyboard.title}</span>
                {storyboard.tagline && (
                  <span className="text-xs text-gray-500">• {storyboard.tagline}</span>
                )}
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <StyleSelector style={style} onStyleChange={setStyle} />
              <div className="h-6 w-px bg-gray-300"></div>
              <NarrativeArcButton
                storyboard={storyboard}
                style={style}
                onApplyArc={(updated) => setStoryboard(updated)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded">
                {storyboard.nodes.length} {storyboard.nodes.length === 1 ? 'slide' : 'slides'}
              </div>
              <button
                onClick={() => setAssistantOpen(!assistantOpen)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg ${
                  assistantOpen
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="AI Assistant"
              >
                💬 AI Assistant
              </button>
              <button
                onClick={handleGenerateSlides}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                Generate Slides
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden relative">
            <StoryboardCanvas
              initialNodes={storyboard.nodes}
              onNodesChange={handleNodesChange}
            />
            <StoryboardAssistant
              storyboard={storyboard}
              style={style}
              isOpen={assistantOpen}
              onClose={() => setAssistantOpen(false)}
              onStoryboardUpdate={(updated) => setStoryboard(updated)}
            />
          </div>
        </div>
      )}

      {/* Generating Stage */}
      {stage === 'generating' && (
        <ProgressIndicator
          message={`Generating ${style} style slides with Gamma...`}
          subMessage="This may take a few minutes"
          color="green"
        />
      )}

      {/* Presentation Viewer Stage */}
      {stage === 'presentation' && presentationUrl && (
        <PresentationViewer
          presentationUrl={presentationUrl}
          embedUrl={embedUrl}
          downloadUrl={downloadUrl}
          slideCount={slideCount}
          onClose={handleClosePresentation}
        />
      )}

      {/* Complete Stage (fallback if needed) */}
      {stage === 'complete' && (
        <div className="max-w-2xl mx-auto mt-20 text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold mb-4">Slides Generated!</h2>
          <p className="text-gray-600 mb-6">Your presentation is ready</p>
          
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
            >
              Download Presentation
            </a>
          )}
          
          <button
            onClick={handleReset}
            className="block mx-auto mt-4 text-blue-600 hover:underline"
          >
            Create Another
          </button>
        </div>
      )}
    </div>
  );
}

