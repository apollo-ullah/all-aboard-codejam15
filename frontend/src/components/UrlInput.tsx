import React from 'react';
import { isValidUrl } from '../utils/validation';

interface UrlInputProps {
  url: string;
  onUrlChange: (url: string) => void;
  onScrape: () => void;
  isLoading: boolean;
}

export default function UrlInput({ url, onUrlChange, onScrape, isLoading }: UrlInputProps) {
  const isValid = url ? isValidUrl(url) : true; // Don't show error for empty input
  
  return (
    <div className="max-w-2xl mx-auto mt-20 p-8">
      <div className="mb-4">
        <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
          Website URL
        </label>
        <input
          id="url-input"
          type="text"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading && url && isValid) {
              onScrape();
            }
          }}
          placeholder="https://www.example.com"
          className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-colors ${
            url && !isValid
              ? 'border-red-500 focus:border-red-600'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          disabled={isLoading}
        />
        {url && !isValid && (
          <p className="mt-2 text-sm text-red-600">
            Please enter a valid URL (e.g., https://www.example.com)
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Enter any website URL to transform it into a presentation
        </p>
      </div>
      <button
        onClick={onScrape}
        disabled={isLoading || !url || !isValid}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Analyzing...' : 'Analyze Website'}
      </button>
    </div>
  );
}

