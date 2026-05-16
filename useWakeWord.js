/**
 * Wake Word Detection — "Hey Voco"
 * Uses continuous speech recognition via expo-av recording + transcript checking
 * (Porcupine requires native build; this works with Expo Go)
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { transcribeAudio } from '../services/transcription';

const WAKE_PHRASES = ['hey voco', 'hey boco', 'a voco', 'hey poco', 'hey coco', 'voco'];
const WAKE_CHUNK_DURATION = 3000; // record 3s chunks for wake word detection
const ASSEMBLYAI_KEY = 'e25476c2dbd74cfd965eb2143a614814';

export function useWakeWord({ onWakeWord, enabled = true }) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recordingRef = useRef(null);
  const enabledRef = useRef(enabled);
  const loopRef = useRef(false);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const checkForWakeWord = (transcript) => {
    if (!transcript) return false;
    const lower = transcript.toLowerCase().trim();
    return WAKE_PHRASES.some(phrase => lower.includes(phrase));
  };

  const recordChunk = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return false;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;

      await new Promise(r => setTimeout(r, WAKE_CHUNK_DURATION));

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      recordingRef.current = null;

      const uri = recording.getURI();
      if (!uri) return false;

      // Transcribe the chunk
      const text = await transcribeAudio(ASSEMBLYAI_KEY, uri).catch(() => '');
      return checkForWakeWord(text);
    } catch (e) {
      recordingRef.current = null;
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;
    setIsListening(true);
    loopRef.current = true;

    while (loopRef.current && enabledRef.current) {
      try {
        const detected = await recordChunk();
        if (detected && loopRef.current) {
          loopRef.current = false;
          setIsListening(false);
          onWakeWord?.();
          return;
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    setIsListening(false);
  }, [isListening, recordChunk, onWakeWord]);

  const stopListening = useCallback(async () => {
    loopRef.current = false;
    setIsListening(false);
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    return () => { loopRef.current = false; };
  }, []);

  return { isListening, error, startListening, stopListening };
}
