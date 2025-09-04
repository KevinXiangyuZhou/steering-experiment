# Firebase Setup Guide

This guide will help you set up Firebase for automatic data upload in the steering experiment.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "steering-experiment")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Firestore Database

1. In your Firebase project, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in production mode" (for production)
4. Select a location for your database (choose closest to your users)
5. Click "Done"

## 3. Get Firebase Configuration

1. In your Firebase project, go to "Project settings" (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (</>)
4. Register your app with a nickname (e.g., "steering-experiment-web")
5. Copy the Firebase configuration object

## 4. Update Configuration File

1. Open `src/firebaseConfig.js`
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 5. Set Up Firestore Security Rules (Optional)

For production, you may want to set up security rules. In Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to write to experiments collection
    // In production, you might want more restrictive rules
    match /experiments/{document} {
      allow write: if true;
      allow read: if false; // Only allow writes, not reads
    }
  }
}
```

## 6. Test the Integration

1. Start your development server: `npm run dev`
2. Complete the experiment
3. Check the "Experiment Complete" screen for upload status
4. Verify data appears in your Firestore Database

## 7. Monitor Data

- Go to Firestore Database in Firebase Console
- You should see an "experiments" collection
- Each document contains a complete experiment session
- Documents include: participantId, trialData, summary, uploadedAt, version

## Troubleshooting

### Upload Fails
- Check that Firebase configuration is correct
- Verify Firestore is enabled and accessible
- Check browser console for error messages
- Ensure internet connection is stable

### Configuration Not Working
- Make sure you copied the entire configuration object
- Verify the project ID matches your Firebase project
- Check that the API key is correct

### Data Not Appearing
- Check Firestore security rules
- Verify you're looking in the correct collection ("experiments")
- Check the browser console for any error messages

## Security Considerations

- The current setup allows anyone to write data to your database
- For production, consider implementing authentication
- Set up proper Firestore security rules
- Monitor your database usage and costs
- Consider implementing data validation on the server side

## Data Structure

Each uploaded document contains:
```javascript
{
  participantId: "string",
  trialData: [/* array of trial objects */],
  summary: {
    totalTrials: number,
    averageCompletionTime: number,
    averageBoundaryViolationRate: number,
    timeoutFailures: number
  },
  experimentVersion: "2.0",
  completedAt: "ISO timestamp",
  uploadedAt: "Firebase timestamp"
}
```
