/**
 * Text-to-Speech service using expo-speech
 */
import * as Speech from 'expo-speech';

const DEFAULT_OPTIONS = {
  language: 'en-IN',
  pitch: 1.0,
  rate: 0.95,
  voice: undefined, // uses system default
};

export async function speak(text, options = {}) {
  try {
    // Stop any current speech first
    await Speech.stop();
    await new Promise(r => setTimeout(r, 100));
    Speech.speak(text, { ...DEFAULT_OPTIONS, ...options });
  } catch (e) {
    console.warn('TTS error:', e);
  }
}

export async function stopSpeaking() {
  try {
    await Speech.stop();
  } catch (e) {}
}

export const PHRASES = {
  READY: 'Voco is ready. Say Hey Voco to start.',
  LISTENING: 'Listening',
  PROCESSING: 'Processing your message',
  SENDING: (name) => `Sending message to ${name}`,
  SENT: (name) => `Message sent to ${name} successfully`,
  SENT_GROUP: (name, count) => `Message sent to ${count} members of ${name}`,
  NOT_FOUND: (name) => `Sorry, I could not find contact ${name}`,
  ERROR: 'Sorry, something went wrong. Please try again.',
  NO_MESSAGE: 'I could not understand the message. Please try again.',
  WAKE_CONFIRM: 'Yes, I am listening',
};
