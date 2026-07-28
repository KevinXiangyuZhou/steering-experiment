import { 
  BASIC_CONDITIONS, 
  SEQUENTIAL_CONDITIONS, 
  TIME_CONDITIONS, 
  SEQUENTIAL_TIME_CONDITIONS,
  ExperimentPhase 
} from '../constants/experimentConstants.js';

// Fisher-Yates shuffle for randomizing condition order within each phase
export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Shuffles which BLOCK comes first (e.g. "sinusoidal width 0.01", "corner
// width 0.03"), while keeping every trial within a block consecutive and
// in its original relative order. Mirrors the original experiment's
// behavior, where each array entry was one condition repeated in place —
// now that each condition is 6 separate radius trials, this keeps those
// 6 glued together instead of letting a flat shuffle scatter them.
// Conditions without a groupId (e.g. lasso/menu, if reactivated later)
// each get treated as their own singleton group, so this is a safe
// drop-in replacement for shuffleArray anywhere.
export const shuffleGroupedConditions = (conditions) => {
  const groups = new Map();
  const order = [];
  for (const cond of conditions) {
    const key = cond.groupId !== undefined ? cond.groupId : `__ungrouped_${cond.id}`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(cond);
  }
  const shuffledOrder = shuffleArray([...order]);
  return shuffledOrder.flatMap((key) => groups.get(key));
};

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
export const getNormalTrialNumber = (phase, currentTrial, currentConditions = []) => {
  if (phase === ExperimentPhase.MAIN_TRIALS) {
    // Each trialID (groupId) now spans 6 consecutive radius trials, so
    // report progress in terms of distinct trialIDs reached so far,
    // not the flat radius-expanded position.
    const seen = new Set();
    for (let i = 0; i <= currentTrial && i < currentConditions.length; i++) {
      const groupId = currentConditions[i]?.groupId;
      seen.add(groupId !== undefined ? groupId : `__ungrouped_${i}`);
    }
    return seen.size;
  } else if (phase === ExperimentPhase.SEQUENTIAL_TRIALS) {
    return BASIC_CONDITIONS.length + currentTrial + 1;
  }
  return 0;
};

export const getNormalTotalTrials = () => {
  const seen = new Set();
  BASIC_CONDITIONS.forEach(c => seen.add(c.groupId !== undefined ? c.groupId : c.id));
  return seen.size + SEQUENTIAL_CONDITIONS.length;
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

