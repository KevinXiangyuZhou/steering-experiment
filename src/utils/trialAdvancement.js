import { 
  ExperimentPhase,
  SEQUENTIAL_CONDITIONS,
  SEQUENTIAL_TIME_CONDITIONS,
  LASSO_CONDITIONS,
  CASCADING_MENU_CONDITIONS
} from '../constants/experimentConstants.js';
import { generateConditionKey } from './trialManager.js';

export const advanceTrial = ({
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
}) => {
  const nextTrial = currentTrial + 1;
  setCurrentTrial(nextTrial);
  
    if (nextTrial >= currentConditions.length) {
    if (phase === ExperimentPhase.MAIN_TRIALS) {
      // Transition to lasso instructions after basic trials
      setPhase(ExperimentPhase.LASSO_INSTRUCTIONS);
    } else if (phase === ExperimentPhase.LASSO_TRIALS) {
      // Transition to cascading menu instructions after lasso trials
      setPhase(ExperimentPhase.CASCADING_MENU_INSTRUCTIONS);
    } else if (phase === ExperimentPhase.CASCADING_MENU_TRIALS) {
      // After cascading menu trials, go to complete
      setPhase(ExperimentPhase.COMPLETE);
    }
    // Temporarily commented out - sequential and time trial phases
    // else if (phase === ExperimentPhase.SEQUENTIAL_TRIALS) {
    //   setPhase(ExperimentPhase.TIME_CONSTRAINT_INTRO);
    // } else if (phase === ExperimentPhase.TIME_TRIALS) {
    //   setPhase(ExperimentPhase.SEQUENTIAL_TIME_TRIALS);
    //   setCurrentTrial(0);
    //   setCurrentConditions([...SEQUENTIAL_TIME_CONDITIONS]);
    //   
    //   // Check if first sequential time condition needs practice
    //   const firstCondition = SEQUENTIAL_TIME_CONDITIONS[0];
    //   const conditionKey = generateConditionKey(firstCondition);
    //   
    //   if (!practicedConditions.has(conditionKey)) {
    //     setPhase(ExperimentPhase.TIME_TRIAL_PRACTICE);
    //     setCurrentPracticeCondition(firstCondition);
    //     setIsPractice(true);
    //     setupTrial(firstCondition);
    //   } else {
    //     setIsPractice(false);
    //     setupTrial(firstCondition);
    //   }
    // } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS) {
    //   setPhase(ExperimentPhase.COMPLETE);
    // }
    return;
  }
  
  // Continue directly to next trial without breaks
  // Temporarily commented out - time and sequential time trial logic
  // if (phase === ExperimentPhase.TIME_TRIALS) {
  //   // For time trials, check if the next condition needs practice
  //   const nextCondition = currentConditions[nextTrial];
  //   const conditionKey = generateConditionKey(nextCondition);
  //   
  //   if (!practicedConditions.has(conditionKey)) {
  //     setPhase(ExperimentPhase.TIME_TRIAL_PRACTICE);
  //     setCurrentPracticeCondition(nextCondition);
  //     setIsPractice(true);
  //     setupTrial(nextCondition);
  //   } else {
  //     setPhase(ExperimentPhase.TIME_TRIALS);
  //     setIsPractice(false);
  //     setupTrial(nextCondition);
  //   }
  // } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS) {
  //   // For sequential time trials, check if the next condition needs practice
  //   const nextCondition = currentConditions[nextTrial];
  //   const conditionKey = generateConditionKey(nextCondition);
  //   
  //   if (!practicedConditions.has(conditionKey)) {
  //     setPhase(ExperimentPhase.TIME_TRIAL_PRACTICE);
  //     setCurrentPracticeCondition(nextCondition);
  //     setIsPractice(true);
  //     setupTrial(nextCondition);
  //   } else {
  //     setPhase(ExperimentPhase.SEQUENTIAL_TIME_TRIALS);
  //     setIsPractice(false);
  //     setupTrial(nextCondition);
  //   }
  // } else {
    setupTrial(currentConditions[nextTrial]);
  // }
};

