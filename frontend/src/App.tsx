import React, { useState } from 'react';
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

  const handleScrape = async () => {
    setStage('scraping');
    setError(null);
    
    try {
      const response = await api.scrapeWebsite(url);
      setStoryboard(response.storyboard);
      setStage('storyboard');
    } catch (error: any) {
      console.error('Scrape error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to scrape website');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-2xl font-bold">AI Product Storyteller</h1>
        <p className="text-gray-600">Transform websites into compelling presentations</p>
      </header>

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
        <UrlInput
          url={url}
          onUrlChange={setUrl}
          onScrape={handleScrape}
          isLoading={false}
        />
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

