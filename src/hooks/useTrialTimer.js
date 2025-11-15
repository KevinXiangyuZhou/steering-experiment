import { useEffect } from 'react';
import { TrialState } from '../constants/experimentConstants.js';

export const useTrialTimer = (trialState, timeLimit, trialStartTime, onTimeout) => {
  useEffect(() => {
    if (trialState !== TrialState.IN_PROGRESS || !timeLimit) return;
    
    const timerInterval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = (currentTime - trialStartTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      
      if (remaining <= 0) {
        onTimeout();
      }
    }, 50); // Update timer more frequently for smooth display
    
    return () => clearInterval(timerInterval);
  }, [trialState, timeLimit, trialStartTime, onTimeout]);
};

