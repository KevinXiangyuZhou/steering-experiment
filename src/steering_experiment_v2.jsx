import React, { useState, useEffect, useRef, useCallback } from 'react';
import { uploadExperimentDataWithRetry, isFirebaseConfigured } from './firebaseService.js';

// Experiment phases
const ExperimentPhase = {
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
  // { id: 1, tunnelWidth: 0.015, curvature: 0.01, timeLimit: null, description: "narrow tunnel, gentle curve" },
  // { id: 2, tunnelWidth: 0.015, curvature: 0.03, timeLimit: null, description: "narrow tunnel, moderate curve" },
  // { id: 3, tunnelWidth: 0.015, curvature: 0.05, timeLimit: null, description: "narrow tunnel, sharp curve" },
  // { id: 4, tunnelWidth: 0.025, curvature: 0.01, timeLimit: null, description: "medium tunnel, gentle curve" },
  // { id: 5, tunnelWidth: 0.025, curvature: 0.03, timeLimit: null, description: "medium tunnel, moderate curve" },
  // { id: 6, tunnelWidth: 0.025, curvature: 0.05, timeLimit: null, description: "medium tunnel, sharp curve" },
  // { id: 7, tunnelWidth: 0.03, curvature: 0.01, timeLimit: null, description: "wide tunnel, gentle curve" },
  // { id: 8, tunnelWidth: 0.03, curvature: 0.03, timeLimit: null, description: "wide tunnel, moderate curve" },
  { id: 9, tunnelWidth: 0.03, curvature: 0.05, timeLimit: null, description: "wide tunnel, sharp curve" },
];

const TIME_CONDITIONS = [
  // { id: 10, tunnelWidth: 0.025, curvature: 0.01, timeLimit: 6.0, description: "narrow tunnel, gentle curve, 6s limit" },
  // { id: 11, tunnelWidth: 0.025, curvature: 0.01, timeLimit: 4.0, description: "narrow tunnel, gentle curve, 4s limit" },
  // { id: 12, tunnelWidth: 0.025, curvature: 0.01, timeLimit: 2.0, description: "narrow tunnel, gentle curve, 2s limit" },
  // { id: 13, tunnelWidth: 0.025, curvature: 0.03, timeLimit: 6.0, description: "narrow tunnel, moderate curve, 6s limit" },
  // { id: 14, tunnelWidth: 0.025, curvature: 0.03, timeLimit: 4.0, description: "narrow tunnel, moderate curve, 4s limit" },
  // { id: 15, tunnelWidth: 0.025, curvature: 0.03, timeLimit: 2.0, description: "narrow tunnel, moderate curve, 2s limit" },
  // { id: 16, tunnelWidth: 0.025, curvature: 0.05, timeLimit: 8.0, description: "narrow tunnel, sharp curve, 8s limit" },
  // { id: 17, tunnelWidth: 0.025, curvature: 0.05, timeLimit: 6.0, description: "narrow tunnel, sharp curve, 6s limit" },
  { id: 18, tunnelWidth: 0.025, curvature: 0.05, timeLimit: 4.0, description: "narrow tunnel, sharp curve, 4s limit" },
];

// Sequential tunnel conditions (narrow-wide-narrow segments)
const SEQUENTIAL_CONDITIONS = [
  // { id: 19, tunnelType: 'sequential', segment1Width: 0.015, segment2Width: 0.025, segment3Width: 0.015, timeLimit: null, description: "narrow-wide-narrow segments (15-25-15)" },
  // { id: 20, tunnelType: 'sequential', segment1Width: 0.015, segment2Width: 0.035, segment3Width: 0.015, timeLimit: null, description: "narrow-wide-narrow segments (15-35-15)" },
  // { id: 21, tunnelType: 'sequential', segment1Width: 0.020, segment2Width: 0.030, segment3Width: 0.020, timeLimit: null, description: "narrow-wide-narrow segments (20-30-20)" },
  { id: 22, tunnelType: 'sequential', segment1Width: 0.010, segment2Width: 0.040, segment3Width: 0.010, timeLimit: null, description: "narrow-wide-narrow segments (10-40-10)" },
];

// Sequential tunnel time-constrained conditions
const SEQUENTIAL_TIME_CONDITIONS = [
  // { id: 23, tunnelType: 'sequential', segment1Width: 0.015, segment2Width: 0.025, segment3Width: 0.015, timeLimit: 6.0, description: "narrow-wide-narrow segments (15-25-15), 6s limit" },
  // { id: 24, tunnelType: 'sequential', segment1Width: 0.015, segment2Width: 0.035, segment3Width: 0.015, timeLimit: 5.0, description: "narrow-wide-narrow segments (15-35-15), 5s limit" },
  // { id: 25, tunnelType: 'sequential', segment1Width: 0.020, segment2Width: 0.030, segment3Width: 0.020, timeLimit: 4.0, description: "narrow-wide-narrow segments (20-30-20), 4s limit" },
  { id: 26, tunnelType: 'sequential', segment1Width: 0.010, segment2Width: 0.040, segment3Width: 0.010, timeLimit: 7.0, description: "narrow-wide-narrow segments (10-40-10), 7s limit" },
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

  // Generate sequential horizontal tunnel segments (narrow-wide-narrow)
  const generateSequentialTunnelPath = useCallback((segment1Width, segment2Width, segment3Width) => {
    const tunnelStartX = 0.0;
    const tunnelEndX = 0.46;
    const tunnelYBase = 0.13;
    const segmentLength = (tunnelEndX - tunnelStartX) / 3;
    
    const path = [];
    for (let x = tunnelStartX; x < tunnelEndX; x += TUNNEL_STEP) {
      const y = tunnelYBase; // Horizontal line
      path.push({ x, y });
    }
    return path;
  }, []);

  // Setup trial with given condition
  const setupTrial = useCallback((condition) => {
    let path;
    if (condition.tunnelType === 'sequential') {
      path = generateSequentialTunnelPath(condition.segment1Width, condition.segment2Width, condition.segment3Width);
      setTunnelType('sequential');
      setSegmentWidths([condition.segment1Width, condition.segment2Width, condition.segment3Width]);
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
            const conditionKey = `${firstCondition.curvature}-${firstCondition.timeLimit}`;
            
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
            const conditionKey = `${currentPracticeCondition.curvature}-${currentPracticeCondition.timeLimit}`;
            setPracticedConditions(prev => new Set([...prev, conditionKey]));
            
            // Move to the actual trial for the CURRENT trial number (don't increment)
            setPhase(ExperimentPhase.TIME_TRIALS);
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
      // Calculate which segment the point is in
      const segmentLength = tunnelPath.length / 3;
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

  const calculateBoundaryViolationRate = () => {
    if (!trajectoryPoints.length || !tunnelPath.length) return 0;
    
    let violations = 0;
    const halfWidth = tunnelWidth / 2;
    
    trajectoryPoints.forEach(point => {
      const distances = tunnelPath.map(tunnelPoint =>
        Math.sqrt((point.x - tunnelPoint.x) ** 2 + (point.y - tunnelPoint.y) ** 2)
      );
      const closestDistance = Math.min(...distances);
      if (closestDistance > halfWidth) violations++;
    });
    
    return violations / trajectoryPoints.length;
  };

  const completeTrial = (success) => {
    const endTime = Date.now();
    const completionTime = (endTime - trialStartTime) / 1000;
    const boundaryViolationRate = calculateBoundaryViolationRate();
    
    if (isPractice || phase === ExperimentPhase.TIME_TRIAL_PRACTICE) {
      if (success) {
        const violationPct = boundaryViolationRate * 100;
        const phaseName = phase === ExperimentPhase.PRACTICE ? "Practice" : "Individual practice";
        console.log(`${phaseName} completed! Time: ${completionTime.toFixed(2)}s, Violations: ${violationPct.toFixed(1)}%`);
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
      excursions: [...excursionEvents],
      success,
      completionTime,
      startTime: trialStartTime,
      endTime,
      boundaryViolationRate,
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
        setupTrial(SEQUENTIAL_TIME_CONDITIONS[0]);
      } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS) {
        setPhase(ExperimentPhase.COMPLETE);
      }
      return;
    }
    
    // Continue directly to next trial without breaks
    if (phase === ExperimentPhase.TIME_TRIALS) {
      // For time trials, check if the next condition needs practice
      const nextCondition = currentConditions[nextTrial];
      const conditionKey = `${nextCondition.curvature}-${nextCondition.timeLimit}`;
      
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
      // Draw sequential tunnel segments with different widths
      const segmentLength = tunnelPath.length / 3;
      
      for (let segment = 0; segment < 3; segment++) {
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
      
      // Draw vertical connecting lines between segments
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      
      for (let segment = 1; segment < 3; segment++) {
        const transitionIndex = Math.floor(segment * segmentLength);
        if (transitionIndex < tunnelPath.length) {
          const transitionPoint = tunnelPath[transitionIndex];
          const x = transitionPoint.x * SCALE;
          const prevHalfWidth = segmentWidths[segment - 1] / 2;
          const currHalfWidth = segmentWidths[segment] / 2;
          
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
        averageBoundaryViolationRate: trialData.reduce((sum, t) => sum + t.boundaryViolationRate, 0) / trialData.length,
        timeoutFailures: trialData.filter(t => t.failedDueToTimeout).length
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
          averageBoundaryViolationRate: trialData.reduce((sum, t) => sum + t.boundaryViolationRate, 0) / trialData.length,
          timeoutFailures: trialData.filter(t => t.failedDueToTimeout).length
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
              <h2 className="text-2xl font-bold text-red-600 mb-6">Steering Task Instructions:</h2>
              <ul className="space-y-3 mb-6">
                <li>Click the green START button to begin each trial</li>
                <li>Navigate through the tunnel to reach the red target</li>
                <li><strong>Practice Round:</strong> Red X marks will show where you go outside boundaries, but you can continue</li>
                <li><strong>Real Trials:</strong> You MUST stay within tunnel boundaries - violations will restart the trial</li>
                <li>Move as smoothly and accurately as possible</li>
                <li>You must successfully complete each trial to advance</li>
                <li>Press R to restart the current trial if needed</li>
              </ul>
              <p className="mb-4">You will start with a practice trial to get familiar with the controls and task.</p>
              <p className="font-semibold">Press SPACEBAR to start practice</p>
            </div>
          </div>
        );



      case ExperimentPhase.TIME_CONSTRAINT_INTRO:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
              <h2 className="text-2xl font-bold text-red-600 mb-6">Time-Constrained Trials:</h2>
              <p className="mb-4">The next part of the experiment includes trials with time constraints.</p>
              <ul className="space-y-3 mb-6">
                <li>You must complete each trial within a time limit</li>
                <li>The time limit varies based on tunnel difficulty</li>
                <li><strong>Good news:</strong> In these time trials, boundary violations are ignored - focus on speed!</li>
                <li>Balance speed and accuracy - you can cross boundaries but try to stay reasonably close to the path</li>
                <li>Before each new type of time trial, you'll get one practice round with a visible timer</li>
                <li>In the actual trials, no timer will be shown, but the time limit will still be enforced</li>
              </ul>
              <p className="font-semibold">Press SPACEBAR to begin time-constrained trials</p>
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
                    Save Data & Download
                  </button>
                  <p className="text-sm text-gray-600">Data will be automatically saved to our database</p>
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
                    <p className="font-semibold">Data saved successfully!</p>
                  </div>
                  {uploadedDocId && (
                    <p className="text-xs text-gray-500 mb-4">Reference ID: {uploadedDocId}</p>
                  )}
                  <button
                    onClick={downloadData}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Download Backup Copy
                  </button>
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
      statusText = "PRACTICE ROUND - Boundaries marked (no interruption)";
      statusColor = "text-green-600";
    } else if (phase === ExperimentPhase.MAIN_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Trial ${getNormalTrialNumber()}/${getNormalTotalTrials()}`;
      statusColor = "text-blue-600";
    } else if (phase === ExperimentPhase.SEQUENTIAL_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Trial ${getNormalTrialNumber()}/${getNormalTotalTrials()}`;
      statusColor = "text-indigo-600";
    } else if (phase === ExperimentPhase.TIME_TRIAL_PRACTICE && currentPracticeCondition) {
      statusText = `PRACTICE ROUND - Boundaries ignored`;
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
      controls.push("Press 'N' to continue to real trial(s)");
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