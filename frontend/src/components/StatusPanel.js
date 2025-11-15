import React from 'react';
import './StatusPanel.css';

const StatusPanel = ({ status, error, generationId }) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Initializing generation...';
      case 'processing':
        return 'Creating your presentation...';
      case 'completed':
        return 'Generation complete!';
      case 'failed':
        return 'Generation failed';
      default:
        return 'Processing...';
    }
  };

  const getStatusIcon = () => {
    if (error) {
      return (
        <svg className="status-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    if (status === 'completed') {
      return (
        <svg className="status-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }

    return (
      <div className="status-icon loading">
        <div className="spinner-large"></div>
      </div>
    );
  };

  return (
    <div className={`status-panel ${error ? 'error' : ''}`}>
      <div className="status-content">
        {getStatusIcon()}
        
        <div className="status-text">
          <h3>{error ? 'Error' : getStatusMessage()}</h3>
          {error && <p className="error-message">{error}</p>}
          {generationId && !error && (
            <p className="generation-id">ID: {generationId}</p>
          )}
          {!error && status !== 'completed' && (
            <p className="status-description">
              This may take a minute or two. Please wait...
            </p>
          )}
        </div>
      </div>

      {!error && status !== 'completed' && (
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
      )}
    </div>
  );
};

export default StatusPanel;
