// Experiment phases
export const ExperimentPhase = {
  ENVIRONMENT_SETUP: 'environment_setup',
  SCREEN_CALIBRATION: 'screen_calibration',
  WELCOME: 'welcome',
  INSTRUCTIONS: 'instructions',
  PRACTICE: 'practice',
  MAIN_TRIALS: 'main_trials',
  LASSO_INSTRUCTIONS: 'lasso_instructions',
  LASSO_TRIALS: 'lasso_trials',
  CASCADING_MENU_INSTRUCTIONS: 'cascading_menu_instructions',
  CASCADING_MENU_TRIALS: 'cascading_menu_trials',
  SEQUENTIAL_TRIALS: 'sequential_trials',
  TIME_CONSTRAINT_INTRO: 'time_constraint_intro',
  TIME_TRIAL_PRACTICE: 'time_trial_practice',
  TIME_TRIALS: 'time_trials',
  SEQUENTIAL_TIME_TRIALS: 'sequential_time_trials',
  COMPLETE: 'complete'
};

// Trial states
export const TrialState = {
  WAITING_FOR_START: 'waiting_for_start',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// ---------------------------------------------------------------------------
// Target radius sweep
// ---------------------------------------------------------------------------
// Each base tunnel condition below is expanded into 6 trials: each ratio
// appears twice, in an order that's shuffled independently per condition so
// radius order doesn't correlate with learning/fatigue across the session.
const TARGET_RADIUS_RATIOS = [0.25, 0.375, 0.5];
const REPS_PER_RATIO = 2; // 3 ratios x 2 reps = 6 trials per base condition

const shuffle = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const buildShuffledRatioSequence = () => {
  const seq = [];
  TARGET_RADIUS_RATIOS.forEach((ratio) => {
    for (let i = 0; i < REPS_PER_RATIO; i++) seq.push(ratio);
  });
  return shuffle(seq);
};

// Expands one base condition (width/curvature/etc. untouched) into 6 trials
// with varying target radius. Radius is computed relative to the width at
// the tunnel's target end (segment2Width for wide_to_narrow, tunnelWidth
// otherwise) — confirm this is the ID-manipulation your instructor wants;
// it's the most natural reading of "radii ratios" but worth a sanity check.
const expandWithRadiusSweep = (baseCondition) => {
  const referenceWidth = baseCondition.segment2Width ?? baseCondition.tunnelWidth ?? 0.02;
  const ratioSequence = buildShuffledRatioSequence();

  return ratioSequence.map((ratio, index) => ({
    ...baseCondition,
    id: 1000 + baseCondition.id * 10 + index + 1, // namespaced, won't collide with lasso/menu ids
    groupId: baseCondition.id, // NEW: all 6 radius trials from one width/type stay grouped together
    repetitions: 1, // each entry IS one trial now; sweep replaces the old repeat-in-place mechanism
    targetRadiusRatio: ratio,
    targetRadius: referenceWidth * ratio,
    description: `${baseCondition.description}, target ratio ${ratio}`
  }));
};

const expandAll = (conditions) => conditions.flatMap(expandWithRadiusSweep);

// Original 28 tunnel conditions — width/curvature sweep unchanged from before.
const BASE_BASIC_CONDITIONS = [
  { id: 1, tunnelWidth: 0.01, curvature: 0.025, description: "sinusoidal, width 0.01" },
  { id: 2, tunnelWidth: 0.02, curvature: 0.025, description: "sinusoidal, width 0.02" },
  { id: 3, tunnelWidth: 0.03, curvature: 0.025, description: "sinusoidal, width 0.03" },
  { id: 4, tunnelWidth: 0.04, curvature: 0.025, description: "sinusoidal, width 0.04" },
  { id: 5, tunnelWidth: 0.05, curvature: 0.025, description: "sinusoidal, width 0.05" },

  { id: 6, tunnelType: 'corner', tunnelWidth: 0.01, numCorners: 2, cornerOffset: 0.1, description: "corner, width 0.01" },
  { id: 7, tunnelType: 'corner', tunnelWidth: 0.02, numCorners: 2, cornerOffset: 0.1, description: "corner, width 0.02" },
  { id: 8, tunnelType: 'corner', tunnelWidth: 0.03, numCorners: 2, cornerOffset: 0.1, description: "corner, width 0.03" },
  { id: 9, tunnelType: 'corner', tunnelWidth: 0.04, numCorners: 2, cornerOffset: 0.1, description: "corner, width 0.04" },
  { id: 10, tunnelType: 'corner', tunnelWidth: 0.05, numCorners: 2, cornerOffset: 0.1, description: "corner, width 0.05" },

  { id: 11, tunnelType: 'straight', tunnelWidth: 0.01, curvature: 0, description: "straight, width 0.01" },
  { id: 12, tunnelType: 'straight', tunnelWidth: 0.02, curvature: 0, description: "straight, width 0.02" },
  { id: 13, tunnelType: 'straight', tunnelWidth: 0.03, curvature: 0, description: "straight, width 0.03" },
  { id: 14, tunnelType: 'straight', tunnelWidth: 0.04, curvature: 0, description: "straight, width 0.04" },
  { id: 15, tunnelType: 'straight', tunnelWidth: 0.05, curvature: 0, description: "straight, width 0.05" },

  { id: 16, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.01, curvature: 0.015, description: "gentle sinusoidal, width 0.01" },
  { id: 17, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.02, curvature: 0.015, description: "gentle sinusoidal, width 0.02" },
  { id: 18, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.03, curvature: 0.015, description: "gentle sinusoidal, width 0.03" },
  { id: 19, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.04, curvature: 0.015, description: "gentle sinusoidal, width 0.04" },
  { id: 20, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.05, curvature: 0.015, description: "gentle sinusoidal, width 0.05" },

  { id: 21, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.01, curvature: 0.05, description: "sharp sinusoidal, width 0.01" },
  { id: 22, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.02, curvature: 0.05, description: "sharp sinusoidal, width 0.02" },
  { id: 23, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.03, curvature: 0.05, description: "sharp sinusoidal, width 0.03" },
  { id: 24, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.04, curvature: 0.05, description: "sharp sinusoidal, width 0.04" },
  { id: 25, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.05, curvature: 0.05, description: "sharp sinusoidal, width 0.05" },

  { id: 26, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.01, description: "wide-to-narrow, narrow=0.01" },
  { id: 27, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.02, description: "wide-to-narrow, narrow=0.02" },
  { id: 28, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.03, description: "wide-to-narrow, narrow=0.03" },
];

// 28 base conditions x 6 radius trials each = 168 total trials.
// NOTE: this is ~35% more trials than the original 124 — flagged below,
// confirm session length is acceptable.
export const BASIC_CONDITIONS = expandAll(BASE_BASIC_CONDITIONS);

// ---------------------------------------------------------------------------
// Lasso / cascading menu — kept intact, just not run right now.
// To bring a task back later: export it from its *_DATA array below instead
// of `[]`.
// ---------------------------------------------------------------------------
const LASSO_CONDITIONS_DATA = [
  {
    id: 101,
    tunnelType: 'lasso',
    grid_layout: [
      ". . . . . . . . .",
      ". X X . . . . . .",
      ". X X X X X X X .",
      ". X X X X X X X .",
      ". . . . . . . . ."
    ],
    icon_radius: 0.015,
    icon_spacing: 0.035,
    grid_origin: [0.1, 0.05],
    timeLimit: null,
    description: "L-shaped target cluster, medium spacing"
  },
  {
    id: 102,
    tunnelType: 'lasso',
    grid_layout: [
      ". . . . . . . . .",
      ". X X . . . . . .",
      ". X X X X X X X .",
      ". X X X X X X X .",
      ". . . . . . . . ."
    ],
    icon_radius: 0.013,
    icon_spacing: 0.036,
    grid_origin: [0.1, 0.05],
    timeLimit: null,
    description: "L-shaped target cluster, medium spacing"
  },
  {
    id: 103,
    tunnelType: 'lasso',
    grid_layout: [
      ". . . . . . . . .",
      ". X X . . . . . .",
      ". X X X X X X X .",
      ". X X X X X X X .",
      ". . . . . . . . ."
    ],
    icon_radius: 0.014,
    icon_spacing: 0.0355,
    grid_origin: [0.1, 0.05],
    timeLimit: null,
    description: "L-shaped target cluster, medium spacing"
  },
];

const CASCADING_MENU_CONDITIONS_DATA = [
  {
    id: 201, tunnelType: 'cascading_menu', mainMenuSize: 12, subMenuSize: 12,
    targetMainMenuIndex: 5, targetSubMenuIndex: 11,
    mainMenuWindowSize: [0.12, 0.12], subMenuWindowSize: [0.1, 0.12],
    mainMenuOrigin: [0.1, 0.02], timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 202, tunnelType: 'cascading_menu', mainMenuSize: 12, subMenuSize: 12,
    targetMainMenuIndex: 5, targetSubMenuIndex: 5,
    mainMenuWindowSize: [0.12, 0.12], subMenuWindowSize: [0.1, 0.12],
    mainMenuOrigin: [0.1, 0.02], timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 203, tunnelType: 'cascading_menu', mainMenuSize: 8, subMenuSize: 8,
    targetMainMenuIndex: 3, targetSubMenuIndex: 7,
    mainMenuWindowSize: [0.12, 0.12], subMenuWindowSize: [0.12, 0.12],
    mainMenuOrigin: [0.1, 0.01], timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 204, tunnelType: 'cascading_menu', mainMenuSize: 8, subMenuSize: 8,
    targetMainMenuIndex: 3, targetSubMenuIndex: 3,
    mainMenuWindowSize: [0.12, 0.12], subMenuWindowSize: [0.12, 0.12],
    mainMenuOrigin: [0.1, 0.01], timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 205, tunnelType: 'cascading_menu', mainMenuSize: 4, subMenuSize: 4,
    targetMainMenuIndex: 1, targetSubMenuIndex: 3,
    mainMenuWindowSize: [0.12, 0.12], subMenuWindowSize: [0.12, 0.12],
    mainMenuOrigin: [0.1, 0.02], timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 206, tunnelType: 'cascading_menu', mainMenuSize: 4, subMenuSize: 4,
    targetMainMenuIndex: 1, targetSubMenuIndex: 1,
    mainMenuWindowSize: [0.12, 0.12], subMenuWindowSize: [0.12, 0.12],
    mainMenuOrigin: [0.1, 0.02], timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
];

// Active exports — empty for now, per your request to skip without deleting.
export const LASSO_CONDITIONS = [];
export const CASCADING_MENU_CONDITIONS = [];

// Temporary empty arrays to prevent import errors
export const TIME_CONDITIONS = [];
export const SEQUENTIAL_CONDITIONS = [];
export const SEQUENTIAL_TIME_CONDITIONS = [];

// Canvas dimensions (see canvasSize.js for the actual calculation used at runtime)
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 260;
export const SCALE = 1000;

// Trial constants
export const START_BUTTON_RADIUS = 0.008;
export const TARGET_RADIUS = 0.01; // fallback default for lasso/menu/anything without a per-trial radius
export const TUNNEL_STEP = 0.001;
export const BASIC_TRIAL_REPETITIONS = 3; // unused fallback now that all BASIC_CONDITIONS set repetitions:1 explicitly
export const LASSO_TRIAL_REPETITIONS = 3;
export const CASCADING_MENU_TRIAL_REPETITIONS = 3;