import React, { useState, useEffect, useRef, useCallback } from 'react';
import { uploadExperimentDataWithRetry, isFirebaseConfigured } from './firebaseService.js';
import { Monitor, Mouse, Settings, Eye, Users, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react';

// Experiment phases
const ExperimentPhase = {
  ENVIRONMENT_SETUP: 'environment_setup',
  SCREEN_CALIBRATION: 'screen_calibration',
  WELCOME: 'welcome',
  INSTRUCTIONS: 'instructions',
  PRACTICE: 'practice',
  MAIN_TRIALS: 'main_trials',
  SEQUENTIAL_TRIALS: 'sequential_trials',
  TIME_CONSTRAINT_INTRO: 'time_constraint_intro',
  TIME_TRIAL_PRACTICE: 'time_trial_practice',
  TIME_TRIALS: 'time_trials',
  SEQUENTIAL_TIME_TRIALS: 'sequential_time_trials',
  COMPLETE: 'complete'
};

// Trial states
const TrialState = {
  WAITING_FOR_START: 'waiting_for_start',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Trial conditions
const BASIC_CONDITIONS = [
  { id: 1, tunnelWidth: 0.05, curvature: 0.025, timeLimit: null, description: "wide tunnel, gentle curve" },
  { id: 2, tunnelWidth: 0.05, curvature: 0.05, timeLimit: null, description: "wide tunnel, sharp curve" },
  { id: 3, tunnelWidth: 0.02, curvature: 0.025, timeLimit: null, description: "narrow tunnel, gentle curve" },
  { id: 4, tunnelWidth: 0.02, curvature: 0.05, timeLimit: null, description: "narrow tunnel, sharp curve" },
];

const TIME_CONDITIONS = [
  { id: 11, tunnelWidth: 0.05, curvature: 0.025, timeLimit: 4, description: "wide tunnel, gentle curve time limit 4s" },
  { id: 12, tunnelWidth: 0.05, curvature: 0.05, timeLimit: 4, description: "wide tunnel, sharp curve time limit 4s" },
  { id: 13, tunnelWidth: 0.02, curvature: 0.025, timeLimit: 4, description: "narrow tunnel, gentle curve time limit 4s" },
  { id: 14, tunnelWidth: 0.02, curvature: 0.05, timeLimit: 4, description: "narrow tunnel, sharp curve time limit 4s" },
  { id: 15, tunnelWidth: 0.05, curvature: 0.025, timeLimit: 2, description: "wide tunnel, gentle curve time limit 2s" },
  { id: 16, tunnelWidth: 0.05, curvature: 0.05, timeLimit: 2, description: "wide tunnel, sharp curve time limit 2s" },
  { id: 17, tunnelWidth: 0.02, curvature: 0.025, timeLimit: 2, description: "narrow tunnel, gentle curve time limit 2s" },
  { id: 18, tunnelWidth: 0.02, curvature: 0.05, timeLimit: 2, description: "narrow tunnel, sharp curve time limit 2s" },
];

// Sequential tunnel conditions (2 segments)
const SEQUENTIAL_CONDITIONS = [
  // Wide-to-narrow trials
  { id: 5, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.08, segment2Width: 0.01, timeLimit: null, description: "narrow-to-wide segments" },
  { id: 6, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.01, segment2Width: 0.08, timeLimit: null, description: "wide-to-narrow segments" },
  
  // Straight-to-curved trials
  { id: 7, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.02, segment2Width: 0.02, segment1Curvature: 0, segment2Curvature: 0.05, timeLimit: null, description: "straight-to-curved segments" },
  { id: 8, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.05, segment2Width: 0.05, segment1Curvature: 0, segment2Curvature: 0.05, timeLimit: null, description: "straight-to-curved segments" },
];

// Sequential tunnel time-constrained conditions
const SEQUENTIAL_TIME_CONDITIONS = [
  // Wide-to-narrow trials with time limits
  { id: 19, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.08, segment2Width: 0.01, timeLimit: 2, description: "narrow-to-wide segments time limit 2s" },
  { id: 20, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.01, segment2Width: 0.08, timeLimit: 2, description: "wide-to-narrow segments time limit 2s" },
  { id: 21, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.08, segment2Width: 0.01, timeLimit: 1, description: "narrow-to-wide segments time limit 1s" },
  { id: 22, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.01, segment2Width: 0.08, timeLimit: 1, description: "wide-to-narrow segments time limit 1s" },
  
  // Straight-to-curved trials
  { id: 23, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.02, segment2Width: 0.02, segment1Curvature: 2, segment2Curvature: 0.05, timeLimit: 2, description: "straight-to-curved segments time limit 2s" },
  { id: 24, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.05, segment2Width: 0.05, segment1Curvature: 2, segment2Curvature: 0.05, timeLimit: 2, description: "straight-to-curved segments time limit 2s" },
  { id: 25, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.02, segment2Width: 0.02, segment1Curvature: 1, segment2Curvature: 0.05, timeLimit: 1, description: "straight-to-curved segments time limit 1s" },
  { id: 26, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.05, segment2Width: 0.05, segment1Curvature: 1, segment2Curvature: 0.05, timeLimit: 1, description: "straight-to-curved segments time limit 1s" },

];

const HumanSteeringExperiment = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  
  // Canvas dimensions
  const CANVAS_WIDTH = 460;
  const CANVAS_HEIGHT = 260;
  const SCALE = 1000;

  // Experiment state
  const [phase, setPhase] = useState(ExperimentPhase.WELCOME);
  const [trialState, setTrialState] = useState(TrialState.WAITING_FOR_START);
  const [participantId, setParticipantId] = useState('');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentConditions, setCurrentConditions] = useState([]);
  const [isPractice, setIsPractice] = useState(false);
  const [currentPracticeCondition, setCurrentPracticeCondition] = useState(null);
  const [practicedConditions, setPracticedConditions] = useState(new Set());

  // Trial data
  const [trialData, setTrialData] = useState([]);
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [timestampHistory, setTimestampHistory] = useState([]);
  
  // Upload state
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
  const [uploadError, setUploadError] = useState(null);
  const [uploadedDocId, setUploadedDocId] = useState(null);
  const [excursionEvents, setExcursionEvents] = useState([]);
  const [excursionMarkers, setExcursionMarkers] = useState([]); // New: markers for boundary excursions
  const [hasExcursionMarker, setHasExcursionMarker] = useState(false); // Track if excursion already marked

  // Environment state
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVel, setCursorVel] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState(null);
  const [tunnelPath, setTunnelPath] = useState([]);
  const [tunnelWidth, setTunnelWidth] = useState(0.015);
  const [tunnelType, setTunnelType] = useState('curved'); // 'curved' or 'sequential'
  const [segmentWidths, setSegmentWidths] = useState([0.015, 0.025, 0.015]); // For sequential tunnels
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [startButtonPos, setStartButtonPos] = useState({ x: 0, y: 0 });

  // Timer state
  const [trialStartTime, setTrialStartTime] = useState(0);
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [failedDueToTimeout, setFailedDueToTimeout] = useState(false);

  // Constants
  const START_BUTTON_RADIUS = 0.008;
  const TARGET_RADIUS = 0.01;
  const TUNNEL_STEP = 0.002;

  // Check if current phase should enforce boundary constraints (interrupt on violation)
  const shouldEnforceBoundaries = useCallback(() => {
    return phase === ExperimentPhase.MAIN_TRIALS || phase === ExperimentPhase.SEQUENTIAL_TRIALS;
  }, [phase]);

  // Check if current phase should mark boundary violations (but not interrupt)
  const shouldMarkBoundaries = useCallback(() => {
    return phase === ExperimentPhase.PRACTICE || phase === ExperimentPhase.MAIN_TRIALS || phase === ExperimentPhase.SEQUENTIAL_TRIALS;
  }, [phase]);

  // Generate tunnel path
  const generateTunnelPath = useCallback((curvature) => {
    const tunnelStartX = 0.0;
    const tunnelEndX = 0.46;
    const tunnelYBase = 0.13;
    const amplitude = curvature;
    const wavelength = 0.15;
    
    const path = [];
    for (let x = tunnelStartX; x < tunnelEndX; x += TUNNEL_STEP) {
      const y = tunnelYBase + amplitude * Math.sin(2 * Math.PI * x / wavelength);
      path.push({ x, y });
    }
    return path;
  }, []);

  // Generate sequential tunnel segments (2 segments)
  const generateSequentialTunnelPath = useCallback((condition) => {
    const tunnelStartX = 0.0;
    const tunnelEndX = 0.46;
    const tunnelYBase = 0.13;
    const segmentLength = (tunnelEndX - tunnelStartX) / 2; // 2 segments instead of 3
    
    const path = [];
    for (let x = tunnelStartX; x < tunnelEndX; x += TUNNEL_STEP) {
      let y = tunnelYBase; // Default horizontal line
      
      // Apply curvature for straight-to-curved segments
      if (condition.segmentType === 'curvature') {
        if (x < tunnelStartX + segmentLength) {
          // First segment: straight (curvature = 0)
          y = tunnelYBase;
        } else {
          // Second segment: curved with single peak
          const segmentX = x - (tunnelStartX + segmentLength);
          const amplitude = condition.segment2Curvature;
          const segmentWidth = segmentLength;
          // Create a single peak curve using a quadratic function
          const normalizedX = segmentX / segmentWidth; // 0 to 1
          y = tunnelYBase + amplitude * (1 - Math.pow(2 * normalizedX - 1, 2));
        }
      }
      
      path.push({ x, y });
    }
    return path;
  }, []);

  // Setup trial with given condition
  const setupTrial = useCallback((condition) => {
    let path;
    if (condition.tunnelType === 'sequential') {
      path = generateSequentialTunnelPath(condition);
      setTunnelType('sequential');
      setSegmentWidths([condition.segment1Width, condition.segment2Width]);
      setTunnelWidth(condition.segment1Width); // Use first segment width as default
    } else {
      path = generateTunnelPath(condition.curvature);
      setTunnelType('curved');
      setTunnelWidth(condition.tunnelWidth);
    }
    setTunnelPath(path);
    setTimeLimit(condition.timeLimit);
    
    const startPos = path[0];
    const endPos = path[path.length - 1];
    
    setStartButtonPos(startPos);
    setTargetPos(endPos);
    setCursorPos(startPos);
    setCursorVel({ x: 0, y: 0 });
    
    setTrialState(TrialState.WAITING_FOR_START);
    setTrajectoryPoints([]);
    setSpeedHistory([]);
    setTimestampHistory([]);
    setExcursionEvents([]);
    setExcursionMarkers([]); // Clear excursion markers
    setHasExcursionMarker(false); // Reset excursion marker flag
    setTrialStartTime(0);
    setLastMousePos(null);
    setTimeRemaining(condition.timeLimit || 0);
    setFailedDueToTimeout(false);
  }, [generateTunnelPath, generateSequentialTunnelPath]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (phase) {
        case ExperimentPhase.WELCOME:
          if (event.key === 'Enter') {
            setPhase(ExperimentPhase.ENVIRONMENT_SETUP);
          }
          break;

        case ExperimentPhase.ENVIRONMENT_SETUP:
          if (event.key === ' ') {
            setPhase(ExperimentPhase.SCREEN_CALIBRATION);
          }
          break;

        case ExperimentPhase.SCREEN_CALIBRATION:
          if (event.key === ' ') {
            setPhase(ExperimentPhase.INSTRUCTIONS);
          }
          break;
        
        case ExperimentPhase.INSTRUCTIONS:
          if (event.key === ' ') {
            setPhase(ExperimentPhase.PRACTICE);
            setIsPractice(true);
            setupTrial(BASIC_CONDITIONS[0]);
          }
          break;
        
        case ExperimentPhase.PRACTICE:
          if (event.key === 'r') {
            setupTrial(BASIC_CONDITIONS[0]);
          } else if (event.key === 'n') {
            setPhase(ExperimentPhase.MAIN_TRIALS);
            setCurrentTrial(0);
            setCurrentConditions([...BASIC_CONDITIONS]);
            setIsPractice(false);
            if (!participantId) {
              setParticipantId(`P${new Date().toTimeString().slice(0,8).replace(/:/g,'')}`);
            }
            setupTrial(BASIC_CONDITIONS[0]);
          }
          break;
        
        case ExperimentPhase.MAIN_TRIALS:
          if (event.key === 'r') {
            setupTrial(currentConditions[currentTrial]);
          }
          break;
        

        
        case ExperimentPhase.SEQUENTIAL_TRIALS:
          if (event.key === 'r') {
            setupTrial(currentConditions[currentTrial]);
          }
          break;
        
        case ExperimentPhase.TIME_CONSTRAINT_INTRO:
          if (event.key === ' ') {
            // Set up for time trials
            const newConditions = [...TIME_CONDITIONS];
            setCurrentTrial(0);
            setCurrentConditions(newConditions);
            setPracticedConditions(new Set());
            
            // Check if first condition needs practice (it always will since we cleared practiced conditions)
            const firstCondition = newConditions[0];
            const conditionKey = `${firstCondition.tunnelWidth}-${firstCondition.curvature}-${firstCondition.timeLimit}`;
            
            // Start with practice for first time trial
            setPhase(ExperimentPhase.TIME_TRIAL_PRACTICE);
            setCurrentPracticeCondition(firstCondition);
            setIsPractice(true);
            setupTrial(firstCondition);
          }
          break;
        
        case ExperimentPhase.TIME_TRIAL_PRACTICE:
          if (event.key === 'r') {
            setupTrial(currentPracticeCondition);
          } else if (event.key === 'n') {
            // Mark this condition as practiced
            let conditionKey;
            
            if (currentPracticeCondition.tunnelType === 'sequential') {
              // For sequential trials, use tunnel type and segment parameters
              if (currentPracticeCondition.segmentType === 'width') {
                conditionKey = `sequential-width-${currentPracticeCondition.segment1Width}-${currentPracticeCondition.segment2Width}-${currentPracticeCondition.timeLimit}`;
              } else {
                conditionKey = `sequential-curvature-${currentPracticeCondition.segment1Width}-${currentPracticeCondition.segment2Width}-${currentPracticeCondition.segment1Curvature}-${currentPracticeCondition.segment2Curvature}-${currentPracticeCondition.timeLimit}`;
              }
            } else {
              // For regular curved trials
              conditionKey = `${currentPracticeCondition.tunnelWidth}-${currentPracticeCondition.curvature}-${currentPracticeCondition.timeLimit}`;
            }
            
            setPracticedConditions(prev => new Set([...prev, conditionKey]));
            
            // Move to the actual trial for the CURRENT trial number (don't increment)
            // Return to the appropriate phase based on trial type
            if (currentPracticeCondition.tunnelType === 'sequential') {
              setPhase(ExperimentPhase.SEQUENTIAL_TIME_TRIALS);
            } else {
              setPhase(ExperimentPhase.TIME_TRIALS);
            }
            setIsPractice(false);
            setupTrial(currentConditions[currentTrial]);
          }
          break;
        
        case ExperimentPhase.TIME_TRIALS:
          if (event.key === 'r') {
            setupTrial(currentConditions[currentTrial]);
          }
          break;
        

        
        case ExperimentPhase.SEQUENTIAL_TIME_TRIALS:
          if (event.key === 'r') {
            setupTrial(currentConditions[currentTrial]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, currentTrial, currentConditions, currentPracticeCondition, participantId, setupTrial]);

  // Handle mouse events
  const handleMouseClick = (event) => {
    if (![ExperimentPhase.PRACTICE, ExperimentPhase.MAIN_TRIALS, 
          ExperimentPhase.SEQUENTIAL_TRIALS,
          ExperimentPhase.TIME_TRIAL_PRACTICE, 
          ExperimentPhase.TIME_TRIALS,
          ExperimentPhase.SEQUENTIAL_TIME_TRIALS].includes(phase)) {
      return;
    }
    
    if (trialState !== TrialState.WAITING_FOR_START) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / SCALE;
    const y = (event.clientY - rect.top) / SCALE;
    
    const distance = Math.sqrt((x - startButtonPos.x) ** 2 + (y - startButtonPos.y) ** 2);
    
    if (distance <= START_BUTTON_RADIUS) {
      startTrialMovement();
    }
  };

  const handleMouseMove = (event) => {
    if (![ExperimentPhase.PRACTICE, ExperimentPhase.MAIN_TRIALS, 
          ExperimentPhase.SEQUENTIAL_TRIALS,
          ExperimentPhase.TIME_TRIAL_PRACTICE, 
          ExperimentPhase.TIME_TRIALS,
          ExperimentPhase.SEQUENTIAL_TIME_TRIALS].includes(phase)) {
      return;
    }
    
    if (trialState !== TrialState.IN_PROGRESS) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / SCALE;
    const y = (event.clientY - rect.top) / SCALE;
    
    const currentTime = Date.now();
    
    // Calculate velocity if we have a previous position
    let velocity = { x: 0, y: 0 };
    if (lastMousePos && lastTimeRef.current) {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      if (dt > 0) {
        const dx = x - lastMousePos.x;
        const dy = y - lastMousePos.y;
        velocity = { x: dx / dt, y: dy / dt };
      }
    }
    
    // Update cursor position and velocity
    setCursorPos({ x, y });
    setCursorVel(velocity);
    
    // Record data immediately when position updates
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    setTrajectoryPoints(prev => [...prev, { x, y }]);
    setSpeedHistory(prev => [...prev, speed]);
    setTimestampHistory(prev => [...prev, currentTime]);
    
         // Check for excursions and mark them
     if (shouldMarkBoundaries()) {
       const excursionResult = checkTunnelExcursions(x, y);
       if (excursionResult.isExcursion && !hasExcursionMarker) {
         // Add marker at boundary location (only once per trial)
         setExcursionMarkers([excursionResult.boundaryPoint]);
         setHasExcursionMarker(true);
         
         // Only interrupt trial if boundaries are enforced (main trials, not practice)
         if (shouldEnforceBoundaries()) {
           setTrialState(TrialState.FAILED);
           return; // Don't continue processing this movement
         }
         // In practice mode, just mark the excursion and continue
       }
     }
    
    // Check for trial completion
    const targetDist = Math.sqrt((x - targetPos.x) ** 2 + (y - targetPos.y) ** 2);
    if (targetDist < TARGET_RADIUS) {
      completeTrial(true);
    }
    
    setLastMousePos({ x, y });
    lastTimeRef.current = currentTime;
  };

  const startTrialMovement = () => {
    setTrialState(TrialState.IN_PROGRESS);
    const startTime = Date.now();
    setTrialStartTime(startTime);
    setFailedDueToTimeout(false);
    
    if (timeLimit) {
      setTimeRemaining(timeLimit);
    }
    
    // Set cursor to start position
    const startPos = { x: startButtonPos.x, y: startButtonPos.y };
    setCursorPos(startPos);
    setCursorVel({ x: 0, y: 0 });
    
    // Record initial data point
    setTrajectoryPoints([startPos]);
    setSpeedHistory([0]);
    setTimestampHistory([startTime]);
    setExcursionEvents([]);
    
    setLastMousePos(startPos);
    lastTimeRef.current = startTime;
  };

  // Timer countdown (separate from trial updates)
  useEffect(() => {
    if (trialState !== TrialState.IN_PROGRESS || !timeLimit) return;
    
    const timerInterval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = (currentTime - trialStartTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setFailedDueToTimeout(true);
        completeTrial(false);
      }
    }, 50); // Update timer more frequently for smooth display
    
    return () => clearInterval(timerInterval);
  }, [trialState, timeLimit, trialStartTime]);

  // Modified excursion checking function
  const checkTunnelExcursions = (x, y) => {
    if (!tunnelPath.length) return { isExcursion: false };
    
    // Find closest point on tunnel path
    let closestDistance = Infinity;
    let closestPoint = null;
    let closestIndex = -1;
    
    tunnelPath.forEach((point, index) => {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
        closestIndex = index;
      }
    });
    
    // Determine tunnel width based on tunnel type and position
    let halfWidth;
    if (tunnelType === 'sequential') {
      // Calculate which segment the point is in (2 segments)
      const segmentLength = tunnelPath.length / 2;
      const segmentIndex = Math.floor(closestIndex / segmentLength);
      const currentSegmentWidth = segmentWidths[Math.min(segmentIndex, segmentWidths.length - 1)];
      halfWidth = currentSegmentWidth / 2;
    } else {
      halfWidth = tunnelWidth / 2;
    }
    
    if (closestDistance > halfWidth) {
      // Calculate the point on the boundary where excursion occurred
      const directionX = (x - closestPoint.x) / closestDistance;
      const directionY = (y - closestPoint.y) / closestDistance;
      const boundaryPoint = {
        x: closestPoint.x + directionX * halfWidth,
        y: closestPoint.y + directionY * halfWidth
      };
      
      // Record excursion for data purposes (even in boundary-enforced phases)
      const excursion = {
        timeIndex: trajectoryPoints.length - 1,
        position: { x, y },
        distanceOutside: closestDistance - halfWidth,
        timestamp: Date.now(),
        boundaryPoint: boundaryPoint
      };
      setExcursionEvents(prev => [...prev, excursion]);
      
      return { 
        isExcursion: true, 
        boundaryPoint: boundaryPoint,
        excursion: excursion
      };
    }
    
    return { isExcursion: false };
  };


  const completeTrial = (success) => {
    const endTime = Date.now();
    const completionTime = (endTime - trialStartTime) / 1000;
    
    if (isPractice || phase === ExperimentPhase.TIME_TRIAL_PRACTICE) {
      if (success) {
        const phaseName = phase === ExperimentPhase.PRACTICE ? "Practice" : "Individual practice";
        console.log(`${phaseName} completed! Time: ${completionTime.toFixed(2)}s`);
      }
      setTrialState(success ? TrialState.WAITING_FOR_START : TrialState.FAILED);
      return;
    }
    
    if (!success) {
      setTrialState(TrialState.FAILED);
      return;
    }
    
    // Save data for successful main trials
    const currentCondition = currentConditions[currentTrial];
    const trialResult = {
      participantId,
      trialId: currentCondition.id,
      condition: currentCondition,
      trajectory: [...trajectoryPoints],
      speeds: [...speedHistory],
      timestamps: [...timestampHistory],
      completionTime,
      startTime: trialStartTime,
      failedDueToTimeout
    };
    
    setTrialData(prev => [...prev, trialResult]);
    advanceTrial();
  };

  const advanceTrial = () => {
    const nextTrial = currentTrial + 1;
    setCurrentTrial(nextTrial);
    
    if (nextTrial >= currentConditions.length) {
      if (phase === ExperimentPhase.MAIN_TRIALS) {
        setPhase(ExperimentPhase.SEQUENTIAL_TRIALS);
        setCurrentTrial(0);
        setCurrentConditions([...SEQUENTIAL_CONDITIONS]);
        setupTrial(SEQUENTIAL_CONDITIONS[0]);
      } else if (phase === ExperimentPhase.SEQUENTIAL_TRIALS) {
        setPhase(ExperimentPhase.TIME_CONSTRAINT_INTRO);
      } else if (phase === ExperimentPhase.TIME_TRIALS) {
        setPhase(ExperimentPhase.SEQUENTIAL_TIME_TRIALS);
        setCurrentTrial(0);
        setCurrentConditions([...SEQUENTIAL_TIME_CONDITIONS]);
        
        // Check if first sequential time condition needs practice
        const firstCondition = SEQUENTIAL_TIME_CONDITIONS[0];
        let conditionKey;
        
        if (firstCondition.tunnelType === 'sequential') {
          // For sequential trials, use tunnel type and segment parameters
          if (firstCondition.segmentType === 'width') {
            conditionKey = `sequential-width-${firstCondition.segment1Width}-${firstCondition.segment2Width}-${firstCondition.timeLimit}`;
          } else {
            conditionKey = `sequential-curvature-${firstCondition.segment1Width}-${firstCondition.segment2Width}-${firstCondition.segment1Curvature}-${firstCondition.segment2Curvature}-${firstCondition.timeLimit}`;
          }
        } else {
          // For regular curved trials
          conditionKey = `${firstCondition.tunnelWidth}-${firstCondition.curvature}-${firstCondition.timeLimit}`;
        }
        
        if (!practicedConditions.has(conditionKey)) {
          setPhase(ExperimentPhase.TIME_TRIAL_PRACTICE);
          setCurrentPracticeCondition(firstCondition);
          setIsPractice(true);
          setupTrial(firstCondition);
        } else {
          setIsPractice(false);
          setupTrial(firstCondition);
        }
      } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS) {
        setPhase(ExperimentPhase.COMPLETE);
      }
      return;
    }
    
    // Continue directly to next trial without breaks
    if (phase === ExperimentPhase.TIME_TRIALS) {
      // For time trials, check if the next condition needs practice
      const nextCondition = currentConditions[nextTrial];
      const conditionKey = `${nextCondition.tunnelWidth}-${nextCondition.curvature}-${nextCondition.timeLimit}`;
      
      if (!practicedConditions.has(conditionKey)) {
        setPhase(ExperimentPhase.TIME_TRIAL_PRACTICE);
        setCurrentPracticeCondition(nextCondition);
        setIsPractice(true);
        setupTrial(nextCondition);
      } else {
        setPhase(ExperimentPhase.TIME_TRIALS);
        setIsPractice(false);
        setupTrial(nextCondition);
      }
    } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS) {
      // For sequential time trials, check if the next condition needs practice
      const nextCondition = currentConditions[nextTrial];
      let conditionKey;
      
      if (nextCondition.tunnelType === 'sequential') {
        // For sequential trials, use tunnel type and segment parameters
        if (nextCondition.segmentType === 'width') {
          conditionKey = `sequential-width-${nextCondition.segment1Width}-${nextCondition.segment2Width}-${nextCondition.timeLimit}`;
        } else {
          conditionKey = `sequential-curvature-${nextCondition.segment1Width}-${nextCondition.segment2Width}-${nextCondition.segment1Curvature}-${nextCondition.segment2Curvature}-${nextCondition.timeLimit}`;
        }
      } else {
        // For regular curved trials
        conditionKey = `${nextCondition.tunnelWidth}-${nextCondition.curvature}-${nextCondition.timeLimit}`;
      }
      
      if (!practicedConditions.has(conditionKey)) {
        setPhase(ExperimentPhase.TIME_TRIAL_PRACTICE);
        setCurrentPracticeCondition(nextCondition);
        setIsPractice(true);
        setupTrial(nextCondition);
      } else {
        setPhase(ExperimentPhase.SEQUENTIAL_TIME_TRIALS);
        setIsPractice(false);
        setupTrial(nextCondition);
      }
    } else {
      setupTrial(currentConditions[nextTrial]);
    }
  };

  // Drawing functions
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw tunnel
    if (tunnelPath.length > 0) {
      drawTunnel(ctx);
    }
    
         // Draw excursion markers (in phases where boundaries are marked)
     if (shouldMarkBoundaries()) {
       drawExcursionMarkers(ctx);
     }
    
    // Draw cursor
    drawCursor(ctx);
    
    // Draw start button
    if (trialState === TrialState.WAITING_FOR_START) {
      drawStartButton(ctx);
    }
    
    // Draw target
    drawTarget(ctx);
  };

  const drawTunnel = (ctx) => {
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    
    if (tunnelType === 'sequential') {
      // Draw sequential tunnel segments with different widths (2 segments)
      const segmentLength = tunnelPath.length / 2;
      
      for (let segment = 0; segment < 2; segment++) {
        const startIndex = Math.floor(segment * segmentLength);
        const endIndex = Math.floor((segment + 1) * segmentLength);
        const halfWidth = segmentWidths[segment] / 2;
        
        // Draw upper boundary
        ctx.beginPath();
        for (let i = startIndex; i < endIndex && i < tunnelPath.length; i++) {
          const point = tunnelPath[i];
          const x = point.x * SCALE;
          const upperY = (point.y - halfWidth) * SCALE;
          if (i === startIndex) ctx.moveTo(x, upperY);
          else ctx.lineTo(x, upperY);
        }
        ctx.stroke();
        
        // Draw lower boundary
        ctx.beginPath();
        for (let i = startIndex; i < endIndex && i < tunnelPath.length; i++) {
          const point = tunnelPath[i];
          const x = point.x * SCALE;
          const lowerY = (point.y + halfWidth) * SCALE;
          if (i === startIndex) ctx.moveTo(x, lowerY);
          else ctx.lineTo(x, lowerY);
        }
        ctx.stroke();
      }
      
      // Draw vertical connecting line between the 2 segments
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      
      const transitionIndex = Math.floor(segmentLength);
      if (transitionIndex < tunnelPath.length) {
        const transitionPoint = tunnelPath[transitionIndex];
        const x = transitionPoint.x * SCALE;
        const prevHalfWidth = segmentWidths[0] / 2;
        const currHalfWidth = segmentWidths[1] / 2;
        
        // Draw vertical line connecting upper boundaries
        ctx.beginPath();
        ctx.moveTo(x, (transitionPoint.y - prevHalfWidth) * SCALE);
        ctx.lineTo(x, (transitionPoint.y - currHalfWidth) * SCALE);
        ctx.stroke();
        
        // Draw vertical line connecting lower boundaries
        ctx.beginPath();
        ctx.moveTo(x, (transitionPoint.y + prevHalfWidth) * SCALE);
        ctx.lineTo(x, (transitionPoint.y + currHalfWidth) * SCALE);
        ctx.stroke();
      }
    } else {
      // Draw curved tunnel with uniform width
      const halfWidth = tunnelWidth / 2;
      
      ctx.beginPath();
      tunnelPath.forEach((point, i) => {
        const x = point.x * SCALE;
        const upperY = (point.y - halfWidth) * SCALE;
        if (i === 0) ctx.moveTo(x, upperY);
        else ctx.lineTo(x, upperY);
      });
      ctx.stroke();
      
      ctx.beginPath();
      tunnelPath.forEach((point, i) => {
        const x = point.x * SCALE;
        const lowerY = (point.y + halfWidth) * SCALE;
        if (i === 0) ctx.moveTo(x, lowerY);
        else ctx.lineTo(x, lowerY);
      });
      ctx.stroke();
    }
  };

  const drawExcursionMarkers = (ctx) => {
    excursionMarkers.forEach(marker => {
      ctx.fillStyle = '#FF6B6B';
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 2;
      
      // Draw a small X mark at the excursion boundary point
      const x = marker.x * SCALE;
      const y = marker.y * SCALE;
      const size = 4;
      
      ctx.beginPath();
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.moveTo(x - size, y + size);
      ctx.lineTo(x + size, y - size);
      ctx.stroke();
      
      // Draw a small circle around the X
      ctx.beginPath();
      ctx.arc(x, y, size + 2, 0, 2 * Math.PI);
      ctx.stroke();
    });
  };

  const drawCursor = (ctx) => {
    ctx.fillStyle = '#0000FF';
    ctx.beginPath();
    ctx.arc(cursorPos.x * SCALE, cursorPos.y * SCALE, 3, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawStartButton = (ctx) => {
    const x = startButtonPos.x * SCALE;
    const y = startButtonPos.y * SCALE;
    const radius = START_BUTTON_RADIUS * SCALE;
    
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#009900';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    // ctx.fillText('START', x, y + 4);
  };

  const drawTarget = (ctx) => {
    const x = targetPos.x * SCALE;
    const y = targetPos.y * SCALE;
    const radius = TARGET_RADIUS * SCALE;
    
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#990000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Animation loop
  useEffect(() => {
    const animate = () => {
      drawCanvas();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cursorPos, trialState, tunnelPath, startButtonPos, targetPos, tunnelWidth, excursionMarkers, shouldMarkBoundaries, hasExcursionMarker]);

  const downloadData = () => {
    const data = {
      participantId,
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

  const uploadData = async () => {
    if (!isFirebaseConfigured()) {
      setUploadError('Firebase not configured. Please check your configuration.');
      setUploadStatus('error');
      return;
    }

    setUploadStatus('uploading');
    setUploadError(null);

    try {
      const data = {
        participantId,
        trialData,
        summary: {
          totalTrials: trialData.length,
          averageCompletionTime: trialData.reduce((sum, t) => sum + t.completionTime, 0) / trialData.length,
        },
        experimentVersion: '2.0',
        completedAt: new Date().toISOString()
      };

      const docId = await uploadExperimentDataWithRetry(data);
      setUploadedDocId(docId);
      setUploadStatus('success');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message);
      setUploadStatus('error');
    }
  };

  const handleCompleteExperiment = async () => {
    // Try to upload data first
    await uploadData();
    
    // Also download data as backup
    downloadData();
  };

  // Helper function to check if we should show timer bar area
  const shouldShowTimerArea = () => {
    return phase === ExperimentPhase.TIME_TRIAL_PRACTICE && timeLimit;
  };

  
  const renderContent = () => {
    switch (phase) {
      case ExperimentPhase.ENVIRONMENT_SETUP:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center rounded-t-2xl">
                <div className="flex items-center justify-center mb-2">
                  <Settings className="w-8 h-8 mr-3" />
                  <h1 className="text-2xl font-bold">Environment Setup Instructions</h1>
                </div>
                <p className="text-blue-100">Thank you for joining our study!</p>
              </div>
              
              {/* Content */}
              <div className="p-8">
                {/* Important Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-semibold text-gray-800">Important</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Please configure your setup correctly to ensure consistent and usable data.
                  </p>
                </div>
                
                <div className="space-y-5">
                  {/* Device Requirements */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">1</div>
                      <Monitor className="w-6 h-6 text-blue-600 mr-2" />
                      <h2 className="text-lg font-semibold text-gray-800">Device Requirements</h2>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="text-green-600">✓</span> Use a <strong>desktop/laptop</strong> with a <strong>physical mouse</strong> on a flat surface
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="text-red-600">✗</span> Do not use trackpad, touchscreen, or drawing tablet
                      </p>
                    </div>
                  </div>
      
                  {/* Mouse Settings */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">2</div>
                      <Mouse className="w-6 h-6 text-blue-600 mr-2" />
                      <h2 className="text-lg font-semibold text-gray-800">Mouse Settings</h2>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Set your mouse to <strong>default sensitivity</strong>:</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Windows</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                        <p>• Open Control Panel → Hardware and Sound → Devices and Printers → Mouse</p>
                        <p>• Go to the "Pointer Options" tab</p>
                        <p>• Uncheck "Enhance pointer precision"</p>
                        <p>• Set the pointer speed slider to the middle position</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Mac (macOS)</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>• System Preferences → Mouse</p>
                          <p>• Set Tracking Speed to middle (4th from left)</p>
                          <p>• Click on advanced → disable Pointer acceleration</p>
                        </div>
                      </div>
                    </div>
                  </div>
      
                  {/* Screen Setup */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">3</div>
                      <Eye className="w-6 h-6 text-blue-600 mr-2" />
                      <h2 className="text-lg font-semibold text-gray-800">Screen Setup</h2>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-gray-700">
                        <strong></strong> Make browser full screen: <kbd className="bg-gray-200 px-1 py-0.5 rounded text-xs">F11</kbd> (Windows) or <kbd className="bg-gray-200 px-1 py-0.5 rounded text-xs">⌘⌃F</kbd> (Mac)
                      </p>
                    </div>
                  </div>
      
                  {/* Positioning */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">4</div>
                      <Users className="w-6 h-6 text-blue-600 mr-2" />
                      <h2 className="text-lg font-semibold text-gray-800">Positioning</h2>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        Sit about one arm’s length away from the monitor and try to keep the same position during the experiment.
                      </p>
                      <p>
                      At the start of each trial, adjust your posture so you are comfortable.
                      </p>
                    </div>
                  </div>
      
                  {/* During Experiment */}
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">5</div>
                      <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                      <h2 className="text-lg font-semibold text-gray-800">During the Experiment</h2>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-700 space-y-1">
                        <p><span className="text-green-600">✓</span> Follow instructions carefully and try your best</p>
                        <p><span className="text-red-600">⚠</span> Do not change mouse settings once you start</p>
                      </div>
                    </div>
                  </div>
                </div>
      
                {/* Continue Button */}
                <div className="mt-12 text-center">
                  <div className="bg-white border-4 border-blue-600 px-12 py-8 rounded-2xl inline-block shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-center space-x-4">
                      <span className="text-3xl font-black text-gray-800">Ready to continue?</span>
                    </div>
                                          <div className="mt-4 text-lg font-semibold text-gray-600">
                        Press <kbd className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-lg font-bold">SPACEBAR</kbd> to proceed
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case ExperimentPhase.SCREEN_CALIBRATION:
        return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CreditCard className="w-8 h-8 mr-3" />
                    <h1 className="text-3xl font-bold">Screen Calibration</h1>
                  </div>
                  <p className="text-lg text-blue-100">Calibrate your screen using a credit card</p>
                </div>
                
                {/* Content */}
                <div className="p-6">
                  {/* Instructions */}
                  <div className="text-center mb-6">
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <p className="text-gray-700">
                        Hold your <strong>credit card</strong> against the window below and adjust browser zoom until they match
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 max-w-lg mx-auto">
                      <p>Use Ctrl/⌘ + "+" or "−" to adjust zoom</p>
                    </div>
                  </div>
                  
                  {/* Calibration Window */}
                  <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg p-6">
                      <div 
                        className="bg-blue-200 border-2 border-blue-400 rounded"
                        style={{
                          width: '340px',  // Same width as experiment canvas
                          height: '200px', // Same height as experiment canvas
                          position: 'relative'
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Continue Button */}
                  <div className="text-center">
                    <div className="bg-white border-4 border-blue-600 px-8 py-4 rounded-2xl inline-block shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                      <div className="text-lg font-semibold text-gray-600">
                        Press <kbd className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-lg font-bold">SPACEBAR</kbd> when done
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case ExperimentPhase.WELCOME:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <h1 className="text-3xl font-bold mb-6">Human Steering Experiment</h1>
              <p className="mb-6 text-gray-600">Press ENTER to continue</p>
            </div>
          </div>
        );

      case ExperimentPhase.INSTRUCTIONS:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
              <h2 className="text-2xl font-bold text-red-600 mb-6">Task Instructions (Please read carefully):</h2>
              <ul className="space-y-3 mb-6">
                <li>Click the green START button to begin each trial</li>
                <li>Navigate through the tunnel to reach the red target</li>
                <li>Do NOT stop once you begin the trial</li>
                <li>Move as smoothly and accurately as possible</li>
                {/* <li>You must successfully complete each trial to advance</li> */}
                <li>Press R to restart the current trial at anytime if needed</li>
                {/* <li><strong>Real Trials:</strong> You MUST stay within tunnel boundaries - violations will restart the trial</li> */}
                
              </ul>
              <p className="mb-4">You will start with a practice trial to get familiar with the controls and task.</p>
              <p className="font-semibold">Press 'SPACEBAR' to start practice</p>
            </div>
          </div>
        );



      case ExperimentPhase.TIME_CONSTRAINT_INTRO:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
            <h2 className="text-2xl font-bold text-red-600 mb-6">Time-Constrained Trials</h2>
            <p className="mb-4">
              In this part of the experiment, you must complete each task within a set time limit.
            </p>
            <ul className="space-y-3 mb-6">
              <li>Each trial has a different time limit.</li>
              <li>Before each new type of timed trial, you’ll complete one practice round with a visible timer.</li>
              <li>During practice, learn the timing; in the actual trial, the timer won’t be shown but the limit will still apply.</li>
              <li>You may cross the boundary, but aim to follow the tunnel as closely as possible.</li>
              <li>Balance speed and accuracy — the goal is to finish right as the time runs out.</li>
            </ul>
            <p className="font-semibold">Press SPACEBAR to begin time-constrained trials.</p>
            </div>
          </div>
        );



      case ExperimentPhase.COMPLETE:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
              <h2 className="text-2xl font-bold text-green-600 mb-6">Experiment Complete!</h2>
              <p className="mb-6">All trials completed successfully!</p>
              
              {/* Upload Status */}
              {uploadStatus === 'idle' && (
                <div className="mb-6">
                  <button
                    onClick={handleCompleteExperiment}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded mb-4 w-full"
                  >
                    Upload Data
                  </button>
                </div>
              )}
              
              {uploadStatus === 'uploading' && (
                <div className="mb-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-blue-600">Uploading data...</span>
                  </div>
                  <p className="text-sm text-gray-600">Please wait while we save your data</p>
                </div>
              )}
              
              {uploadStatus === 'success' && (
                <div className="mb-6">
                  <div className="text-green-600 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="font-semibold">Data uploaded successfully!</p>
                  </div>
                  {/* {uploadedDocId && (
                    <p className="text-xs text-gray-500 mb-4">Reference ID: {uploadedDocId}</p>
                  )} */}
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="mb-6">
                  <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="font-semibold">Upload failed</p>
                  </div>
                  <p className="text-sm text-red-600 mb-4">{uploadError}</p>
                  <div className="space-y-2">
                    <button
                      onClick={uploadData}
                      className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded w-full"
                    >
                      Retry Upload
                    </button>
                    <button
                      onClick={downloadData}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
                    >
                      Download Data Only
                    </button>
                  </div>
                </div>
              )}
              
              <p className="text-gray-600">Thank you for participating!</p>
            </div>
          </div>
        );

      default:
        // Trial phases
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Time bar container - always reserve space when in time-related phases */}
              <div className="mb-4 w-full max-w-md mx-auto">
                
                {phase === ExperimentPhase.TIME_TRIAL_PRACTICE && timeLimit && (
                  <div style={{width: '100%'}}>
                    {/* Timer bar background */}
                    <div style={{
                      width: '100%', 
                      height: '32px', 
                      backgroundColor: '#d1d5db', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      marginBottom: '8px', 
                      position: 'relative'
                    }}>
                      {/* Timer bar fill */}
                      <div
                        style={{ 
                          height: '100%',
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          transition: 'all 0.1s',
                          backgroundColor: trialState !== TrialState.IN_PROGRESS
                            ? '#10b981'  // green-500
                            : (timeRemaining / timeLimit) > 0.2
                            ? '#f59e0b'  // yellow-500
                            : '#ef4444', // red-500
                          width: `${
                            trialState !== TrialState.IN_PROGRESS
                              ? 100 
                              : Math.max(0, (timeRemaining / timeLimit) * 100)
                          }%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleMouseClick}
                onMouseMove={handleMouseMove}
                className="border border-gray-300 cursor-crosshair"
              />
              
              {/* Simple status and control information */}
              <div className="mt-4 text-center">
                {renderSimpleStatus()}
                {renderSimpleControls()}
              </div>
            </div>
            
            {/* Failure overlay */}
            {trialState === TrialState.FAILED && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 text-center">
                  <h3 className="text-xl font-bold mb-4 text-red-600">
                    {failedDueToTimeout ? "TIME'S UP!" : "TRIAL FAILED"}
                  </h3>
                  <p className="mb-4">
                    {failedDueToTimeout 
                      ? "You ran out of time. Try to move faster."
                      : shouldEnforceBoundaries()
                      ? "You went outside the tunnel boundary, please retry the trial."
                      : "Complete the task to advance."
                    }
                  </p>
                  <p className="text-sm text-gray-600">Press R to restart trial</p>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  // Helper functions to calculate correct trial numbers across combined phases
  const getNormalTrialNumber = () => {
    if (phase === ExperimentPhase.MAIN_TRIALS) {
      return currentTrial + 1;
    } else if (phase === ExperimentPhase.SEQUENTIAL_TRIALS) {
      return BASIC_CONDITIONS.length + currentTrial + 1;
    }
    return 0;
  };

  const getNormalTotalTrials = () => {
    return BASIC_CONDITIONS.length + SEQUENTIAL_CONDITIONS.length;
  };

  const getTimedTrialNumber = () => {
    if (phase === ExperimentPhase.TIME_TRIALS) {
      return currentTrial + 1;
    } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS) {
      return TIME_CONDITIONS.length + currentTrial + 1;
    }
    return 0;
  };

  const getTimedTotalTrials = () => {
    return TIME_CONDITIONS.length + SEQUENTIAL_TIME_CONDITIONS.length;
  };

  const renderSimpleStatus = () => {
    let statusText = "";
    let statusColor = "text-gray-600";
    
    // Show phase and trial info
    if (phase === ExperimentPhase.PRACTICE) {
      statusText = "PRACTICE ROUND";
      statusColor = "text-green-600";
    } else if (phase === ExperimentPhase.MAIN_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Trial ${getNormalTrialNumber()}/${getNormalTotalTrials()}`;
      statusColor = "text-blue-600";
    } else if (phase === ExperimentPhase.SEQUENTIAL_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Trial ${getNormalTrialNumber()}/${getNormalTotalTrials()}`;
      statusColor = "text-indigo-600";
    } else if (phase === ExperimentPhase.TIME_TRIAL_PRACTICE && currentPracticeCondition) {
      statusText = `PRACTICE ROUND`;
      statusColor = "text-purple-600";
    } else if (phase === ExperimentPhase.TIME_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Timed Trial ${getTimedTrialNumber()}/${getTimedTotalTrials()}`;
      statusColor = "text-red-600";
    } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Timed Trial ${getTimedTrialNumber()}/${getTimedTotalTrials()}`;
      statusColor = "text-pink-600";
    }
    
    // Add current state
    let stateText = "";
    if (trialState === TrialState.WAITING_FOR_START) {
      stateText = "Click the green button to begin";
    } else if (trialState === TrialState.IN_PROGRESS) {
      stateText = "Navigate to the red target";
    }
    
    return (
      <div className="space-y-1">
        {statusText && <p className={`font-semibold ${statusColor}`}>{statusText}</p>}
        {stateText && <p className="text-gray-700">{stateText}</p>}
      </div>
    );
  };

  const renderSimpleControls = () => {
    const controls = [];
    
    controls.push("Press 'R' to restart trial");
    
    if (phase === ExperimentPhase.PRACTICE || phase === ExperimentPhase.TIME_TRIAL_PRACTICE) {
      controls.push("Press 'N' to continue to real trial");
    }
    
    return (
      <div className="mt-2 text-sm text-gray-600">
        {controls.map((control, index) => (
          <p key={index}>{control}</p>
        ))}
      </div>
    );
  };

  return renderContent();
};

export default HumanSteeringExperiment;