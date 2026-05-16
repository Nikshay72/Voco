const ASSEMBLYAI_BASE = 'https://api.assemblyai.com/v2';

/**
 * Upload audio file to AssemblyAI and get back the upload URL.
 * @param {string} apiKey - AssemblyAI API key
 * @param {string} fileUri - local file URI from expo-av recording
 */
export async function uploadAudio(apiKey, fileUri) {
  const fileData = await fetch(fileUri);
  const blob = await fileData.blob();

  const response = await fetch(`${ASSEMBLYAI_BASE}/upload`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: blob,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Upload failed');
  }

  const { upload_url } = await response.json();
  return upload_url;
}

/**
 * Submit a transcription request for the uploaded audio URL.
 */
export async function requestTranscript(apiKey, audioUrl) {
  const response = await fetch(`${ASSEMBLYAI_BASE}/transcript`, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_models: ['universal-2'],
      punctuate: true,
      format_text: true,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Transcription request failed');
  }

  const { id } = await response.json();
  return id;
}

/**
 * Poll the transcript status until completed or errored.
 * @param {function} onProgress - optional callback with status string
 */
export async function pollTranscript(apiKey, transcriptId, onProgress) {
  const MAX_ATTEMPTS = 30;
  const POLL_INTERVAL = 2000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await delay(POLL_INTERVAL);

    const response = await fetch(`${ASSEMBLYAI_BASE}/transcript/${transcriptId}`, {
      headers: { authorization: apiKey },
    });

    if (!response.ok) throw new Error('Polling failed');

    const data = await response.json();

    if (onProgress) onProgress(data.status);

    if (data.status === 'completed') {
      return data.text || '';
    }

    if (data.status === 'error') {
      throw new Error(data.error || 'Transcription failed');
    }
  }

  throw new Error('Transcription timed out');
}

/**
 * Full pipeline: upload → request → poll
 */
export async function transcribeAudio(apiKey, fileUri, onProgress) {
  if (onProgress) onProgress('uploading');
  const uploadUrl = await uploadAudio(apiKey, fileUri);

  if (onProgress) onProgress('queued');
  const transcriptId = await requestTranscript(apiKey, uploadUrl);

  if (onProgress) onProgress('processing');
  const text = await pollTranscript(apiKey, transcriptId, onProgress);

  return text;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
