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

// Compute the per-trial target radius:
// - wide_to_narrow / narrow_to_wide: constant, 0.5 * the target-end (segment2) width
// - straight: swept via radiusRatio * tunnelWidth (see BASIC_CONDITIONS)
// - unconstrained_pointing / constrained_to_unconstrained: swept directly via condition.targetRadius
// - everything else (sinusoidal incl. gentle/sharp, corner): constant, 0.5 * tunnelWidth
export const computeTargetRadius = (condition) => {
  if (condition.tunnelType === 'wide_to_narrow' || condition.tunnelType === 'narrow_to_wide') {
    return 0.5 * condition.segment2Width;
  }
  if (condition.tunnelType === 'straight') {
    return condition.radiusRatio * condition.tunnelWidth;
  }
  if (condition.tunnelType === 'unconstrained_pointing' || condition.tunnelType === 'constrained_to_unconstrained') {
    return condition.targetRadius;
  }
  return 0.5 * condition.tunnelWidth;
};

const TARGET_POSITIONS = ['top', 'middle', 'bottom'];

// Assigns `targetPosition` to a set of same-tunnelType entries, guaranteeing an exact global
// 1/3 split across all of them while also stratifying as evenly as divisibility allows within
// each group (grouped by groupKeyFn — distance, or width+distance). A rotating "which position is
// short this group" scheme (rather than an independent random pick per group) guarantees the
// global split exactly, not just in expectation: each position is short in exactly one group out
// of every 3, so shortfalls cancel out overall (3 groups of 5 → 2+2+1 per group in a rotating
// pattern sums to exactly 5/5/5; groups of exactly 3 get exactly 1 each, no shortfall).
const stratifyPositions = (entries, groupKeyFn) => {
  const groupsMap = new Map();
  for (const entry of entries) {
    const key = groupKeyFn(entry);
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key).push(entry);
  }
  const groupList = shuffleArray([...groupsMap.values()]);
  const basePositions = shuffleArray([...TARGET_POSITIONS]);

  const result = [];
  groupList.forEach((group, groupIndex) => {
    const rotation = groupIndex % TARGET_POSITIONS.length;
    const groupPositions = [...basePositions.slice(rotation), ...basePositions.slice(0, rotation)];
    const shuffledGroup = shuffleArray([...group]);
    shuffledGroup.forEach((entry, i) => {
      result.push({ ...entry, targetPosition: groupPositions[i % groupPositions.length] });
    });
  });
  return result;
};

// Assigns target position (top/middle/bottom) to every unconstrained_pointing /
// constrained_to_unconstrained condition. Position is not a crossed factor for these trial types —
// it's a randomly-assigned, evenly-distributed attribute layered on top of the distance × radius
// (× width) grid, so it can't confound those comparisons without tripling the trial count. Called
// once per session (fresh randomization each time), before the main-trial shuffle.
export const assignTargetPositions = (conditions) => {
  const unconstrained = conditions.filter(c => c.tunnelType === 'unconstrained_pointing');
  const hybrid = conditions.filter(c => c.tunnelType === 'constrained_to_unconstrained');
  const others = conditions.filter(c =>
    c.tunnelType !== 'unconstrained_pointing' && c.tunnelType !== 'constrained_to_unconstrained'
  );
  return [
    ...others,
    ...stratifyPositions(unconstrained, c => c.distance),
    ...stratifyPositions(hybrid, c => `${c.segment1Width}_${c.distance}`)
  ];
};

// Build the shuffled main-trial condition sequence. Straight-tunnel conditions are grouped by
// tunnelWidth (their 3 radius-ratio entries) and shuffled within that group so they stay
// consecutive, mirroring how a single condition's repetitions already play consecutively;
// every other condition is its own singleton group. Group order is then shuffled as before.
export const buildShuffledMainConditions = (conditions) => {
  const straightByWidth = new Map();
  const blocks = [];
  for (const condition of conditions) {
    if (condition.tunnelType === 'straight') {
      let block = straightByWidth.get(condition.tunnelWidth);
      if (!block) {
        block = [];
        straightByWidth.set(condition.tunnelWidth, block);
        blocks.push(block);
      }
      block.push(condition);
    } else {
      blocks.push([condition]);
    }
  }
  const shuffledBlocks = shuffleArray(blocks.map(block => shuffleArray([...block])));
  return shuffledBlocks.flat();
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

