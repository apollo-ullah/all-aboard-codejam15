import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Edit2, Check, X, Trash2, FileText } from 'lucide-react';
import { StoryNode as StoryNodeType } from '../types';

interface StoryNodeProps {
  data: StoryNodeType & {
    onEdit: (id: string, updates: Partial<StoryNodeType>) => void;
    onDelete?: (id: string) => void;
  };
}

export default function StoryNode({ data }: StoryNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [content, setContent] = useState(data.content);
  const [speakerNotes, setSpeakerNotes] = useState(data.speakerNotes);

  // Update local state when data changes
  useEffect(() => {
    setTitle(data.title);
    setContent(data.content);
    setSpeakerNotes(data.speakerNotes);
  }, [data.title, data.content, data.speakerNotes]);

  const handleSave = () => {
    data.onEdit(data.id, { title, content, speakerNotes });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(data.title);
    setContent(data.content);
    setSpeakerNotes(data.speakerNotes);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (data.onDelete && window.confirm('Are you sure you want to delete this node?')) {
      data.onDelete(data.id);
    }
  };

  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      title: 'bg-purple-100 border-purple-400',
      problem: 'bg-red-100 border-red-400',
      solution: 'bg-green-100 border-green-400',
      feature: 'bg-blue-100 border-blue-400',
      benefit: 'bg-yellow-100 border-yellow-400',
      cta: 'bg-orange-100 border-orange-400',
    };
    return colors[type] || 'bg-gray-100 border-gray-400';
  };

  return (
    <div className={`px-4 py-3 rounded-lg border-2 shadow-lg ${getNodeColor(data.type)} min-w-[280px] max-w-[380px] transition-all hover:shadow-xl`}>
      <Handle type="target" position={Position.Left} />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase text-gray-600 px-2 py-1 bg-white/50 rounded">
          {data.type}
        </span>
        <div className="flex gap-1">
          {!isEditing ? (
            <>
              <button 
                onClick={() => setShowNotes(!showNotes)} 
                className="text-blue-500 hover:text-blue-700 p-1"
                aria-label="Toggle speaker notes"
                title="Speaker notes"
              >
                <FileText size={14} />
              </button>
              <button 
                onClick={() => setIsEditing(true)} 
                className="text-gray-500 hover:text-gray-700 p-1"
                aria-label="Edit node"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              {data.onDelete && (
                <button 
                  onClick={handleDelete} 
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label="Delete node"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          ) : (
            <div className="flex gap-1">
              <button 
                onClick={handleSave} 
                className="text-green-600 hover:text-green-800 p-1"
                aria-label="Save changes"
                title="Save"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={handleCancel} 
                className="text-red-600 hover:text-red-800 p-1"
                aria-label="Cancel editing"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {!isEditing ? (
        <>
          <h3 className="font-bold text-lg mb-2 text-gray-800">{data.title}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-2">
            {data.content}
          </p>
          
          {/* Speaker Notes Toggle */}
          {showNotes && (
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="text-xs font-semibold text-gray-500 mb-1">Speaker Notes:</div>
              <p className="text-xs text-gray-600 italic leading-relaxed">
                {data.speakerNotes || 'No speaker notes added'}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-bold text-lg p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Node title"
            autoFocus
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-sm p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={4}
            placeholder="Node content (main points, bullet points, etc.)"
          />
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Speaker Notes:
            </label>
            <textarea
              value={speakerNotes}
              onChange={(e) => setSpeakerNotes(e.target.value)}
              className="w-full text-xs p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="What to say when presenting this slide..."
            />
          </div>
        </div>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

