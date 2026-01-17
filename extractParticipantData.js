// Script to extract data into separate JSON files for each participant
// Run this in Node.js: npm run extract-participants

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractParticipantData(inputFile, outputDir) {
  try {
    console.log(`Reading data from: ${inputFile}`);
    
    // Read the input JSON file
    const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    
    if (!Array.isArray(data)) {
      throw new Error('Input file must contain an array of documents');
    }
    
    console.log(`Found ${data.length} documents`);
    
    // Group data by participantId
    const participantsMap = new Map();
    
    data.forEach((doc) => {
      const participantId = doc.participantId;
      
      if (!participantId) {
        console.warn('Document missing participantId, skipping:', doc.id);
        return;
      }
      
      if (!participantsMap.has(participantId)) {
        participantsMap.set(participantId, []);
      }
      
      participantsMap.get(participantId).push(doc);
    });
    
    console.log(`Found ${participantsMap.size} unique participants`);
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write each participant's data to a separate file
    const participantFiles = [];
    
    participantsMap.forEach((documents, participantId) => {
      // Sort documents by uploadedAt if available
      documents.sort((a, b) => {
        const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return timeB - timeA; // Most recent first
      });
      
      // Create participant data object
      const participantData = {
        participantId: participantId,
        totalSessions: documents.length,
        sessions: documents.map(doc => ({
          documentId: doc.id,
          uploadedAt: doc.uploadedAt,
          version: doc.version || doc.experimentVersion,
          prolificData: doc.prolificData,
          trialData: doc.trialData,
          summary: doc.summary,
          completedAt: doc.completedAt
        })),
        // Aggregate summary across all sessions
        aggregateSummary: {
          totalSessions: documents.length,
          totalTrials: documents.reduce((sum, doc) => sum + (doc.trialData?.length || 0), 0),
          averageTrialsPerSession: documents.length > 0 
            ? documents.reduce((sum, doc) => sum + (doc.trialData?.length || 0), 0) / documents.length 
            : 0,
          averageCompletionTime: documents.length > 0
            ? documents.reduce((sum, doc) => {
                const sessionAvg = doc.summary?.averageCompletionTime || 0;
                return sum + sessionAvg;
              }, 0) / documents.length
            : 0
        }
      };
      
      // Sanitize filename (remove invalid characters)
      const safeParticipantId = participantId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = path.join(outputDir, `participant_${safeParticipantId}.json`);
      
      fs.writeFileSync(filename, JSON.stringify(participantData, null, 2), 'utf8');
      participantFiles.push({
        participantId,
        filename: path.basename(filename),
        sessions: documents.length,
        trials: documents.reduce((sum, doc) => sum + (doc.trialData?.length || 0), 0)
      });
      
      console.log(`  ✓ Saved ${documents.length} session(s) for participant ${participantId}`);
    });
    
    // Create an index file listing all participants
    const indexData = {
      extractionDate: new Date().toISOString(),
      sourceFile: path.basename(inputFile),
      totalParticipants: participantsMap.size,
      participants: participantFiles
    };
    
    const indexFilename = path.join(outputDir, 'participants_index.json');
    fs.writeFileSync(indexFilename, JSON.stringify(indexData, null, 2), 'utf8');
    
    console.log(`\nExtraction complete!`);
    console.log(`  Total participants: ${participantsMap.size}`);
    console.log(`  Output directory: ${outputDir}`);
    console.log(`  Index file: ${path.basename(indexFilename)}`);
    
    return participantFiles;
  } catch (error) {
    console.error('Error extracting participant data:', error);
    throw error;
  }
}

// Main execution
const inputFile = process.argv[2] || path.join(__dirname, 'data', 'user_study_results_2026-01-14T22-28-33-974Z.json');
const outputDir = process.argv[3] || path.join(__dirname, 'data', 'participants');

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  console.log('\nUsage: node extractParticipantData.js [input_file] [output_directory]');
  console.log('Example: node extractParticipantData.js data/user_study_results.json data/participants');
  process.exit(1);
}

try {
  extractParticipantData(inputFile, outputDir);
  process.exit(0);
} catch (error) {
  console.error('Extraction failed:', error);
  process.exit(1);
}
