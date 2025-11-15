import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Storyboard } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StoryboardAssistantProps {
  storyboard: Storyboard;
  style: 'YC' | 'Finance';
  isOpen: boolean;
  onClose: () => void;
  onStoryboardUpdate: (updated: Storyboard) => void;
}

export default function StoryboardAssistant({
  storyboard,
  style,
  isOpen,
  onClose,
  onStoryboardUpdate,
}: StoryboardAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI presentation assistant. I can help you improve your ${style}-style storyboard. Try asking me to:
• Improve the flow or content
• Add missing slides
• Make it more compelling
• Reorder slides
• Enhance specific nodes`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/improve-storyboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyboard,
          style,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || data.message || 'I received your message, but I need more context.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If AI suggests storyboard changes, apply them
      if (data.updatedStoryboard) {
        console.log('✅ AI updated storyboard:', data.updatedStoryboard);
        onStoryboardUpdate(data.updatedStoryboard);
        
        // Add a confirmation message
        const updateMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `✅ I've updated your storyboard! It now has ${data.updatedStoryboard.nodes.length} nodes.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, updateMessage]);
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Improve flow', prompt: 'How can I improve the flow of this presentation?' },
    { label: 'Add traction slide', prompt: 'Add a traction slide with metrics' },
    { label: 'Make more compelling', prompt: `Make this more compelling for ${style} style` },
    { label: 'Reorder slides', prompt: 'Reorder slides to follow the best structure' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col border-l">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 rounded p-1 transition-colors"
          aria-label="Close assistant"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 bg-gray-50 border-b">
        <div className="text-xs font-semibold text-gray-600 mb-2">Quick Actions:</div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(action.prompt)}
              className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-100 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader2 size={16} className="animate-spin text-gray-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your storyboard..."
            className="flex-1 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

