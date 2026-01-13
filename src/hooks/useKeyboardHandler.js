import { useEffect } from 'react';
import { 
  ExperimentPhase, 
  BASIC_CONDITIONS, 
  SEQUENTIAL_CONDITIONS, 
  TIME_CONDITIONS, 
  SEQUENTIAL_TIME_CONDITIONS,
  LASSO_CONDITIONS,
  CASCADING_MENU_CONDITIONS
} from '../constants/experimentConstants.js';
import { generateConditionKey } from '../utils/trialManager.js';

export const useKeyboardHandler = ({
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
}) => {
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
            setupTrial(currentConditions[currentTrial], false); // Don't reset repetition when restarting
          }
          break;
        
        case ExperimentPhase.LASSO_INSTRUCTIONS:
          if (event.key === ' ') {
            // Start lasso trials
            setPhase(ExperimentPhase.LASSO_TRIALS);
            setCurrentTrial(0);
            setCurrentConditions([...LASSO_CONDITIONS]);
            setIsPractice(false);
            setupTrial(LASSO_CONDITIONS[0]);
          }
          break;
        
        case ExperimentPhase.LASSO_TRIALS:
          if (event.key === 'r') {
            setupTrial(currentConditions[currentTrial], false); // Don't reset repetition when restarting
          }
          break;
        
        case ExperimentPhase.CASCADING_MENU_INSTRUCTIONS:
          if (event.key === ' ') {
            // Start cascading menu trials
            setPhase(ExperimentPhase.CASCADING_MENU_TRIALS);
            setCurrentTrial(0);
            setCurrentConditions([...CASCADING_MENU_CONDITIONS]);
            setIsPractice(false);
            setupTrial(CASCADING_MENU_CONDITIONS[0]);
          }
          break;
        
        case ExperimentPhase.CASCADING_MENU_TRIALS:
          if (event.key === 'r') {
            setupTrial(currentConditions[currentTrial], false); // Don't reset repetition when restarting
          }
          break;
        
        // Temporarily commented out - sequential and time trial phases
        // case ExperimentPhase.SEQUENTIAL_TRIALS:
        //   if (event.key === 'r') {
        //     setupTrial(currentConditions[currentTrial]);
        //   }
        //   break;
        
        // case ExperimentPhase.TIME_CONSTRAINT_INTRO:
        //   if (event.key === ' ') {
        //     // Set up for time trials
        //     const newConditions = [...TIME_CONDITIONS];
        //     setCurrentTrial(0);
        //     setCurrentConditions(newConditions);
        //     setPracticedConditions(new Set());
        //     
        //     // Check if first condition needs practice (it always will since we cleared practiced conditions)
        //     const firstCondition = newConditions[0];
        //     
        //     // Start with practice for first time trial
        //     setPhase(ExperimentPhase.TIME_TRIAL_PRACTICE);
        //     setCurrentPracticeCondition(firstCondition);
        //     setIsPractice(true);
        //     setupTrial(firstCondition);
        //   }
        //   break;
        
        // case ExperimentPhase.TIME_TRIAL_PRACTICE:
        //   if (event.key === 'r') {
        //     setupTrial(currentPracticeCondition);
        //   } else if (event.key === 'n') {
        //     // Mark this condition as practiced
        //     const conditionKey = generateConditionKey(currentPracticeCondition);
        //     
        //     setPracticedConditions(prev => new Set([...prev, conditionKey]));
        //     
        //     // Move to the actual trial for the CURRENT trial number (don't increment)
        //     // Return to the appropriate phase based on trial type
        //     if (currentPracticeCondition.tunnelType === 'sequential') {
        //       setPhase(ExperimentPhase.SEQUENTIAL_TIME_TRIALS);
        //     } else {
        //       setPhase(ExperimentPhase.TIME_TRIALS);
        //     }
        //     setIsPractice(false);
        //     setupTrial(currentConditions[currentTrial]);
        //   }
        //   break;
        
        // case ExperimentPhase.TIME_TRIALS:
        //   if (event.key === 'r') {
        //     setupTrial(currentConditions[currentTrial]);
        //   }
        //   break;
        
        // case ExperimentPhase.SEQUENTIAL_TIME_TRIALS:
        //   if (event.key === 'r') {
        //     setupTrial(currentConditions[currentTrial]);
        //   }
        //   break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    phase, 
    currentTrial, 
    currentConditions, 
    currentPracticeCondition, 
    participantId, 
    setupTrial,
    setPhase,
    setCurrentTrial,
    setCurrentConditions,
    setCurrentPracticeCondition,
    setPracticedConditions,
    setParticipantId,
    setIsPractice
  ]);
};

