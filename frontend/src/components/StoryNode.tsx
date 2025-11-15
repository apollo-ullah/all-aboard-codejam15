import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Edit2, Check, X } from 'lucide-react';
import { StoryNode as StoryNodeType } from '../types';

interface StoryNodeProps {
  data: StoryNodeType & {
    onEdit: (id: string, updates: Partial<StoryNodeType>) => void;
  };
}

export default function StoryNode({ data }: StoryNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(data.title);
  const [content, setContent] = useState(data.content);

  const handleSave = () => {
    data.onEdit(data.id, { title, content });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(data.title);
    setContent(data.content);
    setIsEditing(false);
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
    <div className={`px-4 py-3 rounded-lg border-2 ${getNodeColor(data.type)} min-w-[250px] max-w-[350px]`}>
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase text-gray-600">{data.type}</span>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Edit node"
          >
            <Edit2 size={16} />
          </button>
        ) : (
          <div className="flex gap-1">
            <button 
              onClick={handleSave} 
              className="text-green-600 hover:text-green-800"
              aria-label="Save changes"
            >
              <Check size={16} />
            </button>
            <button 
              onClick={handleCancel} 
              className="text-red-600 hover:text-red-800"
              aria-label="Cancel editing"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <>
          <h3 className="font-bold text-lg mb-2">{data.title}</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.content}</p>
        </>
      ) : (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full font-bold text-lg mb-2 p-1 border rounded"
            placeholder="Node title"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full text-sm p-1 border rounded"
            rows={3}
            placeholder="Node content"
          />
        </>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

