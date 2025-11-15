import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ExperimentPhase, TrialState, BASIC_CONDITIONS } from './constants/experimentConstants.js';
import { getUrlParameters } from './utils/urlUtils.js';
import { generateTunnelPath, generateSequentialTunnelPath } from './utils/tunnelGenerator.js';
import { downloadData, uploadData } from './utils/dataManager.js';
import { advanceTrial } from './utils/trialAdvancement.js';
import { drawCanvas } from './components/canvas/DrawingFunctions.js';
import { useKeyboardHandler } from './hooks/useKeyboardHandler.js';
import { useMouseHandler } from './hooks/useMouseHandler.js';
import { useTrialTimer } from './hooks/useTrialTimer.js';
import { WelcomeScreen } from './components/ui/WelcomeScreen.jsx';
import { EnvironmentSetup } from './components/ui/EnvironmentSetup.jsx';
import { ScreenCalibration } from './components/ui/ScreenCalibration.jsx';
import { Instructions } from './components/ui/Instructions.jsx';
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
  const [canvasDimensions, setCanvasDimensions] = useState(() => calculateCanvasDimensions());
  
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
  const [cursorVel, setCursorVel] = useState({ x: 0, y: 0 });
  const [tunnelPath, setTunnelPath] = useState([]);
  const [tunnelWidth, setTunnelWidth] = useState(0.015);
  const [tunnelType, setTunnelType] = useState('curved');
  const [segmentWidths, setSegmentWidths] = useState([0.015, 0.025, 0.015]);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [startButtonPos, setStartButtonPos] = useState({ x: 0, y: 0 });

  // Timer state
  const [trialStartTime, setTrialStartTime] = useState(0);
  const [timeLimit, setTimeLimit] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [failedDueToTimeout, setFailedDueToTimeout] = useState(false);

  // Check if current phase should enforce boundary constraints
  const shouldEnforceBoundaries = useCallback(() => {
    return phase === ExperimentPhase.PRACTICE || phase === ExperimentPhase.MAIN_TRIALS || phase === ExperimentPhase.SEQUENTIAL_TRIALS;
  }, [phase]);

  // Check if current phase should mark boundary violations
  const shouldMarkBoundaries = useCallback(() => {
    return phase === ExperimentPhase.PRACTICE || phase === ExperimentPhase.MAIN_TRIALS || phase === ExperimentPhase.SEQUENTIAL_TRIALS;
  }, [phase]);

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
  const setupTrial = useCallback((condition) => {
    let path;
    if (condition.tunnelType === 'sequential') {
      path = generateSequentialTunnelPath(condition);
      setTunnelType('sequential');
      setSegmentWidths([condition.segment1Width, condition.segment2Width]);
      setTunnelWidth(condition.segment1Width);
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
    setExcursionMarkers([]);
    setHasExcursionMarker(false);
    setTrialStartTime(0);
    setTimeRemaining(condition.timeLimit || 0);
    setFailedDueToTimeout(false);
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
    setCursorVel({ x: 0, y: 0 });
    
    setTrajectoryPoints([startPos]);
    setSpeedHistory([0]);
    setTimestampHistory([startTime]);
    setExcursionEvents([]);
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
    const { id, ...condition } = currentCondition;
    const trialResult = {
      participantId,
      completionTime,
      condition,
      trial_id: currentCondition.id,
      timestamps: [...timestampHistory],
      trajectory: [...trajectoryPoints],
      speeds: [...speedHistory]
    };
    
    setTrialData(prev => [...prev, trialResult]);
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
    setCursorVel,
    setTrajectoryPoints,
    setSpeedHistory,
    setTimestampHistory,
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
    scale: canvasDimensions.scale
  });

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      drawCanvas(
        ctx,
        tunnelPath,
        tunnelType,
        tunnelWidth,
        segmentWidths,
        excursionMarkers,
        shouldMarkBoundaries(),
        cursorPos,
        trialState,
        startButtonPos,
        targetPos,
        canvasDimensions.width,
        canvasDimensions.height,
        canvasDimensions.scale
      );
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cursorPos, trialState, tunnelPath, startButtonPos, targetPos, tunnelWidth, excursionMarkers, shouldMarkBoundaries, hasExcursionMarker, tunnelType, segmentWidths, canvasDimensions]);

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
      stateText = "Navigate to the red target";
    } else if (trialState === TrialState.FAILED) {
      stateText = "Trial failed, please try again";
    }
    
    return (
      <div className="space-y-1">
        {statusText && <p className={`text-sm ${statusColor}`}>{statusText}</p>}
        {stateText && <p className="text-lg font-bold gray-red-900">{stateText}</p>}
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
          Press <span className="font-bold text-blue-600">'N'</span> to continue to real trial
        </>
      );
    }
  
    return (
      <div className="mt-2 text-sm text-gray-600">
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
      
      case ExperimentPhase.SCREEN_CALIBRATION:
        return <ScreenCalibration />;
      
      case ExperimentPhase.INSTRUCTIONS:
        return <Instructions />;
      
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
          />
        );
    }
  };

  return renderContent();
};

export default HumanSteeringExperiment;
