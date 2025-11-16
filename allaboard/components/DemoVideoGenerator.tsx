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
  onVideoGenerated?: (videoUrl: string, filename: string, duration: number) => void;
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

export function DemoVideoGenerator({ url, storyboard, onVideoGenerated }: DemoVideoGeneratorProps) {
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

      // Trigger callback to show video in viewer
      if (onVideoGenerated) {
        const filename = response.videoPath.split('/').pop() || '';
        const videoUrl = api.getDemoVideoUrl(filename);
        setTimeout(() => {
          onVideoGenerated(videoUrl, filename, response.duration);
        }, 500);
      }

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
    <Card className="w-full border-white/40 bg-white/30 backdrop-blur-2xl shadow-xl shadow-[#A9A4CC]/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 text-lg">
          <Video className="h-5 w-5 text-[#A9A4CC]" />
          AI Demo Video Generator
        </CardTitle>
        <CardDescription className="text-gray-700">
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
            className="w-full border-gray-300 bg-white/50 text-gray-700 hover:bg-white/70 hover:text-gray-900 backdrop-blur-sm transition-all duration-200 rounded-xl"
          >
            <Settings className="mr-2 h-4 w-4" />
            {showConfig ? 'Hide' : 'Show'} Configuration
          </Button>

          {showConfig && (
            <div className="space-y-3 rounded-xl border border-white/40 bg-white/40 backdrop-blur-sm p-4 shadow-lg">
              {/* Duration Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Duration
                </label>
                <Select
                  value={duration.toString()}
                  onValueChange={(value) => setDuration(parseInt(value))}
                >
                  <SelectTrigger className="border-gray-300 bg-white/60 backdrop-blur-sm text-gray-900 rounded-xl hover:bg-white/80 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 bg-white/95 backdrop-blur-xl">
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="45">45 seconds (recommended)</SelectItem>
                    <SelectItem value="60">60 seconds (max)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Model Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  <Mic className="mr-2 inline h-4 w-4" />
                  Voice-over Voice
                </label>
                <Select
                  value={voiceModel}
                  onValueChange={(value) => setVoiceModel(value as VoiceModel)}
                >
                  <SelectTrigger className="border-gray-300 bg-white/60 backdrop-blur-sm text-gray-900 rounded-xl hover:bg-white/80 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 bg-white/95 backdrop-blur-xl">
                    {voiceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-xs text-gray-600">{option.description}</div>
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
          className="w-full bg-gradient-to-r from-[#A9A4CC] to-[#C5B8D6] text-white hover:from-[#9A94BC] hover:to-[#B5A8C6] shadow-lg shadow-[#A9A4CC]/30 border border-[#A9A4CC]/40 rounded-xl transition-all duration-200"
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
          <div className="rounded-xl border border-[#A9A4CC]/40 bg-white/50 backdrop-blur-sm p-4 shadow-lg">
            <p className="text-sm text-gray-800">{progress}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 backdrop-blur-sm p-4 shadow-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3 rounded-xl border border-green-300 bg-green-50 backdrop-blur-sm p-4 shadow-lg">
            <div className="flex items-center gap-2">
              <Video className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-700">Demo Video Generated!</h3>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p>Duration: {result.duration.toFixed(1)}s</p>
              <p>Actions performed: {result.actionsCount}</p>
              {result.audioPath && <p>Voice-over: ✓ Generated</p>}
            </div>

            <div className="flex gap-2">
              {onVideoGenerated && (
                <Button
                  onClick={() => {
                    const filename = result.videoPath.split('/').pop() || '';
                    const videoUrl = api.getDemoVideoUrl(filename);
                    onVideoGenerated(videoUrl, filename, result.duration);
                  }}
                  className="flex-1 bg-gradient-to-r from-[#A9A4CC] to-[#C5B8D6] text-white hover:from-[#9A94BC] hover:to-[#B5A8C6] shadow-lg shadow-[#A9A4CC]/30 border border-[#A9A4CC]/40 rounded-xl transition-all"
                >
                  <Play className="mr-2 h-4 w-4" />
                  View Video
                </Button>
              )}
              <Button
                onClick={() => {
                  // Download video
                  const videoFilename = result.videoPath.split('/').pop() || '';
                  const downloadUrl = api.getDemoVideoUrl(videoFilename);
                  window.open(downloadUrl, '_blank');
                }}
                className="flex-1 border-gray-300 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 hover:text-gray-900 rounded-xl transition-all"
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
                  className="flex-1 border-gray-300 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white/80 hover:text-gray-900 rounded-xl transition-all"
                  variant="outline"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Download Audio
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Video saved at: {result.timestamp}
            </p>
          </div>
        )}

        {/* Info */}
        <div className="space-y-2 rounded-xl border border-[#A9A4CC]/40 bg-[#A9A4CC]/10 backdrop-blur-sm p-4 shadow-lg">
          <h4 className="text-sm font-semibold text-[#7A6FA8]">✨ What happens:</h4>
          <ul className="space-y-1 text-xs text-gray-700">
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
