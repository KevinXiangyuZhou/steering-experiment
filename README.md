# Steering Experiment

A React-based human steering experiment with automatic data collection and Firebase integration.

## Features

- **Interactive Steering Task**: Navigate through curved and sequential tunnel segments
- **Multiple Trial Types**: Basic trials, time-constrained trials, and sequential tunnel trials
- **Real-time Data Collection**: Tracks cursor trajectory, speed, and boundary violations
- **Automatic Data Upload**: Firebase integration for cloud data storage
- **Data Analysis**: Python scripts for trajectory and performance analysis

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase (Optional)
1. Copy `src/firebaseConfig.template.js` to `src/firebaseConfig.js`
2. Follow the [Firebase Setup Guide](FIREBASE_SETUP.md) to configure your Firebase project
3. Update `src/firebaseConfig.js` with your Firebase configuration

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Data Collection

The experiment automatically collects:
- Cursor trajectory data
- Movement speed profiles
- Boundary violation events
- Trial completion times
- Success/failure status

Data is automatically uploaded to Firebase (if configured) and can be downloaded as JSON files.

## Data Analysis

Use the included Python analysis script:
```bash
python data_analysis.py experiment_data.json
```

This generates trajectory plots, speed profiles, and summary statistics.

## Deployment

The app is configured for GitHub Pages deployment with automatic builds via GitHub Actions.

## Technologies

- React 19
- Vite
- Firebase Firestore
- Canvas API
- Tailwind CSS
