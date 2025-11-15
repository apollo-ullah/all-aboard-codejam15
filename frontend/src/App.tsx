import React, { useState, useEffect } from 'react';
import StoryboardCanvas from './components/StoryboardCanvas';
import StyleSelector from './components/StyleSelector';
import UrlInput from './components/UrlInput';
import ProgressIndicator from './components/ProgressIndicator';
import { api } from './services/api';
import { Storyboard } from './types';

type Stage = 'input' | 'scraping' | 'storyboard' | 'generating' | 'complete';

export default function App() {
  const [stage, setStage] = useState<Stage>('input');
  const [url, setUrl] = useState('');
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [style, setStyle] = useState<'YC' | 'Finance'>('YC');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        await api.testConnection();
        setBackendConnected(true);
        console.log('✅ Backend connection verified');
      } catch (error: any) {
        setBackendConnected(false);
        console.error('❌ Backend connection failed:', error);
        setError(`Cannot connect to backend: ${error.message}`);
      }
    };
    testConnection();
  }, []);

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
      setDownloadUrl(response.downloadUrl);
      setStage('complete');
    } catch (error: any) {
      console.error('Generate error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to generate slides');
      setStage('storyboard');
    }
  };

  const handleReset = () => {
    setStage('input');
    setUrl('');
    setStoryboard(null);
    setDownloadUrl('');
    setError(null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-2xl font-bold">AI Product Storyteller</h1>
        <p className="text-gray-600">Transform websites into compelling presentations</p>
      </header>

      {/* Backend Connection Status */}
      {backendConnected === false && (
        <div className="max-w-2xl mx-auto mt-4 px-4">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <strong>⚠️ Warning: </strong>Cannot connect to backend server. Make sure it's running on port 3000.
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
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
          <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStage('input')}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                ← Back
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <StyleSelector style={style} onStyleChange={setStyle} />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {storyboard.nodes.length} slides
              </span>
              <button
                onClick={handleGenerateSlides}
                className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 transition-colors"
              >
                Generate Slides
              </button>
            </div>
          </div>
          
          <StoryboardCanvas
            initialNodes={storyboard.nodes}
            onNodesChange={(nodes) => setStoryboard({ ...storyboard, nodes })}
          />
        </div>
      )}

      {/* Generating Stage */}
      {stage === 'generating' && (
        <ProgressIndicator
          message={`Generating ${style} style slides...`}
          subMessage="This may take a few minutes"
          color="green"
        />
      )}

      {/* Complete Stage */}
      {stage === 'complete' && (
        <div className="max-w-2xl mx-auto mt-20 text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold mb-4">Slides Generated!</h2>
          <p className="text-gray-600 mb-6">Your presentation is ready to download</p>
          
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
          >
            Download Presentation
          </a>
          
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

