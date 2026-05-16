/**
 * useRecorder — Audio recording with silence detection
 * Auto-stops after 2s of silence
 */
import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

const SILENCE_THRESHOLD_DB = -38;
const SILENCE_DURATION_MS = 2000;
const MIN_RECORDING_MS = 1200;

const RECORDING_OPTIONS = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 64000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: { mimeType: 'audio/webm', bitsPerSecond: 64000 },
};

export function useRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [levels, setLevels] = useState(Array(20).fill(0.05));

  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasSpokenRef = useRef(false);
  const startTimeRef = useRef(null);
  const onAutoStopRef = useRef(null);

  const stopRecording = useCallback(async () => {
    try {
      clearInterval(timerRef.current);
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      setLevels(Array(20).fill(0.05));
      setIsRecording(false);
      hasSpokenRef.current = false;

      const recording = recordingRef.current;
      if (!recording) return null;
      recordingRef.current = null;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      return recording.getURI();
    } catch (e) {
      return null;
    }
  }, []);

  const startRecording = useCallback(async (onAutoStop) => {
    try {
      hasSpokenRef.current = false;
      onAutoStopRef.current = onAutoStop;

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') throw new Error('Microphone permission denied');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        RECORDING_OPTIONS,
        (status) => {
          if (!status.isRecording) return;
          const db = status.metering ?? -160;
          const normalized = Math.max(0, Math.min(1, (db + 60) / 60));
          setLevels(prev => [...prev.slice(1), normalized]);

          const elapsed = Date.now() - (startTimeRef.current || Date.now());
          if (elapsed < MIN_RECORDING_MS) return;

          if (db > SILENCE_THRESHOLD_DB) {
            hasSpokenRef.current = true;
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          } else if (hasSpokenRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(async () => {
              const uri = await stopRecording();
              if (uri && onAutoStopRef.current) onAutoStopRef.current(uri);
            }, SILENCE_DURATION_MS);
          }
        },
        80
      );

      recordingRef.current = recording;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (e) {
      setIsRecording(false);
    }
  }, [stopRecording]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return { isRecording, duration, durationLabel: formatDuration(duration), levels, startRecording, stopRecording };
}
