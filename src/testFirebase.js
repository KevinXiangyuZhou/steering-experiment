// Test script for Firebase integration
// Run this in the browser console to test Firebase connection

import { uploadExperimentDataWithRetry, isFirebaseConfigured } from './firebaseService.js';

// Test data
const testData = {
  participantId: 'test-participant-123',
  trialData: [
    {
      trialId: 1,
      condition: { tunnelWidth: 0.015, curvature: 0.01, timeLimit: null },
      completionTime: 5.2,
      boundaryViolationRate: 0.1,
      success: true,
      trajectory: [{ x: 0.1, y: 0.2 }, { x: 0.2, y: 0.3 }],
      speeds: [0.1, 0.2, 0.15],
      timestamps: [1000, 2000, 3000],
      excursions: []
    }
  ],
  summary: {
    totalTrials: 1,
    averageCompletionTime: 5.2,
    averageBoundaryViolationRate: 0.1,
    timeoutFailures: 0
  },
  experimentVersion: '2.0',
  completedAt: new Date().toISOString()
};

// Test function
async function testFirebaseUpload() {
  console.log('Testing Firebase configuration...');
  
  if (!isFirebaseConfigured()) {
    console.error('❌ Firebase not configured. Please update firebaseConfig.js');
    return;
  }
  
  console.log('✅ Firebase configuration looks good');
  console.log('Testing data upload...');
  
  try {
    const docId = await uploadExperimentDataWithRetry(testData);
    console.log('✅ Upload successful! Document ID:', docId);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

// Export for use in browser console
window.testFirebaseUpload = testFirebaseUpload;
window.testData = testData;

console.log('Firebase test loaded. Run testFirebaseUpload() to test the connection.');
