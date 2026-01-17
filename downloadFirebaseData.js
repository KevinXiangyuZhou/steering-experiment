// Script to download all data from Firebase Firestore
// Run this in Node.js: npm run download-data

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration (without analytics for Node.js)
const firebaseConfig = {
  apiKey: "AIzaSyDwst-4J5unX773oOfXHfjdOymh02yH_fU",
  authDomain: "steering-experiment.firebaseapp.com",
  projectId: "steering-experiment",
  storageBucket: "steering-experiment.firebasestorage.app",
  messagingSenderId: "773443415350",
  appId: "1:773443415350:web:f95e4d189b16ebb76d9797"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function downloadAllData() {
  try {
    console.log('Connecting to Firebase...');
    
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
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save to JSON file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(outputDir, `user_study_results_${timestamp}.json`);
    
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2), 'utf8');
    console.log(`Data saved to: ${filename}`);
    
    // Also save a summary
    const summary = {
      totalDocuments: allData.length,
      downloadDate: new Date().toISOString(),
      participantIds: [...new Set(allData.map(d => d.participantId))],
      totalTrials: allData.reduce((sum, d) => sum + (d.trialData?.length || 0), 0)
    };
    
    const summaryFilename = path.join(outputDir, `summary_${timestamp}.json`);
    fs.writeFileSync(summaryFilename, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`Summary saved to: ${summaryFilename}`);
    
    console.log('\nSummary:');
    console.log(`  Total participants: ${summary.participantIds.length}`);
    console.log(`  Total documents: ${summary.totalDocuments}`);
    console.log(`  Total trials: ${summary.totalTrials}`);
    
    return allData;
  } catch (error) {
    console.error('Error downloading data:', error);
    throw error;
  }
}

// Run the download
downloadAllData()
  .then(() => {
    console.log('\nDownload complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Download failed:', error);
    process.exit(1);
  });
