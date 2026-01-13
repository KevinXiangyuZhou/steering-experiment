import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExperimentPhase, TrialState, BASIC_CONDITIONS, BASIC_TRIAL_REPETITIONS, LASSO_TRIAL_REPETITIONS, CASCADING_MENU_TRIAL_REPETITIONS, CASCADING_MENU_CONDITIONS } from './constants/experimentConstants.js';
import { getUrlParameters } from './utils/urlUtils.js';
import { generateTunnelPath, generateSequentialTunnelPath, generateCornerPath, generateLassoPath, generateCascadingMenuPath } from './utils/tunnelGenerator.js';
import { downloadData, uploadData } from './utils/dataManager.js';
import { advanceTrial } from './utils/trialAdvancement.js';
import { drawCanvas } from './components/canvas/DrawingFunctions.js';
import { useKeyboardHandler } from './hooks/useKeyboardHandler.js';
import { useMouseHandler } from './hooks/useMouseHandler.js';
import { useTrialTimer } from './hooks/useTrialTimer.js';
import { WelcomeScreen } from './components/ui/WelcomeScreen.jsx';
import { EnvironmentSetup } from './components/ui/EnvironmentSetup.jsx';
import { Instructions } from './components/ui/Instructions.jsx';
import { LassoInstructions } from './components/ui/LassoInstructions.jsx';
import { CascadingMenuInstructions } from './components/ui/CascadingMenuInstructions.jsx';
import { TimeConstraintIntro } from './components/ui/TimeConstraintIntro.jsx';
import { CompleteScreen } from './components/ui/CompleteScreen.jsx';
import { TrialCanvas } from './components/ui/TrialCanvas.jsx';
import { 
  getNormalTrialNumber, 
  getNormalTotalTrials, 
  getTimedTrialNumber, 
  getTimedTotalTrials 
} from './utils/trialManager.js';
import { calculateCanvasDimensions } from './utils/canvasSize.js';

const HumanSteeringExperiment = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Canvas dimensions (calculated based on physical size)
  const [canvasDimensions, setCanvasDimensions] = useState(() => {
    // Only calculate if window is available (client-side)
    if (typeof window !== 'undefined') {
      return calculateCanvasDimensions();
    }
    // Default fallback values
    return { width: 460, height: 260, scale: 1000 };
  });
  
  // Experiment state
  const [phase, setPhase] = useState(ExperimentPhase.WELCOME);
  const [trialState, setTrialState] = useState(TrialState.WAITING_FOR_START);
  const [participantId, setParticipantId] = useState('');
  const [prolificData, setProlificData] = useState({});
  const [currentTrial, setCurrentTrial] = useState(0);
  const [currentConditions, setCurrentConditions] = useState([]);
  const [isPractice, setIsPractice] = useState(false);
  const [currentPracticeCondition, setCurrentPracticeCondition] = useState(null);
  const [practicedConditions, setPracticedConditions] = useState(new Set());
  const [currentRepetition, setCurrentRepetition] = useState(1); // Track current repetition (1-indexed)

  // Trial data
  const [trialData, setTrialData] = useState([]);
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [timestampHistory, setTimestampHistory] = useState([]);
  
  // Upload state
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState(null);
  const [uploadedDocId, setUploadedDocId] = useState(null);
  const [excursionEvents, setExcursionEvents] = useState([]);
  const [excursionMarkers, setExcursionMarkers] = useState([]);
  const [hasExcursionMarker, setHasExcursionMarker] = useState(false);

  // Environment state
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const cursorPosRef = useRef({ x: 0, y: 0 }); // For immediate rendering without React state delay
  const lastSampledPosRef = useRef({ x: 0, y: 0 }); // For speed calculation in sampling
  const lastSampledTimeRef = useRef(0); // For speed calculation in sampling
  const [cursorVel, setCursorVel] = useState({ x: 0, y: 0 });
  const [tunnelPath, setTunnelPath] = useState([]);
  const [tunnelWidth, setTunnelWidth] = useState(0.015);
  const [tunnelType, setTunnelType] = useState('curved');
  const [segmentWidths, setSegmentWidths] = useState([0.015, 0.025, 0.015]);
  const [lassoConfig, setLassoConfig] = useState(null); // Store lasso grid configuration
  const [menuConfig, setMenuConfig] = useState(null); // Store cascading menu configuration
  const menuHasHoveredRef = useRef(false); // Track if we've hovered over target item (persistent submenu)
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [startButtonPos, setStartButtonPos] = useState({ x: 0, y: 0 });

  // Timer state
  const [trialStartTime, setTrialStartTime] = useState(0);
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [failedDueToTimeout, setFailedDueToTimeout] = useState(false);

  // Check if current phase should enforce boundary constraints
  // Note: Lasso and cascading menu trials don't enforce boundaries - users move freely
  const shouldEnforceBoundaries = useCallback(() => {
    return (phase === ExperimentPhase.PRACTICE || phase === ExperimentPhase.MAIN_TRIALS || phase === ExperimentPhase.SEQUENTIAL_TRIALS) && tunnelType !== 'lasso' && tunnelType !== 'cascading_menu';
  }, [phase, tunnelType]);

  // Check if current phase should mark boundary violations
  // Note: Lasso and cascading menu trials don't mark boundaries - users move freely
  const shouldMarkBoundaries = useCallback(() => {
    return (phase === ExperimentPhase.PRACTICE || phase === ExperimentPhase.MAIN_TRIALS || phase === ExperimentPhase.SEQUENTIAL_TRIALS) && tunnelType !== 'lasso' && tunnelType !== 'cascading_menu';
  }, [phase, tunnelType]);

  // Calculate canvas dimensions on mount and window resize
  useEffect(() => {
    const updateCanvasDimensions = () => {
      setCanvasDimensions(calculateCanvasDimensions());
    };
    
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    return () => window.removeEventListener('resize', updateCanvasDimensions);
  }, []);

  // Extract URL parameters on component mount
  useEffect(() => {
    const urlParams = getUrlParameters();
    setProlificData(urlParams);
    
    if (urlParams.prolificPid) {
      setParticipantId(`P${urlParams.prolificPid}`);
    } else {
      setParticipantId(`P${new Date().toTimeString().slice(0,8).replace(/:/g,'')}`);
    }
  }, []);

  // Setup trial with given condition
  // resetRepetition: if true, reset repetition counter to 1 (for new trial conditions)
  //                  if false, keep current repetition (for restarting current trial)
  const setupTrial = useCallback((condition, resetRepetition = true) => {
    let path;
    if (condition.tunnelType === 'sequential') {
      path = generateSequentialTunnelPath(condition);
      setTunnelType('sequential');
      setSegmentWidths([condition.segment1Width, condition.segment2Width]);
      setTunnelWidth(condition.segment1Width);
      setLassoConfig(null); // Clear lasso config
    } else if (condition.tunnelType === 'corner') {
      const [generatedPath, width] = generateCornerPath(
        condition.tunnelWidth,
        0.0,
        0.46,
        0.13,
        condition.numCorners || 3,
        condition.cornerOffset || 0.05,
        0.002
      );
      path = generatedPath;
      setTunnelType('corner');
      setTunnelWidth(width);
      setLassoConfig(null); // Clear lasso config
    } else if (condition.tunnelType === 'lasso') {
      const [generatedPath, width, lassoStartPos, lassoEndPos] = generateLassoPath(condition, 0.002);
      path = generatedPath;
      setTunnelType('lasso');
      setTunnelWidth(width);
      // Store lasso-specific data for rendering
      setLassoConfig({
        grid_layout: condition.grid_layout,
        icon_radius: condition.icon_radius || 0.01,
        icon_spacing: condition.icon_spacing || 0.05,
        grid_origin: condition.grid_origin || [0.1, 0.1]
      });
      setMenuConfig(null); // Clear menu config
      // For lasso trials, use computed start/end positions from grid
      setStartButtonPos(lassoStartPos);
      setTargetPos(lassoEndPos);
      setCursorPos(lassoStartPos);
      cursorPosRef.current = lassoStartPos;
    } else if (condition.tunnelType === 'cascading_menu') {
      const [generatedPath, width, menuStartPos, menuEndPos] = generateCascadingMenuPath(condition, 0.002);
      path = generatedPath;
      setTunnelType('cascading_menu');
      setTunnelWidth(width);
      // Store menu-specific data for rendering
      setMenuConfig({
        mainMenuSize: condition.mainMenuSize,
        subMenuSize: condition.subMenuSize,
        targetMainMenuIndex: condition.targetMainMenuIndex,
        targetSubMenuIndex: condition.targetSubMenuIndex,
        mainMenuWindowSize: condition.mainMenuWindowSize || [0.08, 0.15],
        subMenuWindowSize: condition.subMenuWindowSize || [0.08, 0.12],
        mainMenuOrigin: condition.mainMenuOrigin || [0.1, 0.1]
      });
      setLassoConfig(null); // Clear lasso config
      // Reset hover state for new trial
      menuHasHoveredRef.current = false;
      // For cascading menu trials, use computed start/end positions
      setStartButtonPos(menuStartPos);
      setTargetPos(menuEndPos);
      setCursorPos(menuStartPos);
      cursorPosRef.current = menuStartPos;
    } else {
      const [generatedPath, width] = generateTunnelPath(
        condition.tunnelWidth,
        condition.curvature
      );
      path = generatedPath;
      setTunnelType('curved');
      setTunnelWidth(width);
      // Clear lasso and menu config when switching to non-special trials
      setLassoConfig(null);
      setMenuConfig(null);
    }
    setTunnelPath(path);
    setTimeLimit(condition.timeLimit);
    
    // For non-lasso trials, use path endpoints as start/end positions
    // (Lasso trials already set start/end positions above)
    if (condition.tunnelType !== 'lasso') {
      const startPos = path[0];
      const endPos = path[path.length - 1];
      
      setStartButtonPos(startPos);
      setTargetPos(endPos);
      setCursorPos(startPos);
      cursorPosRef.current = startPos; // Update ref immediately
    }
    
    setCursorVel({ x: 0, y: 0 });
    
    setTrialState(TrialState.WAITING_FOR_START);
    setTrajectoryPoints([]);
    setSpeedHistory([]);
    setTimestampHistory([]);
    setExcursionEvents([]);
    setExcursionMarkers([]);
    setHasExcursionMarker(false);
    setTrialStartTime(0);
    setTimeRemaining(condition.timeLimit || 0);
    setFailedDueToTimeout(false);
    // Reset repetition counter only when starting a new trial condition
    if (resetRepetition) {
      setCurrentRepetition(1);
    }
  }, []);

  const startTrialMovement = () => {
    setTrialState(TrialState.IN_PROGRESS);
    const startTime = Date.now();
    setTrialStartTime(startTime);
    setFailedDueToTimeout(false);
    
    if (timeLimit) {
      setTimeRemaining(timeLimit);
    }
    
    const startPos = { x: startButtonPos.x, y: startButtonPos.y };
    setCursorPos(startPos);
    cursorPosRef.current = startPos; // Update ref immediately
    setCursorVel({ x: 0, y: 0 });
    
    // Initialize trajectory with start position
    setTrajectoryPoints([startPos]);
    setSpeedHistory([0]);
    setTimestampHistory([startTime]);
    setExcursionEvents([]);
    
    // Initialize sampling refs
    lastSampledPosRef.current = startPos;
    lastSampledTimeRef.current = startTime;
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
    
    // Save data for successful main trials with round number
    const currentCondition = currentConditions[currentTrial];
    const { id, ...condition } = currentCondition;
    const trialResult = {
      participantId,
      completionTime,
      condition,
      trial_id: currentCondition.id,
      round: currentRepetition, // Record which repetition this is (1-indexed)
      timestamps: [...timestampHistory],
      trajectory: [...trajectoryPoints],
      speeds: [...speedHistory]
    };
    
    setTrialData(prev => [...prev, trialResult]);
    
    // Check if we need to repeat this trial
    // Determine repetition count based on trial type
    const repetitions = currentCondition.tunnelType === 'lasso' 
      ? LASSO_TRIAL_REPETITIONS 
      : currentCondition.tunnelType === 'cascading_menu'
      ? CASCADING_MENU_TRIAL_REPETITIONS
      : BASIC_TRIAL_REPETITIONS;
    
    if (currentRepetition < repetitions) {
      // More repetitions needed - increment repetition counter and repeat same trial
      setCurrentRepetition(prev => prev + 1);
      setupTrial(currentCondition, false); // Don't reset repetition counter
    } else {
      // All repetitions complete - advance to next tunnel task
      setCurrentRepetition(1); // Reset repetition counter for next trial
      advanceTrial({
        phase,
        currentTrial,
        currentConditions,
        practicedConditions,
        setPhase,
        setCurrentTrial,
        setCurrentConditions,
        setCurrentPracticeCondition,
        setIsPractice,
        setupTrial
      });
    }
  };

  // Handle timeout
  const handleTimeout = () => {
    setFailedDueToTimeout(true);
    completeTrial(false);
  };

  // Update timer display
  useEffect(() => {
    if (trialState !== TrialState.IN_PROGRESS || !timeLimit) return;
    
    const timerInterval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = (currentTime - trialStartTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeRemaining(remaining);
    }, 50);
    
    return () => clearInterval(timerInterval);
  }, [trialState, timeLimit, trialStartTime]);

  // Use custom hooks
  useKeyboardHandler({
    phase,
    setPhase,
    currentTrial,
    setCurrentTrial,
    currentConditions,
    setCurrentConditions,
    currentPracticeCondition,
    setCurrentPracticeCondition,
    practicedConditions,
    setPracticedConditions,
    participantId,
    setParticipantId,
    setIsPractice,
    setupTrial
  });

  const { handleMouseClick, handleMouseMove } = useMouseHandler({
    phase,
    trialState,
    setTrialState,
    setCursorPos,
    cursorPosRef,
    setCursorVel,
    startButtonPos,
    targetPos,
    tunnelPath,
    tunnelType,
    tunnelWidth,
    segmentWidths,
    shouldMarkBoundaries,
    shouldEnforceBoundaries,
    setExcursionEvents,
    setExcursionMarkers,
    hasExcursionMarker,
    setHasExcursionMarker,
    onTrialComplete: completeTrial,
    onStartTrial: startTrialMovement,
    scale: canvasDimensions?.scale || 1000,
    lassoConfig,
    menuConfig,
    menuHasHoveredRef
  });

  // Time-based sampling of cursor position (every 0.01s = 100Hz)
  useEffect(() => {
    if (trialState !== TrialState.IN_PROGRESS) return;
    
    const sampleInterval = setInterval(() => {
      const currentPos = cursorPosRef.current;
      const currentTime = Date.now();
      
      // Calculate speed from previous sampled position
      let speed = 0;
      if (lastSampledTimeRef.current > 0) {
        const dx = currentPos.x - lastSampledPosRef.current.x;
        const dy = currentPos.y - lastSampledPosRef.current.y;
        const dt = (currentTime - lastSampledTimeRef.current) / 1000;
        if (dt > 0) {
          speed = Math.sqrt((dx / dt) ** 2 + (dy / dt) ** 2);
        }
      }
      
      // Record position, speed, and timestamp
      setTrajectoryPoints(prev => [...prev, { x: currentPos.x, y: currentPos.y }]);
      setSpeedHistory(prev => [...prev, speed]);
      setTimestampHistory(prev => [...prev, currentTime]);
      
      // Update refs for next speed calculation
      lastSampledPosRef.current = { x: currentPos.x, y: currentPos.y };
      lastSampledTimeRef.current = currentTime;
    }, 50); // Sample every 10ms (0.01s)
    
    return () => clearInterval(sampleInterval);
  }, [trialState]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvasDimensions || !canvasDimensions.width || !canvasDimensions.height || !canvasDimensions.scale) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Use ref for immediate cursor position (no React state delay)
      const currentCursorPos = cursorPosRef.current;
      
      drawCanvas(
        ctx,
        tunnelPath,
        tunnelType,
        tunnelWidth,
        segmentWidths,
        excursionMarkers,
        shouldMarkBoundaries(),
        currentCursorPos,
        trialState,
        startButtonPos,
        targetPos,
        canvasDimensions.width,
        canvasDimensions.height,
        canvasDimensions.scale,
        lassoConfig,
        menuConfig,
        menuHasHoveredRef
      );
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cursorPos, trialState, tunnelPath, startButtonPos, targetPos, tunnelWidth, excursionMarkers, shouldMarkBoundaries, hasExcursionMarker, tunnelType, segmentWidths, canvasDimensions, lassoConfig, menuConfig]);

  const handleUploadData = async () => {
    setUploadStatus('uploading');
    setUploadError(null);

    try {
      const docId = await uploadData(participantId, prolificData, trialData);
      setUploadedDocId(docId);
      setUploadStatus('success');
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message);
      setUploadStatus('error');
    }
  };

  const handleCompleteExperiment = async () => {
    await handleUploadData();
    downloadData(participantId, prolificData, trialData);
  };

  const handleRetryUpload = () => {
    handleUploadData();
  };

  const handleDownloadData = () => {
    downloadData(participantId, prolificData, trialData);
  };

  // Render status and controls for trial canvas
  const renderStatus = () => {
    let statusText = "";
    let statusColor = "text-gray-600";
    
    if (phase === ExperimentPhase.PRACTICE) {
      statusText = "[Practice Round]";
      statusColor = "text-green-600";
    } else if (phase === ExperimentPhase.MAIN_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Trial ${getNormalTrialNumber(phase, currentTrial)}/${getNormalTotalTrials()}`;
      statusColor = "text-blue-600";
    } else if (phase === ExperimentPhase.LASSO_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Lasso Trial ${currentTrial + 1}/${currentConditions.length}`;
      statusColor = "text-orange-600";
    } else if (phase === ExperimentPhase.CASCADING_MENU_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Cascading Menu Trial ${currentTrial + 1}/${currentConditions.length}`;
      statusColor = "text-purple-600";
    } else if (phase === ExperimentPhase.SEQUENTIAL_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Trial ${getNormalTrialNumber(phase, currentTrial)}/${getNormalTotalTrials()}`;
      statusColor = "text-indigo-600";
    } else if (phase === ExperimentPhase.TIME_TRIAL_PRACTICE && currentPracticeCondition) {
      statusText = `PRACTICE ROUND`;
      statusColor = "text-purple-600";
    } else if (phase === ExperimentPhase.TIME_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Timed Trial ${getTimedTrialNumber(phase, currentTrial)}/${getTimedTotalTrials()}`;
      statusColor = "text-red-600";
    } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS && currentTrial < currentConditions.length) {
      statusText = `Timed Trial ${getTimedTrialNumber(phase, currentTrial)}/${getTimedTotalTrials()}`;
      statusColor = "text-pink-600";
    }
    
    let stateText = "";
    if (trialState === TrialState.WAITING_FOR_START) {
      stateText = "Click the green button to begin";
    } else if (trialState === TrialState.IN_PROGRESS) {
      if (phase === ExperimentPhase.LASSO_TRIALS) {
        stateText = "Draw a loop around all yellow targets";
      } else if (phase === ExperimentPhase.CASCADING_MENU_TRIALS) {
        stateText = "Navigate through menu: move to yellow item, then select red submenu item";
      } else {
        stateText = "Navigate to the red target";
      }
    } else if (trialState === TrialState.FAILED) {
      stateText = "Trial failed, please try again";
    }
    
    return (
      <div className="space-y-2">
        {statusText && <p className={`text-base font-semibold ${statusColor} tracking-tight`}>{statusText}</p>}
        {stateText && <p className="text-xl font-bold text-gray-800 tracking-tight">{stateText}</p>}
      </div>
    );
  };

  const renderControls = () => {
    const controls = [];
  
    controls.push(
      <>
        Press <span className="font-bold text-blue-600">'R'</span> to restart trial at any time
      </>
    );
  
    if (phase === ExperimentPhase.PRACTICE || phase === ExperimentPhase.TIME_TRIAL_PRACTICE) {
      controls.push(
        <>
          Press <span className="font-bold text-blue-600">'N'</span> to continue to actual trial
        </>
      );
    }
  
    return (
      <div className="mt-3 text-base text-gray-700 leading-relaxed">
        {controls.map((control, index) => (
          <p key={index}>{control}</p>
        ))}
      </div>
    );
  };

  // Render content based on phase
  const renderContent = () => {
    switch (phase) {
      case ExperimentPhase.WELCOME:
        return <WelcomeScreen />;
      
      case ExperimentPhase.ENVIRONMENT_SETUP:
        return <EnvironmentSetup />;
      
      case ExperimentPhase.INSTRUCTIONS:
        return <Instructions />;
      
      case ExperimentPhase.LASSO_INSTRUCTIONS:
        return <LassoInstructions />;
      
      case ExperimentPhase.CASCADING_MENU_INSTRUCTIONS:
        return <CascadingMenuInstructions />;
      
      case ExperimentPhase.TIME_CONSTRAINT_INTRO:
        return <TimeConstraintIntro />;
      
      case ExperimentPhase.COMPLETE:
        return (
          <CompleteScreen
            uploadStatus={uploadStatus}
            uploadError={uploadError}
            onCompleteExperiment={handleCompleteExperiment}
            onRetryUpload={handleRetryUpload}
            onDownloadData={handleDownloadData}
          />
        );
      
      default:
        // Determine repetition count based on current trial type
        const currentCondition = currentConditions[currentTrial];
        const totalRepetitions = currentCondition && currentCondition.tunnelType === 'lasso'
          ? LASSO_TRIAL_REPETITIONS
          : currentCondition && currentCondition.tunnelType === 'cascading_menu'
          ? CASCADING_MENU_TRIAL_REPETITIONS
          : BASIC_TRIAL_REPETITIONS;
        
        return (
          <TrialCanvas
            canvasRef={canvasRef}
            phase={phase}
            trialState={trialState}
            timeLimit={timeLimit}
            timeRemaining={timeRemaining}
            failedDueToTimeout={failedDueToTimeout}
            shouldEnforceBoundaries={shouldEnforceBoundaries}
            onMouseClick={handleMouseClick}
            onMouseMove={handleMouseMove}
            renderStatus={renderStatus}
            renderControls={renderControls}
            canvasWidth={canvasDimensions.width}
            canvasHeight={canvasDimensions.height}
            currentRepetition={currentRepetition}
            totalRepetitions={totalRepetitions}
            isPractice={isPractice}
          />
        );
    }
  };

  return renderContent();
};

export default HumanSteeringExperiment;
