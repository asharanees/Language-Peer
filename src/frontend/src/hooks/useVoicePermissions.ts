import { useState, useEffect } from 'react';

interface VoicePermissionsHook {
  hasPermission: boolean;
  isSupported: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<void>;
}

export const useVoicePermissions = (): VoicePermissionsHook => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    checkSupport();
    checkPermission();
  }, []);

  const checkSupport = () => {
    const supported = !!(
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
    setIsSupported(supported);
  };

  const checkPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasPermission(false);
        return;
      }

      // Try to get media stream to check permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      
      // Stop all tracks immediately
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setHasPermission(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      
      // Stop all tracks immediately
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
      return false;
    }
  };

  return {
    hasPermission,
    isSupported,
    requestPermission,
    checkPermission
  };
};