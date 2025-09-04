// Server-side data download using Firebase Admin SDK
// This bypasses security rules and requires service account credentials

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin SDK
// You'll need to download a service account key from Firebase Console
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'steering-experiment'
});

const db = admin.firestore();

async function downloadAllDataAdmin() {
  try {
    console.log('Downloading all experiment data using Admin SDK...');
    
    // Get all documents from experiments collection
    const snapshot = await db.collection('experiments').get();
    
    const allData = [];
    snapshot.forEach((doc) => {
      allData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Save to file
    const filename = `all_experiment_data_admin_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(allData, null, 2));
    
    console.log(`✅ Downloaded ${allData.length} experiments to ${filename}`);
    
  } catch (error) {
    console.error('❌ Error downloading data:', error);
  }
}

downloadAllDataAdmin();
