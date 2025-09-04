// Script to download all experiment data from Firebase
// Run with: node downloadData.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Use the same config as your app
const firebaseConfig = {
  apiKey: "AIzaSyDwst-4J5unX773oOfXHfjdOymh02yH_fU",
  authDomain: "steering-experiment.firebaseapp.com",
  projectId: "steering-experiment",
  storageBucket: "steering-experiment.firebasestorage.app",
  messagingSenderId: "773443415350",
  appId: "1:773443415350:web:f95e4d189b16ebb76d9797",
  measurementId: "G-RFZQQVCF7C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function downloadAllData() {
  try {
    console.log('Downloading all experiment data...');
    
    // Get all documents from experiments collection
    const experimentsRef = collection(db, 'experiments');
    const snapshot = await getDocs(experimentsRef);
    
    const allData = [];
    snapshot.forEach((doc) => {
      allData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Save to file
    const filename = `all_experiment_data_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    
    console.log(`✅ Downloaded ${allData.length} experiments to ${filename}`);
    
    // Also create individual files for each participant
    const participantsDir = 'participant_data';
    if (!fs.existsSync(participantsDir)) {
      fs.mkdirSync(participantsDir);
    }
    
    allData.forEach((experiment, index) => {
      const participantId = experiment.participantId || `unknown_${index}`;
      const filename = `${participantsDir}/${participantId}_${experiment.id}.json`;
      fs.writeFileSync(filename, JSON.stringify(experiment, null, 2));
    });
    
    console.log(`✅ Individual participant files saved to ${participantsDir}/`);
    
  } catch (error) {
    console.error('❌ Error downloading data:', error);
  }
}

downloadAllData();
