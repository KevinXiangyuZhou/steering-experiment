import { uploadExperimentDataWithRetry, isFirebaseConfigured } from '../firebaseService.js';

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

export const uploadData = async (participantId, prolificData, trialData) => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase not configured. Please check your configuration.');
  }

  const data = {
    participantId,
    prolificData,
    trialData,
    summary: {
      totalTrials: trialData.length,
      averageCompletionTime: trialData.reduce((sum, t) => sum + t.completionTime, 0) / trialData.length,
    },
    experimentVersion: '3.0',
    completedAt: new Date().toISOString()
  };

  const docId = await uploadExperimentDataWithRetry(data);
  return docId;
};

