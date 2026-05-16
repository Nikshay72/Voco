/**
 * AssemblyAI Transcription Service
 * Hardcoded API key for convenience
 */

const BASE = 'https://api.assemblyai.com/v2';
const DEFAULT_KEY = 'e25476c2dbd74cfd965eb2143a614814';

async function uploadAudio(apiKey, fileUri) {
  const fileData = await fetch(fileUri);
  const arrayBuffer = await fileData.arrayBuffer();
  const response = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: arrayBuffer,
  });
  if (!response.ok) {
    const t = await response.text();
    throw new Error(`Upload failed: ${response.status} ${t}`);
  }
  const { upload_url } = await response.json();
  return upload_url;
}

async function requestTranscript(apiKey, audioUrl) {
  const response = await fetch(`${BASE}/transcript`, {
    method: 'POST',
    headers: { authorization: apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_models: ['universal-2'],
      punctuate: true,
      format_text: true,
      language_code: 'en',
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${response.status}`);
  }
  const { id } = await response.json();
  return id;
}

async function pollTranscript(apiKey, id, onProgress) {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await fetch(`${BASE}/transcript/${id}`, {
      headers: { authorization: apiKey },
    });
    if (!res.ok) throw new Error('Polling failed');
    const data = await res.json();
    if (onProgress) onProgress(data.status);
    if (data.status === 'completed') return data.text || '';
    if (data.status === 'error') throw new Error(data.error || 'Transcription failed');
  }
  throw new Error('Transcription timed out');
}

export async function transcribeAudio(apiKey, fileUri, onProgress) {
  const key = apiKey || DEFAULT_KEY;
  if (onProgress) onProgress('uploading');
  const uploadUrl = await uploadAudio(key, fileUri);
  if (onProgress) onProgress('processing');
  const id = await requestTranscript(key, uploadUrl);
  return await pollTranscript(key, id, onProgress);
}
