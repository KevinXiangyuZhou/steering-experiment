import { useRef, useCallback } from 'react';
import { TrialState, START_BUTTON_RADIUS, TARGET_RADIUS } from '../constants/experimentConstants.js';
import { ExperimentPhase } from '../constants/experimentConstants.js';
import { checkTunnelExcursions } from '../utils/excursionChecker.js';

export const useMouseHandler = ({
  phase,
  trialState,
  setTrialState,
  setCursorPos,
  cursorPosRef, // Ref for immediate position updates
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
  onTrialComplete,
  onStartTrial,
  scale
}) => {
  const lastTimeRef = useRef(0);
  const lastMousePosRef = useRef(null);
  const trajectoryLengthRef = useRef(0);

  const handleMouseClick = useCallback((event) => {
    if (![
      ExperimentPhase.PRACTICE, 
      ExperimentPhase.MAIN_TRIALS, 
      ExperimentPhase.SEQUENTIAL_TRIALS,
      ExperimentPhase.TIME_TRIAL_PRACTICE, 
      ExperimentPhase.TIME_TRIALS,
      ExperimentPhase.SEQUENTIAL_TIME_TRIALS
    ].includes(phase)) {
      return;
    }
    
    if (trialState !== TrialState.WAITING_FOR_START) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    const distance = Math.sqrt((x - startButtonPos.x) ** 2 + (y - startButtonPos.y) ** 2);
    
    if (distance <= START_BUTTON_RADIUS) {
      onStartTrial();
    }
  }, [phase, trialState, startButtonPos, onStartTrial]);

  const handleMouseMove = useCallback((event) => {
    if (![
      ExperimentPhase.PRACTICE, 
      ExperimentPhase.MAIN_TRIALS, 
      ExperimentPhase.SEQUENTIAL_TRIALS,
      ExperimentPhase.TIME_TRIAL_PRACTICE, 
      ExperimentPhase.TIME_TRIALS,
      ExperimentPhase.SEQUENTIAL_TIME_TRIALS
    ].includes(phase)) {
      return;
    }
    
    if (trialState !== TrialState.IN_PROGRESS) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    const currentTime = Date.now();
    
    // Calculate velocity if we have a previous position
    let velocity = { x: 0, y: 0 };
    if (lastMousePosRef.current && lastTimeRef.current) {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      if (dt > 0) {
        const dx = x - lastMousePosRef.current.x;
        const dy = y - lastMousePosRef.current.y;
        velocity = { x: dx / dt, y: dy / dt };
      }
    }
    
    // Update cursor position immediately via ref (for smooth rendering)
    cursorPosRef.current = { x, y };
    // Also update state (for data recording and React dependencies)
    setCursorPos({ x, y });
    setCursorVel(velocity);
    
    // Record data immediately when position updates
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    setTrajectoryPoints(prev => {
      const newPoints = [...prev, { x, y }];
      trajectoryLengthRef.current = newPoints.length;
      return newPoints;
    });
    setSpeedHistory(prev => [...prev, speed]);
    setTimestampHistory(prev => [...prev, currentTime]);
    
    // Check for excursions and mark them
    if (shouldMarkBoundaries()) {
      const excursionResult = checkTunnelExcursions(x, y, tunnelPath, tunnelType, tunnelWidth, segmentWidths);
      if (excursionResult.isExcursion && !hasExcursionMarker) {
        // Add marker at boundary location (only once per trial)
        setExcursionMarkers([excursionResult.boundaryPoint]);
        setHasExcursionMarker(true);
        
        // Record excursion event
        const excursion = {
          timeIndex: trajectoryLengthRef.current - 1,
          position: { x, y },
          distanceOutside: excursionResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: excursionResult.boundaryPoint
        };
        setExcursionEvents(prev => [...prev, excursion]);
        
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
      onTrialComplete(true);
    }
    
    // Store last position for next calculation
    lastMousePosRef.current = { x, y };
    lastTimeRef.current = currentTime;
  }, [
    phase,
    trialState,
    setCursorPos,
    cursorPosRef,
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
    setTrialState,
    onTrialComplete,
    scale
  ]);

  return { handleMouseClick, handleMouseMove, lastTimeRef };
};

