import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { formatDuration } from '../../utils/timeUtils';
import './AudioPlayer.css';

interface AudioPlayerProps {
  audioUrl: string;
  audioBlob?: Blob;
  title?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
  showDownload?: boolean;
  showWaveform?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  audioBlob,
  title = 'Audio Recording',
  onPlayStateChange,
  onTimeUpdate,
  onEnded,
  className = '',
  showDownload = true,
  showWaveform = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      setCurrentTime(current);
      onTimeUpdate?.(current, audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
      onEnded?.();
    };

    const handleError = () => {
      setError('Failed to load audio file');
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onTimeUpdate, onPlayStateChange, onEnded]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPlayStateChange?.(false);
      } else {
        await audio.play();
        setIsPlaying(true);
        onPlayStateChange?.(true);
      }
    } catch (error) {
      setError('Failed to play audio');
      console.error('Audio playback error:', error);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(event.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleDownload = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`audio-player ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />

      {/* Header */}
      <div className="audio-player-header">
        <h4 className="audio-player-title">{title}</h4>
        {showDownload && audioBlob && (
          <Button
            variant="ghost"
            size="small"
            onClick={handleDownload}
            leftIcon="⬇️"
            className="audio-player-download"
          >
            Download
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="audio-player-error">
          <span className="audio-player-error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="audio-player-loading">
          <div className="audio-player-loading-spinner"></div>
          <span>Loading audio...</span>
        </div>
      )}

      {/* Main Controls */}
      {!isLoading && !error && (
        <>
          <div className="audio-player-controls">
            <Button
              variant="primary"
              size="medium"
              onClick={togglePlayPause}
              leftIcon={isPlaying ? '⏸️' : '▶️'}
              className="audio-player-play-btn"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>

            <div className="audio-player-time">
              <span className="audio-player-current-time">
                {formatDuration(currentTime)}
              </span>
              <span className="audio-player-separator">/</span>
              <span className="audio-player-total-time">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="audio-player-progress-container">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="audio-player-progress"
              style={{
                background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${progressPercentage}%, var(--gray-300) ${progressPercentage}%, var(--gray-300) 100%)`
              }}
            />
          </div>

          {/* Playback Speed Controls */}
          <div className="audio-player-speed-controls">
            <span className="audio-player-speed-label">Speed:</span>
            <div className="audio-player-speed-buttons">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={`audio-player-speed-btn ${playbackRate === rate ? 'audio-player-speed-btn--active' : ''}`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* Waveform Visualization (placeholder) */}
          {showWaveform && (
            <div className="audio-player-waveform">
              <div className="audio-player-waveform-placeholder">
                <span>🎵 Waveform visualization would appear here</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};