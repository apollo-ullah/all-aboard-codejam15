'use client';

import React, { useState } from 'react';
import { Storyboard } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Download, Loader2, Play, Settings, Mic } from 'lucide-react';

interface DemoVideoGeneratorProps {
  url: string;
  storyboard: Storyboard;
}

type VoiceModel = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface GenerationResult {
  videoPath: string;
  audioPath?: string;
  scriptPath: string;
  duration: number;
  actionsCount: number;
  timestamp: string;
}

export function DemoVideoGenerator({ url, storyboard }: DemoVideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string>('');

  // Configuration
  const [duration, setDuration] = useState<number>(45);
  const [voiceModel, setVoiceModel] = useState<VoiceModel>('alloy');
  const [showConfig, setShowConfig] = useState(false);

  // Debug: Log when component mounts
  console.log('🎬 DemoVideoGenerator mounted', { url, nodeCount: storyboard?.nodes?.length });

  const handleGenerateVideo = async () => {
    console.log('🎬 handleGenerateVideo called!', { url, storyboard, duration, voiceModel });
    setIsGenerating(true);
    setProgress('Initializing AI demo agent...');
    setError('');
    setResult(null);

    try {
      setProgress('🚀 Starting browser with video recording...');

      // Call API with progress updates
      const response = await api.generateDemoVideo(url, storyboard, {
        duration,
        voiceModel,
      });

      setProgress('✅ Demo video generated successfully!');
      setResult({
        videoPath: response.videoPath,
        audioPath: response.audioPath,
        scriptPath: response.scriptPath,
        duration: response.duration,
        actionsCount: response.actionsCount,
        timestamp: response.timestamp,
      });

    } catch (err: any) {
      console.error('Demo video generation error:', err);
      setError(err.message || 'Failed to generate demo video');
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const voiceOptions: { value: VoiceModel; label: string; description: string }[] = [
    { value: 'alloy', label: 'Alloy', description: 'Neutral, balanced voice' },
    { value: 'echo', label: 'Echo', description: 'Male, authoritative' },
    { value: 'fable', label: 'Fable', description: 'British accent, storytelling' },
    { value: 'onyx', label: 'Onyx', description: 'Deep, professional male' },
    { value: 'nova', label: 'Nova', description: 'Female, energetic' },
    { value: 'shimmer', label: 'Shimmer', description: 'Soft, friendly female' },
  ];

  return (
    <Card className="w-full border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Video className="h-5 w-5" />
          AI Demo Video Generator
        </CardTitle>
        <CardDescription className="text-white/60">
          Create an AI-powered product demo video with voice-over
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Panel */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
          >
            <Settings className="mr-2 h-4 w-4" />
            {showConfig ? 'Hide' : 'Show'} Configuration
          </Button>

          {showConfig && (
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
              {/* Duration Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  Duration
                </label>
                <Select
                  value={duration.toString()}
                  onValueChange={(value) => setDuration(parseInt(value))}
                >
                  <SelectTrigger className="border-white/20 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-gray-900">
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="45">45 seconds (recommended)</SelectItem>
                    <SelectItem value="60">60 seconds (max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Model Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  <Mic className="mr-2 inline h-4 w-4" />
                  Voice-over Voice
                </label>
                <Select
                  value={voiceModel}
                  onValueChange={(value) => setVoiceModel(value as VoiceModel)}
                >
                  <SelectTrigger className="border-white/20 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-gray-900">
                    {voiceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium text-white">{option.label}</div>
                          <div className="text-xs text-white/60">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateVideo}
          disabled={isGenerating || !storyboard?.nodes?.length}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Video...
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Generate AI Demo Video
            </>
          )}
        </Button>

        {/* Progress */}
        {progress && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/80">{progress}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-green-400" />
              <h3 className="font-semibold text-green-300">Demo Video Generated!</h3>
            </div>

            <div className="space-y-2 text-sm text-white/80">
              <p>Duration: {result.duration.toFixed(1)}s</p>
              <p>Actions performed: {result.actionsCount}</p>
              {result.audioPath && <p>Voice-over: ✓ Generated</p>}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  // Download video
                  const videoFilename = result.videoPath.split('/').pop() || '';
                  const downloadUrl = api.getDemoVideoUrl(videoFilename);
                  window.open(downloadUrl, '_blank');
                }}
                className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Video
              </Button>

              {result.audioPath && (
                <Button
                  onClick={() => {
                    const audioFilename = result.audioPath!.split('/').pop() || '';
                    const downloadUrl = `${api.getDemoVideoUrl('')}${audioFilename}`;
                    window.open(downloadUrl, '_blank');
                  }}
                  className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  variant="outline"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Download Audio
                </Button>
              )}
            </div>

            <p className="text-xs text-white/50">
              Video saved at: {result.timestamp}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="space-y-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
          <h4 className="text-sm font-semibold text-blue-300">What happens:</h4>
          <ul className="space-y-1 text-xs text-white/70">
            <li>• AI agent launches a browser and navigates to {url}</li>
            <li>• GPT-4 Vision analyzes the page and decides actions</li>
            <li>• Smooth cursor movements simulate human interaction</li>
            <li>• Voice-over generated from your storyboard</li>
            <li>• Full HD video (1920x1080) recorded and saved</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
