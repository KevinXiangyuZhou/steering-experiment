import { useRef, useCallback } from 'react';
import { TrialState, START_BUTTON_RADIUS, TARGET_RADIUS } from '../constants/experimentConstants.js';
import { ExperimentPhase } from '../constants/experimentConstants.js';
import { checkTunnelExcursions, checkLassoGrayIconCollision, checkCascadingMenuExcursion, checkLassoShortcut } from '../utils/excursionChecker.js';

export const useMouseHandler = ({
  phase,
  trialState,
  setTrialState,
  setCursorPos,
  cursorPosRef, // Ref for immediate position updates (recording done via time-based sampling)
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
  onTrialComplete,
  onStartTrial,
  scale,
  lassoConfig = null,
  menuConfig = null,
  menuHasHoveredRef = null
}) => {
  const lastTimeRef = useRef(0);
  const lastMousePosRef = useRef(null);

  const handleMouseClick = useCallback((event) => {
    if (![
      ExperimentPhase.PRACTICE, 
      ExperimentPhase.MAIN_TRIALS, 
      ExperimentPhase.SEQUENTIAL_TRIALS,
      ExperimentPhase.LASSO_TRIALS,
      ExperimentPhase.CASCADING_MENU_TRIALS,
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
    
    // Use smaller radius for lasso and cascading menu trials
    const buttonRadius = (tunnelType === 'lasso' || tunnelType === 'cascading_menu') ? 0.003 : START_BUTTON_RADIUS;
    
    if (distance <= buttonRadius) {
      onStartTrial();
    }
  }, [phase, trialState, startButtonPos, tunnelType, onStartTrial, scale]);

  const handleMouseMove = useCallback((event) => {
    if (![
      ExperimentPhase.PRACTICE, 
      ExperimentPhase.MAIN_TRIALS, 
      ExperimentPhase.SEQUENTIAL_TRIALS,
      ExperimentPhase.LASSO_TRIALS,
      ExperimentPhase.CASCADING_MENU_TRIALS,
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
    // Also update state (for React dependencies)
    setCursorPos({ x, y });
    setCursorVel(velocity);
    
    // Note: Position recording is now done via time-based sampling (not on every mouse move)
    
    // Check for excursions - different logic for lasso vs cascading menu vs other trials
    if (tunnelType === 'cascading_menu' && menuConfig) {
      // For cascading menu trials, check if cursor is outside menu windows
      // Determine if submenu should be visible for rendering
      const {
        targetMainMenuIndex,
        mainMenuWindowSize = [0.08, 0.15],
        mainMenuOrigin = [0.1, 0.1]
      } = menuConfig;
      
      const [mainMenuX, mainMenuY] = mainMenuOrigin;
      const [mainMenuWidth, mainMenuHeight] = mainMenuWindowSize;
      const mainMenuItemHeight = mainMenuHeight / menuConfig.mainMenuSize;
      
      const mainMenuLeft = mainMenuX;
      const mainMenuTop = mainMenuY;
      const mainMenuRight = mainMenuLeft + mainMenuWidth;
      const targetItemTop = mainMenuTop + targetMainMenuIndex * mainMenuItemHeight;
      const targetItemBottom = targetItemTop + mainMenuItemHeight;
      const targetItemLeft = mainMenuLeft;
      const targetItemRight = mainMenuRight;
      
      const isHoveringMain = x >= targetItemLeft && x <= targetItemRight &&
                             y >= targetItemTop && y <= targetItemBottom;
      
      // Update hover state for submenu visibility
      if (menuHasHoveredRef && isHoveringMain) {
        menuHasHoveredRef.current = true;
      }
      
      // Check for excursions - cursor must stay within menu windows
      const shouldShowSubmenu = menuHasHoveredRef ? menuHasHoveredRef.current : isHoveringMain;
      const excursionResult = checkCascadingMenuExcursion(x, y, menuConfig, shouldShowSubmenu);
      
      if (excursionResult.isExcursion && shouldEnforceBoundaries()) {
        // Mark the excursion
        if (!hasExcursionMarker) {
          setExcursionMarkers([excursionResult.boundaryPoint]);
          setHasExcursionMarker(true);
        }
        
        // Record excursion event
        const excursion = {
          position: { x, y },
          distanceOutside: excursionResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: excursionResult.boundaryPoint
        };
        setExcursionEvents(prev => [...prev, excursion]);
        
        // Fail the trial immediately when cursor leaves menu windows
        setTrialState(TrialState.FAILED);
        return; // Don't continue processing this movement
      } else if (excursionResult.isExcursion && shouldMarkBoundaries()) {
        // Just mark the boundary violation without failing
        if (!hasExcursionMarker) {
          setExcursionMarkers([excursionResult.boundaryPoint]);
          setHasExcursionMarker(true);
        }
        
        // Record excursion event
        const excursion = {
          position: { x, y },
          distanceOutside: excursionResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: excursionResult.boundaryPoint
        };
        setExcursionEvents(prev => [...prev, excursion]);
      }
    } else if (tunnelType === 'lasso' && lassoConfig) {
      // For lasso trials, check:
      // 1. Cursor cannot move over gray (distractor) icons
      // 2. Cursor cannot move within 2/3 radius of yellow (target) icons
      const collisionResult = checkLassoGrayIconCollision(x, y, lassoConfig);
      if (collisionResult.isExcursion) {
        // Mark the collision
        if (!hasExcursionMarker) {
          setExcursionMarkers([collisionResult.boundaryPoint]);
          setHasExcursionMarker(true);
        }
        
        // Record collision event
        const collision = {
          position: { x, y },
          distanceOutside: collisionResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: collisionResult.boundaryPoint
        };
        setExcursionEvents(prev => [...prev, collision]);
        
        // Fail the trial immediately when violating constraints
        setTrialState(TrialState.FAILED);
        return; // Don't continue processing this movement
      }
      
      // Check for shortcuts/cheating:
      // 1. Prevent cursor from moving into region formed by connecting border target centers
      // 2. Prevent direct path from start to end using horizontal bar region
      const shortcutResult = checkLassoShortcut(x, y, lassoConfig, startButtonPos, targetPos);
      if (shortcutResult.isExcursion) {
        // Mark the shortcut violation
        if (!hasExcursionMarker) {
          setExcursionMarkers([shortcutResult.boundaryPoint]);
          setHasExcursionMarker(true);
        }
        
        // Record shortcut violation event
        const shortcut = {
          position: { x, y },
          distanceOutside: shortcutResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: shortcutResult.boundaryPoint
        };
        setExcursionEvents(prev => [...prev, shortcut]);
        
        // Fail the trial immediately when attempting to cheat
        setTrialState(TrialState.FAILED);
        return; // Don't continue processing this movement
      }
    } else if (shouldMarkBoundaries()) {
      // For non-lasso trials, check tunnel boundary excursions
      const excursionResult = checkTunnelExcursions(x, y, tunnelPath, tunnelType, tunnelWidth, segmentWidths);
      if (excursionResult.isExcursion && !hasExcursionMarker) {
        // Add marker at boundary location (only once per trial)
        setExcursionMarkers([excursionResult.boundaryPoint]);
        setHasExcursionMarker(true);
        
        // Record excursion event
        // Note: timeIndex will be calculated based on elapsed time since sampling is time-based
        const excursion = {
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
    if (tunnelType === 'cascading_menu' && menuConfig) {
      // For cascading menu, check if cursor is within target submenu item
      // Submenu only appears when hovering over target main menu item
      const {
        targetMainMenuIndex,
        targetSubMenuIndex,
        mainMenuWindowSize = [0.08, 0.15],
        subMenuWindowSize = [0.08, 0.12],
        mainMenuOrigin = [0.1, 0.1]
      } = menuConfig;
      
      const [mainMenuX, mainMenuY] = mainMenuOrigin;
      const [mainMenuWidth, mainMenuHeight] = mainMenuWindowSize;
      const [subMenuWidth, subMenuHeight] = subMenuWindowSize;
      
      // Calculate item dimensions from window size (no gaps)
      const mainMenuItemHeight = mainMenuHeight / menuConfig.mainMenuSize;
      const subMenuItemHeight = subMenuHeight / menuConfig.subMenuSize;
      
      // Calculate main menu bounds (rectangular window)
      const mainMenuLeft = mainMenuX;
      const mainMenuTop = mainMenuY;
      const mainMenuRight = mainMenuLeft + mainMenuWidth;
      
      // Calculate target main menu item bounds (no gaps)
      const targetItemTop = mainMenuTop + targetMainMenuIndex * mainMenuItemHeight;
      const targetItemBottom = targetItemTop + mainMenuItemHeight;
      const targetItemLeft = mainMenuLeft;
      const targetItemRight = mainMenuRight;
      
      // Check if hovering over target main menu item (rectangular bounds)
      const isHoveringMain = x >= targetItemLeft && x <= targetItemRight &&
                             y >= targetItemTop && y <= targetItemBottom;
      
      // Track if we've hovered (persistent submenu) - use ref
      if (menuHasHoveredRef) {
        if (isHoveringMain) {
          menuHasHoveredRef.current = true;
        }
      }
      const shouldShowSubmenu = menuHasHoveredRef ? menuHasHoveredRef.current : isHoveringMain;
      
      if (shouldShowSubmenu) {
        // Submenu is visible, positioned adjacent to main menu
        const subMenuLeft = mainMenuRight; // Start right after main menu
        const subMenuTop = targetItemTop; // Align with target item
        const targetSubItemTop = subMenuTop + targetSubMenuIndex * subMenuItemHeight;
        const targetSubItemBottom = targetSubItemTop + subMenuItemHeight;
        const targetSubItemLeft = subMenuLeft;
        const targetSubItemRight = subMenuLeft + subMenuWidth;
        
        // Check if cursor is within target submenu item bounds
        if (x >= targetSubItemLeft && x <= targetSubItemRight &&
            y >= targetSubItemTop && y <= targetSubItemBottom) {
          onTrialComplete(true);
        }
      }
    } else {
      // Standard target completion check
      const targetDist = Math.sqrt((x - targetPos.x) ** 2 + (y - targetPos.y) ** 2);
      
      // Use smaller radius for lasso trials
      const targetRadius = tunnelType === 'lasso' ? 0.003 : TARGET_RADIUS;
      
      if (targetDist < targetRadius) {
        onTrialComplete(true);
      }
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
    scale,
    lassoConfig,
    menuConfig,
    tunnelType
  ]);

  return { handleMouseClick, handleMouseMove, lastTimeRef };
};

