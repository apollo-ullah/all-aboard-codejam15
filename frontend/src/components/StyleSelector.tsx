import React from 'react';

interface StyleSelectorProps {
  style: 'YC' | 'Finance';
  onStyleChange: (style: 'YC' | 'Finance') => void;
}

export default function StyleSelector({ style, onStyleChange }: StyleSelectorProps) {
  return (
    <div className="flex gap-4 items-center">
      <span className="font-semibold">Slide Style:</span>
      <button
        onClick={() => onStyleChange('YC')}
        className={`px-4 py-2 rounded transition-colors ${
          style === 'YC' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        YC Style
      </button>
      <button
        onClick={() => onStyleChange('Finance')}
        className={`px-4 py-2 rounded transition-colors ${
          style === 'Finance' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        Finance Style
      </button>
    </div>
  );
}

