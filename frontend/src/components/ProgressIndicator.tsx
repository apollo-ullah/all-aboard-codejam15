import React from 'react';

interface ProgressIndicatorProps {
  message: string;
  subMessage?: string;
  color?: 'blue' | 'green';
}

export default function ProgressIndicator({ 
  message, 
  subMessage, 
  color = 'blue' 
}: ProgressIndicatorProps) {
  const colorClass = color === 'blue' ? 'border-blue-600' : 'border-green-600';
  
  return (
    <div className="max-w-2xl mx-auto mt-20 text-center">
      <div className={`animate-spin rounded-full h-16 w-16 border-b-2 ${colorClass} mx-auto`}></div>
      <p className="mt-4 text-lg font-medium">{message}</p>
      {subMessage && (
        <p className="mt-2 text-sm text-gray-500">{subMessage}</p>
      )}
    </div>
  );
}

