import { 
  BASIC_CONDITIONS, 
  SEQUENTIAL_CONDITIONS, 
  TIME_CONDITIONS, 
  SEQUENTIAL_TIME_CONDITIONS,
  ExperimentPhase 
} from '../constants/experimentConstants.js';

// Generate condition key for tracking practiced conditions
export const generateConditionKey = (condition) => {
  if (condition.tunnelType === 'sequential') {
    if (condition.segmentType === 'width') {
      return `sequential-width-${condition.segment1Width}-${condition.segment2Width}-${condition.timeLimit}`;
    } else {
      return `sequential-curvature-${condition.segment1Width}-${condition.segment2Width}-${condition.segment1Curvature}-${condition.segment2Curvature}-${condition.timeLimit}`;
    }
  } else {
    return `${condition.tunnelWidth}-${condition.curvature}-${condition.timeLimit}`;
  }
};

// Calculate trial numbers for display
export const getNormalTrialNumber = (phase, currentTrial) => {
  if (phase === ExperimentPhase.MAIN_TRIALS) {
    return currentTrial + 1;
  } else if (phase === ExperimentPhase.SEQUENTIAL_TRIALS) {
    return BASIC_CONDITIONS.length + currentTrial + 1;
  }
  return 0;
};

export const getNormalTotalTrials = () => {
  return BASIC_CONDITIONS.length + SEQUENTIAL_CONDITIONS.length;
};

export const getTimedTrialNumber = (phase, currentTrial) => {
  if (phase === ExperimentPhase.TIME_TRIALS) {
    return currentTrial + 1;
  } else if (phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS) {
    return TIME_CONDITIONS.length + currentTrial + 1;
  }
  return 0;
};

export const getTimedTotalTrials = () => {
  return TIME_CONDITIONS.length + SEQUENTIAL_TIME_CONDITIONS.length;
};

