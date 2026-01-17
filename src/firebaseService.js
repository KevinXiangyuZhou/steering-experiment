import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import firebaseConfig from './firebaseConfig.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Upload experiment data to Firebase Firestore
 * @param {Object} experimentData - The complete experiment data object
 * @returns {Promise<string>} - Document ID of the uploaded data
 */
export async function uploadExperimentData(experimentData) {
  try {
    // Add timestamp and upload to Firestore
    const dataWithTimestamp = {
      ...experimentData,
      uploadedAt: serverTimestamp(),
      version: '2.0' // Version of the experiment
    };

    const docRef = await addDoc(collection(db, 'user_study_results'), dataWithTimestamp);
    console.log('Data uploaded successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error uploading data to Firebase:', error);
    throw error;
  }
}

/**
 * Upload data with retry mechanism
 * @param {Object} experimentData - The complete experiment data object
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<string>} - Document ID of the uploaded data
 */
export async function uploadExperimentDataWithRetry(experimentData, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const docId = await uploadExperimentData(experimentData);
      return docId;
    } catch (error) {
      lastError = error;
      console.warn(`Upload attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed to upload data after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

/**
 * Check if Firebase is properly configured
 * @returns {boolean} - True if Firebase is configured
 */
export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "your-api-key-here" && 
         firebaseConfig.projectId !== "your-project-id";
}

/**
 * Download all experiment data from Firestore
 * @returns {Promise<Array>} - Array of all experiment data documents
 */
export async function downloadAllExperimentData() {
  try {
    const q = query(collection(db, 'user_study_results'), orderBy('uploadedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const allData = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore timestamps to ISO strings for JSON serialization
      if (data.uploadedAt && data.uploadedAt.toDate) {
        data.uploadedAt = data.uploadedAt.toDate().toISOString();
      }
      allData.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`Downloaded ${allData.length} documents from user_study_results`);
    return allData;
  } catch (error) {
    console.error('Error downloading data from Firebase:', error);
    throw error;
  }
}
