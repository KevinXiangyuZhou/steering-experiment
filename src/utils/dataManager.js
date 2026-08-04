import { uploadSessionDocuments, isFirebaseConfigured } from '../firebaseService.js';

export const downloadData = (participantId, prolificData, trialData) => {
  const data = {
    participantId,
    prolificData,
    trialData,
    summary: {
      totalTrials: trialData.length,
      averageCompletionTime: trialData.reduce((sum, t) => sum + t.completionTime, 0) / trialData.length,
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `steering_experiment_${participantId}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const MAX_CHUNK_BYTES = 800000;

// Splits trialData into chunks whose serialized size stays under maxBytes, accumulating trial-by-
// trial rather than by a fixed count (trial byte size varies 10x+ by participant speed/hesitation,
// so a fixed-count split isn't safe). A single trial that alone exceeds maxBytes is isolated in its
// own chunk rather than erroring.
const chunkTrialData = (trialData, maxBytes = MAX_CHUNK_BYTES) => {
  const chunks = [];
  let currentChunk = [];
  let currentSize = 2; // account for the enclosing []

  for (const trial of trialData) {
    const trialSize = JSON.stringify(trial).length + 1;
    if (currentChunk.length > 0 && currentSize + trialSize > maxBytes) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentSize = 2;
    }
    currentChunk.push(trial);
    currentSize += trialSize;
  }
  if (currentChunk.length > 0) chunks.push(currentChunk);
  return chunks;
};

export const uploadData = async (participantId, prolificData, trialData) => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase not configured. Please check your configuration.');
  }

  // Firestore's 1 MiB per-document limit means a full session's trialData can't always fit in one
  // document — split across a session document (metadata/summary) + N trial-chunk documents,
  // linked by a shared sessionId (Firestore's addDoc always creates a new doc rather than
  // upserting, so this client-generated ID — not the auto doc IDs — is what ties them together).
  const sessionId = `${participantId}_${Date.now()}`;
  const summary = {
    totalTrials: trialData.length,
    averageCompletionTime: trialData.reduce((sum, t) => sum + t.completionTime, 0) / trialData.length,
  };
  const completedAt = new Date().toISOString();
  const chunks = chunkTrialData(trialData);

  const sessionDoc = {
    docType: 'session',
    sessionId,
    participantId,
    prolificData,
    summary,
    experimentVersion: '3.0',
    completedAt,
    chunkCount: chunks.length
  };

  // participantId denormalized onto each chunk too, so chunks are self-describing for any script
  // that queries them directly without joining back to the session doc.
  const chunkDocs = chunks.map((chunk, chunkIndex) => ({
    docType: 'trialChunk',
    sessionId,
    participantId,
    chunkIndex,
    trialData: chunk
  }));

  return uploadSessionDocuments([sessionDoc, ...chunkDocs]);
};
