import React, { useState, useEffect, useRef, useCallback } from 'react';

// Experiment phases
const ExperimentPhase = {
  WELCOME: 'welcome',
  INSTRUCTIONS: 'instructions',
  PRACTICE: 'practice',
  MAIN_TRIALS: 'main_trials',
  TIME_CONSTRAINT_INTRO: 'time_constraint_intro',
  TIME_TRIAL_PRACTICE: 'time_trial_practice',
  TIME_TRIALS: 'time_trials',
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
  { id: 1, tunnelWidth: 0.015, curvature: 0.01, timeLimit: null, description: "narrow tunnel, gentle curve" },
  { id: 2, tunnelWidth: 0.015, curvature: 0.03, timeLimit: null, description: "narrow tunnel, moderate curve" },
  { id: 3, tunnelWidth: 0.015, curvature: 0.05, timeLimit: null, description: "narrow tunnel, sharp curve" },
  { id: 4, tunnelWidth: 0.025, curvature: 0.01, timeLimit: null, description: "medium tunnel, gentle curve" },
  { id: 5, tunnelWidth: 0.025, curvature: 0.03, timeLimit: null, description: "medium tunnel, moderate curve" },
  { id: 6, tunnelWidth: 0.025, curvature: 0.05, timeLimit: null, description: "medium tunnel, sharp curve" },
  { id: 7, tunnelWidth: 0.03, curvature: 0.01, timeLimit: null, description: "wide tunnel, gentle curve" },
  { id: 8, tunnelWidth: 0.03, curvature: 0.03, timeLimit: null, description: "wide tunnel, moderate curve" },
  { id: 9, tunnelWidth: 0.03, curvature: 0.05, timeLimit: null, description: "wide tunnel, sharp curve" },
];

const TIME_CONDITIONS = [
  { id: 10, tunnelWidth: 0.025, curvature: 0.01, timeLimit: 6.0, description: "narrow tunnel, gentle curve, 6s limit" },
  { id: 11, tunnelWidth: 0.025, curvature: 0.01, timeLimit: 4.0, description: "narrow tunnel, gentle curve, 4s limit" },
  { id: 12, tunnelWidth: 0.025, curvature: 0.01, timeLimit: 2.0, description: "narrow tunnel, gentle curve, 2s limit" },
  { id: 13, tunnelWidth: 0.025, curvature: 0.03, timeLimit: 6.0, description: "narrow tunnel, moderate curve, 6s limit" },
  { id: 14, tunnelWidth: 0.025, curvature: 0.03, timeLimit: 4.0, description: "narrow tunnel, moderate curve, 4s limit" },
  { id: 15, tunnelWidth: 0.025, curvature: 0.03, timeLimit: 2.0, description: "narrow tunnel, moderate curve, 2s limit" },
  { id: 16, tunnelWidth: 0.025, curvature: 0.05, timeLimit: 8.0, description: "narrow tunnel, sharp curve, 8s limit" },
  { id: 17, tunnelWidth: 0.025, curvature: 0.05, timeLimit: 6.0, description: "narrow tunnel, sharp curve, 6s limit" },
  { id: 18, tunnelWidth: 0.025, curvature: 0.05, timeLimit: 4.0, description: "narrow tunnel, sharp curve, 4s limit" },
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
  const [excursionEvents, setExcursionEvents] = useState([]);

  // Environment state
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVel, setCursorVel] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState(null);
  const [tunnelPath, setTunnelPath] = useState([]);
  const [tunnelWidth, setTunnelWidth] = useState(0.015);
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

  // Setup trial with given condition
  const setupTrial = useCallback((condition) => {
    const path = generateTunnelPath(condition.curvature);
    setTunnelPath(path);
    setTunnelWidth(condition.tunnelWidth);
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
    setTrialStartTime(0);
    setLastMousePos(null);
    setTimeRemaining(condition.timeLimit || 0);
    setFailedDueToTimeout(false);
  }, [generateTunnelPath]);



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
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase, currentTrial, currentConditions, currentPracticeCondition, participantId, setupTrial]);

  // Handle mouse events
  const handleMouseClick = (event) => {
    if (![ExperimentPhase.PRACTICE, ExperimentPhase.MAIN_TRIALS, 
          ExperimentPhase.TIME_TRIAL_PRACTICE, 
          ExperimentPhase.TIME_TRIALS].includes(phase)) {
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
          ExperimentPhase.TIME_TRIAL_PRACTICE, 
          ExperimentPhase.TIME_TRIALS].includes(phase)) {
      return;
    }
    
    if (trialState !== TrialState.IN_PROGRESS) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / SCALE;
    const y = (event.clientY - rect.top) / SCALE;
    
    const currentTime = Date.now();
    
    if (lastMousePos) {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      if (dt > 0) {
        const dx = x - lastMousePos.x;
        const dy = y - lastMousePos.y;
        setCursorVel({ x: dx / dt, y: dy / dt });
      }
    }
    
    setLastMousePos({ x, y });
    setCursorPos({ x, y });
    lastTimeRef.current = currentTime;
  };

  const startTrialMovement = () => {
    setTrialState(TrialState.IN_PROGRESS);
    setTrialStartTime(Date.now());
    setFailedDueToTimeout(false);
    
    if (timeLimit) {
      setTimeRemaining(timeLimit);
    }
    
    setCursorPos(startButtonPos);
    setCursorVel({ x: 0, y: 0 });
    
    setTrajectoryPoints([startButtonPos]);
    setSpeedHistory([0]);
    setTimestampHistory([Date.now()]);
    setExcursionEvents([]);
  };

  // Update trial state and timer
  useEffect(() => {
    if (trialState !== TrialState.IN_PROGRESS) return;
    
    const updateTrial = () => {
      const currentTime = Date.now();
      
      // Record data
      const speed = Math.sqrt(cursorVel.x ** 2 + cursorVel.y ** 2);
      setTrajectoryPoints(prev => [...prev, { ...cursorPos }]);
      setSpeedHistory(prev => [...prev, speed]);
      setTimestampHistory(prev => [...prev, currentTime]);
      
      // Check for excursions
      checkTunnelExcursions();
      
      // Check for trial completion
      const targetDist = Math.sqrt((cursorPos.x - targetPos.x) ** 2 + (cursorPos.y - targetPos.y) ** 2);
      if (targetDist < TARGET_RADIUS) {
        completeTrial(true);
      }
    };
    
    const interval = setInterval(updateTrial, 16); // ~60 FPS
    return () => clearInterval(interval);
  }, [trialState, cursorPos, cursorVel, targetPos]);

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

  const checkTunnelExcursions = () => {
    if (!tunnelPath.length) return;
    
    const distances = tunnelPath.map(point => 
      Math.sqrt((cursorPos.x - point.x) ** 2 + (cursorPos.y - point.y) ** 2)
    );
    const closestDistance = Math.min(...distances);
    const halfWidth = tunnelWidth / 2;
    
    if (closestDistance > halfWidth) {
      const excursion = {
        timeIndex: trajectoryPoints.length - 1,
        position: { ...cursorPos },
        distanceOutside: closestDistance - halfWidth,
        timestamp: Date.now()
      };
      setExcursionEvents(prev => [...prev, excursion]);
    }
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
        setPhase(ExperimentPhase.TIME_CONSTRAINT_INTRO);
      } else if (phase === ExperimentPhase.TIME_TRIALS) {
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
    const halfWidth = tunnelWidth / 2;
    
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    
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
    ctx.fillText('START', x, y + 4);
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
  }, [cursorPos, trialState, tunnelPath, startButtonPos, targetPos, tunnelWidth]);

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
                <li>• Click the green START button to begin each trial</li>
                <li>• Navigate through the tunnel to reach the red target</li>
                <li>• Try to stay within the tunnel boundaries</li>
                <li>• Move as smoothly and accurately as possible</li>
                <li>• You must successfully complete each trial to advance</li>
                <li>• Press R to restart the current trial if needed</li>
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
                <li>• You must complete each trial within a time limit</li>
                <li>• The time limit varies based on tunnel difficulty</li>
                <li>• Balance speed and accuracy - stay in the tunnel while meeting the time requirements</li>
                <li>• Before each new type of time trial, you'll get one practice round with a visible timer</li>
                <li>• In the actual trials, no timer will be shown, but the time limit will still be enforced</li>
              </ul>
              <p className="font-semibold">Press SPACEBAR to begin time-constrained trials</p>
            </div>
          </div>
        );



      case ExperimentPhase.COMPLETE:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-6">Experiment Complete!</h2>
              <p className="mb-6">All trials completed successfully!</p>
              <button
                onClick={downloadData}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
              >
                Download Data
              </button>
              <p>Thank you for participating!</p>
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
                  <div className="w-full">
                    {/* Timer bar background */}
                    <div className="w-full h-8 bg-gray-300 rounded-lg overflow-hidden mb-2 relative">
                      {/* Timer bar fill */}
                      <div
                        className="h-full transition-all duration-100 absolute top-0 left-0"
                        style={{ 
                          backgroundColor: trialState !== TrialState.IN_PROGRESS 
                            ? '#3b82f6'  // blue-500
                            : timeRemaining / timeLimit > 0.5
                            ? '#10b981'  // green-500
                            : timeRemaining / timeLimit > 0.2
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
                    {/* Timer text */}
                    <div className="text-center text-lg font-bold" style={{ color: '#374151' }}>
                      {trialState === TrialState.IN_PROGRESS 
                        ? `${timeRemaining.toFixed(1)}s / ${timeLimit.toFixed(1)}s`
                        : `Time limit: ${timeLimit.toFixed(1)}s (Click START to begin)`
                      }
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

  const renderSimpleStatus = () => {
    let statusText = "";
    let statusColor = "text-gray-600";
    
    // Show phase and trial info
    if (phase === ExperimentPhase.PRACTICE) {
      statusText = "PRACTICE MODE";
      statusColor = "text-green-600";
    } else if (phase === ExperimentPhase.MAIN_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Trial ${currentTrial + 1}/${currentConditions.length}: ${currentConditions[currentTrial].description}`;
      statusColor = "text-blue-600";
    } else if (phase === ExperimentPhase.TIME_TRIAL_PRACTICE && currentPracticeCondition) {
      statusText = `PRACTICE FOR: ${currentPracticeCondition.description}`;
      statusColor = "text-purple-600";
    } else if (phase === ExperimentPhase.TIME_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Time Trial ${currentTrial + 1}/${currentConditions.length}: ${currentConditions[currentTrial].description}`;
      statusColor = "text-red-600";
    }
    
    // Add current state
    let stateText = "";
    if (trialState === TrialState.WAITING_FOR_START) {
      stateText = "Click the green START button to begin";
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
    
    controls.push("Press R to restart trial");
    
    if (phase === ExperimentPhase.PRACTICE || phase === ExperimentPhase.TIME_TRIAL_PRACTICE) {
      controls.push("Press N to continue to next phase");
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