import React, { useState, useEffect } from 'react';
import './GeneratorForm.css';

const GeneratorForm = ({ onGenerate, isGenerating }) => {
  const [formData, setFormData] = useState({
    inputText: '',
    textMode: 'generate',
    format: 'presentation',
    themeId: 'Bold',
    numCards: 10,
    cardSplit: 'auto',
    exportAs: 'pdf',
    additionalInstructions: '',
    textAmount: 'brief',
    tone: '',
    audience: '',
    language: 'en',
    imageSource: 'aiGenerated',
    imageModel: 'imagen-4-pro',
    imageStyle: '',
    dimensions: '16:9'
  });

  const [sampleData, setSampleData] = useState(null);

  // Load sample.json data on mount
  useEffect(() => {
    const loadSampleData = async () => {
      try {
        const response = await fetch('/sample.json');
        const data = await response.json();
        setSampleData(data);
      } catch (error) {
        console.error('Error loading sample data:', error);
      }
    };

    loadSampleData();
  }, []);

  // Function to load sample data into form
  const loadSampleIntoForm = () => {
    if (!sampleData) return;
    
    setFormData({
      inputText: sampleData.inputText || '',
      textMode: sampleData.textMode || 'generate',
      format: sampleData.format || 'presentation',
      themeId: sampleData.themeId || 'Bold',
      numCards: sampleData.numCards || 10,
      cardSplit: sampleData.cardSplit || 'auto',
      exportAs: sampleData.exportAs || 'pdf',
      additionalInstructions: sampleData.additionalInstructions || '',
      textAmount: sampleData.textOptions?.amount || 'brief',
      tone: sampleData.textOptions?.tone || '',
      audience: sampleData.textOptions?.audience || '',
      language: sampleData.textOptions?.language || 'en',
      imageSource: sampleData.imageOptions?.source || 'aiGenerated',
      imageModel: sampleData.imageOptions?.model || 'imagen-4-pro',
      imageStyle: sampleData.imageOptions?.style || '',
      dimensions: sampleData.cardOptions?.dimensions || '16:9'
    });
  };

  // Function to send sample.json directly as API request
  const sendSampleDirectly = () => {
    if (!sampleData) {
      alert('Sample data not loaded yet');
      return;
    }
    
    // Send the sample.json payload directly to the API
    onGenerate(sampleData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      inputText: formData.inputText,
      textMode: formData.textMode,
      format: formData.format,
      themeId: formData.themeId,
      numCards: parseInt(formData.numCards),
      cardSplit: formData.cardSplit,
      exportAs: formData.exportAs,
      additionalInstructions: formData.additionalInstructions,
      textOptions: {
        amount: formData.textAmount,
        tone: formData.tone,
        audience: formData.audience,
        language: formData.language
      },
      imageOptions: {
        source: formData.imageSource,
        model: formData.imageModel,
        style: formData.imageStyle
      },
      cardOptions: {
        dimensions: formData.dimensions
      },
      sharingOptions: {
        workspaceAccess: 'view',
        externalAccess: 'noAccess'
      }
    };

    onGenerate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="generator-form">
      <div className="form-card sample-actions">
        <h2 className="form-section-title">Quick Actions</h2>
        <div className="button-group">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={loadSampleIntoForm}
            disabled={isGenerating || !sampleData}
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Load Sample into Form
          </button>
          <button 
            type="button" 
            className="btn btn-accent"
            onClick={sendSampleDirectly}
            disabled={isGenerating || !sampleData}
          >
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate from sample.json
          </button>
        </div>
        <span className="form-hint">
          Load the sample DoorDash pitch deck or send it directly as an API request
        </span>
      </div>

      <div className="form-card">
        <h2 className="form-section-title">Content</h2>
        
        <div className="form-group">
          <label htmlFor="inputText">
            Presentation Content <span className="required">*</span>
          </label>
          <textarea
            id="inputText"
            name="inputText"
            value={formData.inputText}
            onChange={handleInputChange}
            placeholder="Enter your presentation content, topic, or notes..."
            rows={8}
            required
            disabled={isGenerating}
          />
          <span className="form-hint">Describe your topic or paste your content here</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="textMode">Text Mode</label>
            <select
              id="textMode"
              name="textMode"
              value={formData.textMode}
              onChange={handleInputChange}
              disabled={isGenerating}
            >
              <option value="generate">Generate - Expand content</option>
              <option value="condense">Condense - Summarize content</option>
              <option value="preserve">Preserve - Keep as-is</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="format">Format</label>
            <select
              id="format"
              name="format"
              value={formData.format}
              onChange={handleInputChange}
              disabled={isGenerating}
            >
              <option value="presentation">Presentation</option>
              <option value="document">Document</option>
              <option value="social">Social Media</option>
              <option value="webpage">Webpage</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="themeId">Theme</label>
            <select
              id="themeId"
              name="themeId"
              value={formData.themeId}
              onChange={handleInputChange}
              disabled={isGenerating}
            >
              <option value="Bold">Bold</option>
              <option value="Oasis">Oasis</option>
              <option value="Minimal">Minimal</option>
              <option value="Modern">Modern</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="numCards">Number of Cards</label>
            <input
              type="number"
              id="numCards"
              name="numCards"
              value={formData.numCards}
              onChange={handleInputChange}
              min="1"
              max="60"
              disabled={isGenerating}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="additionalInstructions">Additional Instructions</label>
          <textarea
            id="additionalInstructions"
            name="additionalInstructions"
            value={formData.additionalInstructions}
            onChange={handleInputChange}
            placeholder="Add specific instructions for styling, layout, or content..."
            rows={3}
            disabled={isGenerating}
          />
        </div>
      </div>

      <div className="form-card">
        <h2 className="form-section-title">Text Options</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="textAmount">Content Amount</label>
            <select
              id="textAmount"
              name="textAmount"
              value={formData.textAmount}
              onChange={handleInputChange}
              disabled={isGenerating}
            >
              <option value="brief">Brief</option>
              <option value="medium">Medium</option>
              <option value="detailed">Detailed</option>
              <option value="extensive">Extensive</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleInputChange}
              disabled={isGenerating}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tone">Tone</label>
          <input
            type="text"
            id="tone"
            name="tone"
            value={formData.tone}
            onChange={handleInputChange}
            placeholder="e.g., professional, inspiring, casual"
            disabled={isGenerating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="audience">Target Audience</label>
          <input
            type="text"
            id="audience"
            name="audience"
            value={formData.audience}
            onChange={handleInputChange}
            placeholder="e.g., investors, students, professionals"
            disabled={isGenerating}
          />
        </div>
      </div>

      <div className="form-card">
        <h2 className="form-section-title">Image Options</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="imageSource">Image Source</label>
            <select
              id="imageSource"
              name="imageSource"
              value={formData.imageSource}
              onChange={handleInputChange}
              disabled={isGenerating}
            >
              <option value="aiGenerated">AI Generated</option>
              <option value="unsplash">Unsplash</option>
              <option value="pictographic">Pictographic</option>
              <option value="noImages">No Images</option>
            </select>
          </div>

          {formData.imageSource === 'aiGenerated' && (
            <div className="form-group">
              <label htmlFor="imageModel">AI Model</label>
              <select
                id="imageModel"
                name="imageModel"
                value={formData.imageModel}
                onChange={handleInputChange}
                disabled={isGenerating}
              >
                <option value="imagen-4-pro">Imagen 4 Pro</option>
                <option value="flux-1-pro">Flux 1 Pro</option>
                <option value="dall-e-3">DALL-E 3</option>
              </select>
            </div>
          )}
        </div>

        {formData.imageSource === 'aiGenerated' && (
          <div className="form-group">
            <label htmlFor="imageStyle">Image Style</label>
            <input
              type="text"
              id="imageStyle"
              name="imageStyle"
              value={formData.imageStyle}
              onChange={handleInputChange}
              placeholder="e.g., photorealistic, minimal, modern"
              disabled={isGenerating}
            />
            <span className="form-hint">Describe the visual style for AI-generated images</span>
          </div>
        )}
      </div>

      <div className="form-card">
        <h2 className="form-section-title">Layout Options</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dimensions">Card Dimensions</label>
            <select
              id="dimensions"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleInputChange}
              disabled={isGenerating}
            >
              <option value="fluid">Fluid</option>
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:3">4:3 (Standard)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cardSplit">Card Split</label>
            <select
              id="cardSplit"
              name="cardSplit"
              value={formData.cardSplit}
              onChange={handleInputChange}
              disabled={isGenerating}
            >
              <option value="auto">Auto</option>
              <option value="inputTextBreaks">Use Text Breaks</option>
            </select>
          </div>
        </div>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary btn-generate"
        disabled={isGenerating || !formData.inputText}
      >
        {isGenerating ? (
          <>
            <div className="spinner"></div>
            Generating...
          </>
        ) : (
          <>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Presentation
          </>
        )}
      </button>
    </form>
  );
};

export default GeneratorForm;
