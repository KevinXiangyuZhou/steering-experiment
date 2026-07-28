import { useRef, useCallback } from 'react';
import { TrialState, START_BUTTON_RADIUS, TARGET_RADIUS } from '../constants/experimentConstants.js';
import { ExperimentPhase } from '../constants/experimentConstants.js';
import { checkTunnelExcursions, checkLassoGrayIconCollision, checkCascadingMenuExcursion, checkLassoShortcut } from '../utils/excursionChecker.js';

export const useMouseHandler = ({
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
  onTrialComplete,
  onStartTrial,
  scale,
  targetRadius = TARGET_RADIUS, // NEW: per-trial radius, passed down from the current condition
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

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    if (trialState === TrialState.WAITING_FOR_START) {
      const distance = Math.sqrt((x - startButtonPos.x) ** 2 + (y - startButtonPos.y) ** 2);
      const buttonRadius = (tunnelType === 'lasso' || tunnelType === 'cascading_menu') ? 0.003 : START_BUTTON_RADIUS;
      if (distance <= buttonRadius) {
        onStartTrial({ x, y });
      }
      return;
    }

    // Click-to-finish (Fitts'-law-style discrete target acquisition) for
    // standard steering trials. Lasso finishes via loop-closing logic in
    // handleMouseMove; cascading menu finishes by hovering the target
    // submenu item — both unchanged and excluded here.
    if (trialState === TrialState.IN_PROGRESS && tunnelType !== 'lasso' && tunnelType !== 'cascading_menu') {
      const targetDist = Math.sqrt((x - targetPos.x) ** 2 + (y - targetPos.y) ** 2);
      if (targetDist <= targetRadius) {
        onTrialComplete(true);
      }
    }
  }, [phase, trialState, startButtonPos, targetPos, tunnelType, targetRadius, onStartTrial, onTrialComplete, scale, setCursorPos, cursorPosRef]);

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

    let velocity = { x: 0, y: 0 };
    if (lastMousePosRef.current && lastTimeRef.current) {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      if (dt > 0) {
        const dx = x - lastMousePosRef.current.x;
        const dy = y - lastMousePosRef.current.y;
        velocity = { x: dx / dt, y: dy / dt };
      }
    }

    cursorPosRef.current = { x, y };
    setCursorPos({ x, y });
    setCursorVel(velocity);

    // Boundary / excursion checks — unchanged from the original.
    if (tunnelType === 'cascading_menu' && menuConfig) {
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

      if (menuHasHoveredRef && isHoveringMain) {
        menuHasHoveredRef.current = true;
      }

      const shouldShowSubmenu = menuHasHoveredRef ? menuHasHoveredRef.current : isHoveringMain;
      const excursionResult = checkCascadingMenuExcursion(x, y, menuConfig, shouldShowSubmenu);

      if (excursionResult.isExcursion && shouldEnforceBoundaries()) {
        if (!hasExcursionMarker) {
          setExcursionMarkers([excursionResult.boundaryPoint]);
          setHasExcursionMarker(true);
        }
        setExcursionEvents(prev => [...prev, {
          position: { x, y },
          distanceOutside: excursionResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: excursionResult.boundaryPoint
        }]);
        setTrialState(TrialState.FAILED);
        return;
      } else if (excursionResult.isExcursion && shouldMarkBoundaries()) {
        if (!hasExcursionMarker) {
          setExcursionMarkers([excursionResult.boundaryPoint]);
          setHasExcursionMarker(true);
        }
        setExcursionEvents(prev => [...prev, {
          position: { x, y },
          distanceOutside: excursionResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: excursionResult.boundaryPoint
        }]);
      }
    } else if (tunnelType === 'lasso' && lassoConfig) {
      const collisionResult = checkLassoGrayIconCollision(x, y, lassoConfig);
      if (collisionResult.isExcursion) {
        if (!hasExcursionMarker) {
          setExcursionMarkers([collisionResult.boundaryPoint]);
          setHasExcursionMarker(true);
        }
        setExcursionEvents(prev => [...prev, {
          position: { x, y },
          distanceOutside: collisionResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: collisionResult.boundaryPoint
        }]);
        setTrialState(TrialState.FAILED);
        return;
      }

      const shortcutResult = checkLassoShortcut(x, y, lassoConfig, startButtonPos, targetPos);
      if (shortcutResult.isExcursion) {
        if (!hasExcursionMarker) {
          setExcursionMarkers([shortcutResult.boundaryPoint]);
          setHasExcursionMarker(true);
        }
        setExcursionEvents(prev => [...prev, {
          position: { x, y },
          distanceOutside: shortcutResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: shortcutResult.boundaryPoint
        }]);
        setTrialState(TrialState.FAILED);
        return;
      }
    } else if (shouldMarkBoundaries()) {
      const excursionResult = checkTunnelExcursions(x, y, tunnelPath, tunnelType, tunnelWidth, segmentWidths);
      if (excursionResult.isExcursion && !hasExcursionMarker) {
        setExcursionMarkers([excursionResult.boundaryPoint]);
        setHasExcursionMarker(true);
        setExcursionEvents(prev => [...prev, {
          position: { x, y },
          distanceOutside: excursionResult.distanceOutside,
          timestamp: currentTime,
          boundaryPoint: excursionResult.boundaryPoint
        }]);
        if (shouldEnforceBoundaries()) {
          setTrialState(TrialState.FAILED);
          return;
        }
      }
    }

    // Trial completion.
    if (tunnelType === 'cascading_menu' && menuConfig) {
      // Unchanged — cascading menu still completes on hover, since it's a
      // menu-selection task rather than a steering task with a discrete
      // Fitts'-law endpoint.
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

      const mainMenuItemHeight = mainMenuHeight / menuConfig.mainMenuSize;
      const subMenuItemHeight = subMenuHeight / menuConfig.subMenuSize;

      const mainMenuLeft = mainMenuX;
      const mainMenuTop = mainMenuY;
      const mainMenuRight = mainMenuLeft + mainMenuWidth;

      const targetItemTop = mainMenuTop + targetMainMenuIndex * mainMenuItemHeight;
      const targetItemBottom = targetItemTop + mainMenuItemHeight;
      const targetItemLeft = mainMenuLeft;
      const targetItemRight = mainMenuRight;

      const isHoveringMain = x >= targetItemLeft && x <= targetItemRight &&
                             y >= targetItemTop && y <= targetItemBottom;

      if (menuHasHoveredRef && isHoveringMain) {
        menuHasHoveredRef.current = true;
      }
      const shouldShowSubmenu = menuHasHoveredRef ? menuHasHoveredRef.current : isHoveringMain;

      if (shouldShowSubmenu) {
        const subMenuLeft = mainMenuRight;
        const subMenuTop = targetItemTop;
        const targetSubItemTop = subMenuTop + targetSubMenuIndex * subMenuItemHeight;
        const targetSubItemBottom = targetSubItemTop + subMenuItemHeight;
        const targetSubItemLeft = subMenuLeft;
        const targetSubItemRight = subMenuLeft + subMenuWidth;

        if (x >= targetSubItemLeft && x <= targetSubItemRight &&
            y >= targetSubItemTop && y <= targetSubItemBottom) {
          onTrialComplete(true);
        }
      }
    } else if (tunnelType === 'lasso') {
      // Unchanged — lasso still completes on proximity to the closing target.
      const targetDist = Math.sqrt((x - targetPos.x) ** 2 + (y - targetPos.y) ** 2);
      const lassoTargetRadius = 0.003;
      if (targetDist < lassoTargetRadius) {
        onTrialComplete(true);
      }
    }
    // Standard steering trials no longer complete on hover — see
    // handleMouseClick, which now requires an explicit click on the target.

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
    menuConfig
  ]);

  return { handleMouseClick, handleMouseMove, lastTimeRef };
};