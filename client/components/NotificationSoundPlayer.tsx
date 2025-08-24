import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  MusicalNoteIcon,
  CogIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

interface SoundConfig {
  id: string;
  name: string;
  path: string;
  duration: number;
  volume: number;
}

interface NotificationSoundPlayerProps {
  className?: string;
  onSoundPlay?: (soundId: string) => void;
}

const NotificationSoundPlayer: React.FC<NotificationSoundPlayerProps> = ({
  className = '',
  onSoundPlay
}) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [currentSound, setCurrentSound] = useState<string>('default');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [availableSounds, setAvailableSounds] = useState<SoundConfig[]>([
    { id: 'default', name: 'Default', path: '/sounds/notification-default.mp3', duration: 2000, volume: 0.7 },
    { id: 'success', name: 'Success', path: '/sounds/notification-success.mp3', duration: 1500, volume: 0.6 },
    { id: 'warning', name: 'Warning', path: '/sounds/notification-warning.mp3', duration: 2000, volume: 0.7 },
    { id: 'error', name: 'Error', path: '/sounds/notification-error.mp3', duration: 2500, volume: 0.8 },
    { id: 'chime', name: 'Chime', path: '/sounds/notification-chime.mp3', duration: 1200, volume: 0.5 },
    { id: 'ding', name: 'Ding', path: '/sounds/notification-ding.mp3', duration: 1000, volume: 0.6 }
  ]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize audio context
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new AudioContext();
    }

    // Load saved preferences
    const savedVolume = localStorage.getItem('notification-sound-volume');
    const savedSound = localStorage.getItem('notification-sound-type');
    const savedEnabled = localStorage.getItem('notification-sound-enabled');

    if (savedVolume) setVolume(parseFloat(savedVolume));
    if (savedSound) setCurrentSound(savedSound);
    if (savedEnabled !== null) setIsEnabled(savedEnabled === 'true');

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('notification-sound-volume', volume.toString());
    localStorage.setItem('notification-sound-type', currentSound);
    localStorage.setItem('notification-sound-enabled', isEnabled.toString());
  }, [volume, currentSound, isEnabled]);

  const playSound = async (soundId: string = currentSound) => {
    if (!isEnabled || !audioContextRef.current) return;

    try {
      const sound = availableSounds.find(s => s.id === soundId);
      if (!sound) return;

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create audio source
      const response = await fetch(sound.path);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();

      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Set volume
      gainNode.gain.value = volume * sound.volume;

      // Play sound
      source.start(0);
      setIsPlaying(true);
      onSoundPlay?.(soundId);

      // Reset playing state after sound duration
      setTimeout(() => setIsPlaying(false), sound.duration);

    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  const handleSoundChange = (soundId: string) => {
    setCurrentSound(soundId);
    // Play a preview of the new sound
    playSound(soundId);
  };

  const toggleEnabled = () => {
    setIsEnabled(!isEnabled);
  };

  const testSound = () => {
    playSound(currentSound);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MusicalNoteIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Notification Sounds</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleEnabled}
              className={`relative inline-flex items-center cursor-pointer ${
                isEnabled ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {isEnabled ? (
                <SpeakerWaveIcon className="h-5 w-5" />
              ) : (
                <SpeakerXMarkIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <CogIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={testSound}
            disabled={!isEnabled || isPlaying}
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isEnabled && !isPlaying
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isPlaying ? (
              <PauseIcon className="h-4 w-4" />
            ) : (
              <PlayIcon className="h-4 w-4" />
            )}
            <span>{isPlaying ? 'Playing...' : 'Test Sound'}</span>
          </button>

          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">Volume</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              disabled={!isEnabled}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{Math.round(volume * 100)}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Sound Settings</h4>
              
              {/* Sound Selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Notification Sound</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableSounds.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => handleSoundChange(sound.id)}
                      className={`p-2 text-xs rounded-md border transition-colors ${
                        currentSound === sound.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{sound.name}</div>
                      <div className="text-gray-500">{Math.round(sound.duration / 1000)}s</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Enable Sounds</label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={isEnabled}
                        onChange={() => setIsEnabled(true)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-xs text-gray-700">On</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!isEnabled}
                        onChange={() => setIsEnabled(false)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-xs text-gray-700">Off</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Auto-play</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-xs text-gray-700">Play sound when notification appears</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {isEnabled ? 'Sounds enabled' : 'Sounds disabled'}
          </span>
          <span>
            {availableSounds.find(s => s.id === currentSound)?.name} • {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Hidden audio element for fallback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
};

export default NotificationSoundPlayer;
