import React, { useEffect, useRef } from 'react';
import { formatTimestamp } from '../../utils/timeUtils';
import './TranscriptDisplay.css';

interface TranscriptEntry {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  isPartial: boolean;
  speaker?: string;
}

interface TranscriptDisplayProps {
  entries: TranscriptEntry[];
  currentTranscript?: string;
  isTranscribing?: boolean;
  showConfidence?: boolean;
  showTimestamps?: boolean;
  maxHeight?: number;
  className?: string;
  onClear?: () => void;
  onExport?: () => void;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  entries = [],
  currentTranscript = '',
  isTranscribing = false,
  showConfidence = true,
  showTimestamps = true,
  maxHeight = 300,
  className = '',
  onClear,
  onExport
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasContent = entries.length > 0 || currentTranscript;

  // Auto-scroll to bottom when new content is added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [entries, currentTranscript]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'var(--success-color, #10b981)';
    if (confidence >= 0.6) return 'var(--warning-color, #f59e0b)';
    return 'var(--error-color, #ef4444)';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const handleExportText = () => {
    const fullText = entries
      .filter(entry => !entry.isPartial)
      .map(entry => {
        const timestamp = showTimestamps ? `[${formatTimestamp(entry.timestamp)}] ` : '';
        const speaker = entry.speaker ? `${entry.speaker}: ` : '';
        return `${timestamp}${speaker}${entry.text}`;
      })
      .join('\n');

    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onExport?.();
  };

  return (
    <div className={`transcript-display ${className}`}>
      {/* Header */}
      <div className="transcript-display-header">
        <div className="transcript-display-title">
          <span>Live Transcript</span>
          {isTranscribing && (
            <div className="transcript-display-indicator">
              <div className="transcript-display-dot"></div>
              <span>Listening...</span>
            </div>
          )}
        </div>
        
        {hasContent && (
          <div className="transcript-display-actions">
            {onExport && (
              <button
                onClick={handleExportText}
                className="transcript-display-action-btn"
                title="Export transcript"
              >
                📄
              </button>
            )}
            {onClear && (
              <button
                onClick={onClear}
                className="transcript-display-action-btn"
                title="Clear transcript"
              >
                🗑️
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div 
        ref={scrollContainerRef}
        className="transcript-display-content"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {!hasContent && !isTranscribing && (
          <div className="transcript-display-empty">
            <span className="transcript-display-empty-icon">🎤</span>
            <p>Start speaking to see your transcript here</p>
          </div>
        )}

        {!hasContent && isTranscribing && (
          <div className="transcript-display-waiting">
            <span className="transcript-display-waiting-icon">👂</span>
            <p>Listening for speech...</p>
          </div>
        )}

        {/* Final transcript entries */}
        {entries.map((entry) => (
          <div 
            key={entry.id}
            className={`transcript-entry ${entry.isPartial ? 'transcript-entry--partial' : 'transcript-entry--final'}`}
          >
            <div className="transcript-entry-content">
              {showTimestamps && (
                <span className="transcript-entry-timestamp">
                  {formatTimestamp(entry.timestamp)}
                </span>
              )}
              {entry.speaker && (
                <span className="transcript-entry-speaker">
                  {entry.speaker}:
                </span>
              )}
              <span className="transcript-entry-text">{entry.text}</span>
            </div>
            
            {showConfidence && !entry.isPartial && (
              <div className="transcript-entry-confidence">
                <span 
                  className="transcript-confidence-badge"
                  style={{ backgroundColor: getConfidenceColor(entry.confidence) }}
                  title={`Confidence: ${Math.round(entry.confidence * 100)}%`}
                >
                  {getConfidenceLabel(entry.confidence)}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Current/interim transcript */}
        {currentTranscript && (
          <div className="transcript-entry transcript-entry--current">
            <div className="transcript-entry-content">
              {showTimestamps && (
                <span className="transcript-entry-timestamp">
                  {formatTimestamp(Date.now())}
                </span>
              )}
              <span className="transcript-entry-text transcript-entry-text--interim">
                {currentTranscript}
              </span>
              <span className="transcript-entry-cursor">|</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {hasContent && (
        <div className="transcript-display-footer">
          <span className="transcript-display-stats">
            {entries.filter(e => !e.isPartial).length} entries
            {showConfidence && entries.length > 0 && (
              <>
                {' • '}
                Avg confidence: {Math.round(
                  entries
                    .filter(e => !e.isPartial)
                    .reduce((sum, e) => sum + e.confidence, 0) / 
                  Math.max(entries.filter(e => !e.isPartial).length, 1) * 100
                )}%
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
};