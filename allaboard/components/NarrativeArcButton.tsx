import React, { useState } from 'react';
import { Sparkles, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { Storyboard } from '../types';
import { 
  getNarrativeArc, 
  analyzeStoryboard, 
  applyNarrativeArc,
  NarrativeArcStep 
} from '../utils/narrativeArcs';

interface NarrativeArcButtonProps {
  storyboard: Storyboard;
  style: 'YC' | 'Finance';
  onApplyArc: (updatedStoryboard: Storyboard) => void;
}

export default function NarrativeArcButton({ 
  storyboard, 
  style, 
  onApplyArc 
}: NarrativeArcButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const arc = getNarrativeArc(style);
  const analysis = analyzeStoryboard(storyboard, style);
  
  const handleApply = () => {
    const updated = applyNarrativeArc(storyboard, style);
    onApplyArc(updated);
    setIsOpen(false);
    setShowPreview(false);
    
    // Force ReactFlow to fit view after reordering
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };
  
  const handlePreview = () => {
    setShowPreview(!showPreview);
  };
  
  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md hover:shadow-lg"
          title="Apply narrative arc template"
        >
          <Sparkles size={16} />
          <span className="text-sm font-semibold">Apply {style} Arc</span>
          <ChevronDown size={16} className={isOpen ? 'rotate-180' : ''} />
        </button>
        
        {/* Analysis Badge */}
        {analysis.missingSteps.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
            <AlertCircle size={12} />
            <span>{analysis.missingSteps.length} missing</span>
          </div>
        )}
      </div>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">
                {style} Narrative Arc
              </h3>
              <button
                onClick={handlePreview}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            
            {/* Arc Steps */}
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {arc.map((step, index) => {
                const hasNode = storyboard.nodes.some(n => n.type === step.type);
                const nodeCount = storyboard.nodes.filter(n => n.type === step.type).length;
                
                return (
                  <div
                    key={index}
                    className={`p-2 rounded border ${
                      hasNode 
                        ? 'bg-green-50 border-green-200' 
                        : step.required 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500 w-6">
                          {index + 1}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-gray-800">
                            {step.label}
                            {step.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            {step.description}
                          </div>
                        </div>
                      </div>
                      {hasNode && (
                        <Check size={14} className="text-green-600" />
                      )}
                      {nodeCount > 1 && (
                        <span className="text-xs text-blue-600 font-semibold">
                          {nodeCount}x
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Analysis Summary */}
            {analysis.suggestions.length > 0 && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-xs font-semibold text-yellow-800 mb-1">
                  Suggestions:
                </div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {analysis.suggestions.map((suggestion, idx) => (
                    <li key={idx}>• {suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Preview */}
            {showPreview && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="text-xs font-semibold text-blue-800 mb-1">
                  Preview Changes:
                </div>
                <div className="text-xs text-blue-700">
                  {storyboard.nodes.length} → {arc.length} slides
                  {analysis.missingSteps.length > 0 && (
                    <span className="text-orange-600">
                      {' '}(+{analysis.missingSteps.length} placeholders)
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm font-semibold"
              >
                Apply Arc
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

