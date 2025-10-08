import React, { useRef, useEffect, useState } from 'react';

interface AudioVisualizerProps {
  audioStream?: MediaStream;
  isActive?: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  backgroundColor?: string;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioStream,
  isActive = false,
  width = 300,
  height = 100,
  barCount = 32,
  barColor = '#3b82f6',
  backgroundColor = 'transparent',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode>();
  const audioContextRef = useRef<AudioContext>();
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check for Web Audio API support
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
      setIsSupported(false);
      return;
    }

    if (audioStream && isActive) {
      try {
        // Create audio context and analyzer
        const audioContext = new AudioContext();
        const analyzer = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);
        
        analyzer.fftSize = 256;
        analyzer.smoothingTimeConstant = 0.8;
        source.connect(analyzer);
        
        audioContextRef.current = audioContext;
        analyzerRef.current = analyzer;
        
        // Start visualization
        startVisualization();
      } catch (error) {
        console.error('Failed to create audio visualization:', error);
        setIsSupported(false);
      }
    }

    return () => {
      stopVisualization();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioStream, isActive]);

  const startVisualization = () => {
    if (!analyzerRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyzer = analyzerRef.current;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!isActive) return;
      
      animationRef.current = requestAnimationFrame(draw);
      
      analyzer.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      
      // Calculate bar dimensions
      const barWidth = width / barCount;
      const barSpacing = barWidth * 0.1;
      const actualBarWidth = barWidth - barSpacing;
      
      // Draw frequency bars
      for (let i = 0; i < barCount; i++) {
        // Sample frequency data (map barCount to bufferLength)
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const barHeight = (dataArray[dataIndex] / 255) * height;
        
        const x = i * barWidth;
        const y = height - barHeight;
        
        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, adjustColorBrightness(barColor, 40));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, actualBarWidth, barHeight);
      }
    };
    
    draw();
  };

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  };

  // Helper function to adjust color brightness
  const adjustColorBrightness = (color: string, percent: number): string => {
    // Simple color brightness adjustment
    // In a real implementation, you'd want more sophisticated color manipulation
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  if (!isSupported) {
    return (
      <div 
        className={`audio-visualizer audio-visualizer--unsupported ${className}`}
        style={{ width, height }}
      >
        <div className="audio-visualizer-fallback">
          <span>🎵</span>
          <span>Audio visualization not supported</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`audio-visualizer ${isActive ? 'audio-visualizer--active' : ''} ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="audio-visualizer-canvas"
      />
      {!isActive && (
        <div className="audio-visualizer-overlay">
          <span className="audio-visualizer-status">
            {audioStream ? 'Paused' : 'No audio input'}
          </span>
        </div>
      )}
    </div>
  );
};