import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface VoiceContextType {
  isListening: boolean;
  hasPermission: boolean;
  isSupported: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  requestPermission: () => Promise<boolean>;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: ReactNode;
}

export const VoiceProvider: React.FC<VoiceProviderProps> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports voice recognition
    const checkSupport = () => {
      const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      setIsSupported(supported);
    };

    // Check existing permissions
    const checkPermissions = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasPermission(true);
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        setHasPermission(false);
      }
    };

    checkSupport();
    checkPermissions();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Permission denied:', error);
      setHasPermission(false);
      return false;
    }
  };

  const startListening = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    setIsListening(true);
    // Voice recognition implementation will be added in next task
  };

  const stopListening = () => {
    setIsListening(false);
    // Stop voice recognition implementation will be added in next task
  };

  const value = {
    isListening,
    hasPermission,
    isSupported,
    startListening,
    stopListening,
    requestPermission
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};