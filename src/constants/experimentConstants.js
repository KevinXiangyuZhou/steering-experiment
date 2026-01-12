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

// Trial conditions
export const BASIC_CONDITIONS = [
  { id: 1, tunnelWidth: 0.02, curvature: 0.025, timeLimit: null, description: "narrow tunnel, gentle curve" },
  // { id: 2, tunnelWidth: 0.04, curvature: 0.025, timeLimit: null, description: "narrow tunnel, sharp curve" },
  // { id: 3, tunnelType: 'corner', tunnelWidth: 0.02, numCorners: 2, cornerOffset: 0.1, timeLimit: null, description: "narrow tunnel, 2 corners" },
  // { id: 4, tunnelType: 'corner', tunnelWidth: 0.04, numCorners: 2, cornerOffset: 0.1, timeLimit: null, description: "narrow tunnel, 3 corners" },
  // { id: 7, tunnelType: 'corner', tunnelWidth: 0.05, numCorners: 2, cornerOffset: 0.05, timeLimit: null, description: "wide tunnel, 2 corners" },
  // { id: 8, tunnelType: 'corner', tunnelWidth: 0.05, numCorners: 3, cornerOffset: 0.05, timeLimit: null, description: "wide tunnel, 3 corners" },
];

// Temporarily commented out
// export const TIME_CONDITIONS = [
//   { id: 11, tunnelWidth: 0.05, curvature: 0.025, timeLimit: 4, description: "wide tunnel, gentle curve time limit 4s" },
//   { id: 12, tunnelWidth: 0.05, curvature: 0.05, timeLimit: 4, description: "wide tunnel, sharp curve time limit 4s" },
//   { id: 13, tunnelWidth: 0.02, curvature: 0.025, timeLimit: 4, description: "narrow tunnel, gentle curve time limit 4s" },
//   { id: 14, tunnelWidth: 0.02, curvature: 0.05, timeLimit: 4, description: "narrow tunnel, sharp curve time limit 4s" },
//   { id: 15, tunnelWidth: 0.05, curvature: 0.025, timeLimit: 2, description: "wide tunnel, gentle curve time limit 2s" },
//   { id: 16, tunnelWidth: 0.05, curvature: 0.05, timeLimit: 2, description: "wide tunnel, sharp curve time limit 2s" },
//   { id: 17, tunnelWidth: 0.02, curvature: 0.025, timeLimit: 2, description: "narrow tunnel, gentle curve time limit 2s" },
//   { id: 18, tunnelWidth: 0.02, curvature: 0.05, timeLimit: 2, description: "narrow tunnel, sharp curve time limit 2s" },
// ];

// Temporarily commented out - Sequential tunnel conditions (2 segments)
// export const SEQUENTIAL_CONDITIONS = [
//   // Wide-to-narrow trials
//   { id: 5, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.08, segment2Width: 0.01, timeLimit: null, description: "narrow-to-wide segments" },
//   { id: 6, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.01, segment2Width: 0.08, timeLimit: null, description: "wide-to-narrow segments" },
//   
//   // Straight-to-curved trials
//   { id: 7, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.02, segment2Width: 0.02, segment1Curvature: 0, segment2Curvature: 0.05, timeLimit: null, description: "straight-to-curved segments" },
//   { id: 8, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.05, segment2Width: 0.05, segment1Curvature: 0, segment2Curvature: 0.05, timeLimit: null, description: "straight-to-curved segments" },
// ];

// Temporarily commented out - Sequential tunnel time-constrained conditions
// export const SEQUENTIAL_TIME_CONDITIONS = [
//   // Wide-to-narrow trials with time limits
//   { id: 19, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.08, segment2Width: 0.01, timeLimit: 2, description: "narrow-to-wide segments time limit 2s" },
//   { id: 20, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.01, segment2Width: 0.08, timeLimit: 2, description: "wide-to-narrow segments time limit 2s" },
//   { id: 21, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.08, segment2Width: 0.01, timeLimit: 1, description: "narrow-to-wide segments time limit 1s" },
//   { id: 22, tunnelType: 'sequential', segmentType: 'width', segment1Width: 0.01, segment2Width: 0.08, timeLimit: 1, description: "wide-to-narrow segments time limit 1s" },
//   
//   // Straight-to-curved trials
//   { id: 23, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.02, segment2Width: 0.02, segment1Curvature: 2, segment2Curvature: 0.05, timeLimit: 2, description: "straight-to-curved segments time limit 2s" },
//   { id: 24, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.05, segment2Width: 0.05, segment1Curvature: 2, segment2Curvature: 0.05, timeLimit: 2, description: "straight-to-curved segments time limit 2s" },
//   { id: 25, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.02, segment2Width: 0.02, segment1Curvature: 1, segment2Curvature: 0.05, timeLimit: 1, description: "straight-to-curved segments time limit 1s" },
//   { id: 26, tunnelType: 'sequential', segmentType: 'curvature', segment1Width: 0.05, segment2Width: 0.05, segment1Curvature: 1, segment2Curvature: 0.05, timeLimit: 1, description: "straight-to-curved segments time limit 1s" },
// ];

// Lasso selection trial conditions
export const LASSO_CONDITIONS = [
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
      ". X X X X X X X ."
    ],
    icon_radius: 0.015,
    icon_spacing: 0.035,
    grid_origin: [0.1, 0.05],
    timeLimit: null,
    description: "L-shaped target cluster, medium spacing"
  },
  {
    id: 103,
    tunnelType: 'lasso',
    grid_layout: [
      "O O O O O O O O O",
      "O X X O O O O O O",
      "O X X X X X X X O",
      "O X X X X X X X O",
    ],
    icon_radius: 0.015,
    icon_spacing: 0.035,
    grid_origin: [0.1, 0.05],
    timeLimit: null,
    description: "L-shaped target cluster, medium spacing"
  },
  
];

// Temporary empty arrays to prevent import errors
export const TIME_CONDITIONS = [];
export const SEQUENTIAL_CONDITIONS = [];
export const SEQUENTIAL_TIME_CONDITIONS = [];

// Canvas dimensions
export const CANVAS_WIDTH = 460;
export const CANVAS_HEIGHT = 260;
export const SCALE = 1000;

// Trial constants
export const START_BUTTON_RADIUS = 0.008;
export const TARGET_RADIUS = 0.01;
export const TUNNEL_STEP = 0.001;
export const BASIC_TRIAL_REPETITIONS = 1; // Number of times to repeat each basic condition trial
export const LASSO_TRIAL_REPETITIONS = 1; // Number of times to repeat each lasso trial

