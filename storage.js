import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  API_KEY: '@voicemsg:api_key',
  HISTORY: '@voicemsg:history',
};

export async function saveApiKey(key) {
  await AsyncStorage.setItem(KEYS.API_KEY, key);
}

export async function loadApiKey() {
  return await AsyncStorage.getItem(KEYS.API_KEY) || '';
}

export async function saveMessage(entry) {
  const existing = await loadHistory();
  const updated = [entry, ...existing].slice(0, 100); // keep max 100
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
  return updated;
}

export async function loadHistory() {
  const raw = await AsyncStorage.getItem(KEYS.HISTORY);
  return raw ? JSON.parse(raw) : [];
}

export async function clearHistory() {
  await AsyncStorage.removeItem(KEYS.HISTORY);
}

export function createHistoryEntry(contact, message, transcript) {
  return {
    id: Date.now().toString(),
    contact,
    message,
    transcript,
    timestamp: new Date().toISOString(),
    status: 'pending', // 'pending' | 'sent' | 'failed'
  };
}
