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

// Trial conditions
export const BASIC_CONDITIONS = [
  // Sinusoidal tunnels (curvature 0.025, 5 reps each) — 5 widths × 5 reps = 25 trials
  { id: 1, tunnelWidth: 0.01, curvature: 0.025, repetitions: 5, timeLimit: null, description: "sinusoidal, width 0.01" },
  { id: 2, tunnelWidth: 0.02, curvature: 0.025, repetitions: 5, timeLimit: null, description: "sinusoidal, width 0.02" },
  { id: 3, tunnelWidth: 0.03, curvature: 0.025, repetitions: 5, timeLimit: null, description: "sinusoidal, width 0.03" },
  { id: 4, tunnelWidth: 0.04, curvature: 0.025, repetitions: 5, timeLimit: null, description: "sinusoidal, width 0.04" },
  { id: 5, tunnelWidth: 0.05, curvature: 0.025, repetitions: 5, timeLimit: null, description: "sinusoidal, width 0.05" },

  // Corner tunnels (2 corners, 5 reps each) — 5 widths × 5 reps = 25 trials
  { id: 6, tunnelType: 'corner', tunnelWidth: 0.01, numCorners: 2, cornerOffset: 0.1, repetitions: 5, timeLimit: null, description: "corner, width 0.01" },
  { id: 7, tunnelType: 'corner', tunnelWidth: 0.02, numCorners: 2, cornerOffset: 0.1, repetitions: 5, timeLimit: null, description: "corner, width 0.02" },
  { id: 8, tunnelType: 'corner', tunnelWidth: 0.03, numCorners: 2, cornerOffset: 0.1, repetitions: 5, timeLimit: null, description: "corner, width 0.03" },
  { id: 9, tunnelType: 'corner', tunnelWidth: 0.04, numCorners: 2, cornerOffset: 0.1, repetitions: 5, timeLimit: null, description: "corner, width 0.04" },
  { id: 10, tunnelType: 'corner', tunnelWidth: 0.05, numCorners: 2, cornerOffset: 0.1, repetitions: 5, timeLimit: null, description: "corner, width 0.05" },

  // Straight tunnels (3 reps each) — 5 widths × 3 reps = 15 trials
  { id: 11, tunnelType: 'straight', tunnelWidth: 0.01, curvature: 0, repetitions: 3, timeLimit: null, description: "straight, width 0.01" },
  { id: 12, tunnelType: 'straight', tunnelWidth: 0.02, curvature: 0, repetitions: 3, timeLimit: null, description: "straight, width 0.02" },
  { id: 13, tunnelType: 'straight', tunnelWidth: 0.03, curvature: 0, repetitions: 3, timeLimit: null, description: "straight, width 0.03" },
  { id: 14, tunnelType: 'straight', tunnelWidth: 0.04, curvature: 0, repetitions: 3, timeLimit: null, description: "straight, width 0.04" },
  { id: 15, tunnelType: 'straight', tunnelWidth: 0.05, curvature: 0, repetitions: 3, timeLimit: null, description: "straight, width 0.05" },

  // Gentle sinusoidal tunnels (lower curvature 0.015, 5 reps each) — 5 widths × 5 reps = 25 trials
  { id: 16, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.01, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.01" },
  { id: 17, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.02, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.02" },
  { id: 18, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.03, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.03" },
  { id: 19, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.04, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.04" },
  { id: 20, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.05, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.05" },

  // Sharp sinusoidal tunnels (higher curvature 0.05, 5 reps each) — 5 widths × 5 reps = 25 trials
  { id: 21, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.01, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.01" },
  { id: 22, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.02, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.02" },
  { id: 23, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.03, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.03" },
  { id: 24, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.04, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.04" },
  { id: 25, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.05, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.05" },

  // Wide-to-narrow tunnels (wide fixed at 0.05, 3 reps each) — 3 narrow widths × 3 reps = 9 trials
  { id: 26, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.01, repetitions: 3, timeLimit: null, description: "wide-to-narrow, narrow=0.01" },
  { id: 27, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.02, repetitions: 3, timeLimit: null, description: "wide-to-narrow, narrow=0.02" },
  { id: 28, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.03, repetitions: 3, timeLimit: null, description: "wide-to-narrow, narrow=0.03" },
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

// Cascading menu trial conditions
export const CASCADING_MENU_CONDITIONS = [
  {
    id: 201,
    tunnelType: 'cascading_menu',
    mainMenuSize: 12,
    subMenuSize: 12,
    targetMainMenuIndex: 5, // 0-indexed, so this is the 3rd item
    targetSubMenuIndex: 11, // 0-indexed, so this is the 2nd item in submenu
    mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
    subMenuWindowSize: [0.1, 0.12], // [width, height] of submenu window
    mainMenuOrigin: [0.1, 0.02], // Origin of main menu (top-left corner)
    timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 202,
    tunnelType: 'cascading_menu',
    mainMenuSize: 12,
    subMenuSize: 12,
    targetMainMenuIndex: 5, // 0-indexed, so this is the 3rd item
    targetSubMenuIndex: 5, // 0-indexed, so this is the 2nd item in submenu
    mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
    subMenuWindowSize: [0.1, 0.12], // [width, height] of submenu window
    mainMenuOrigin: [0.1, 0.02], // Origin of main menu (top-left corner)
    timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 203,
    tunnelType: 'cascading_menu',
    mainMenuSize:8,
    subMenuSize: 8,
    targetMainMenuIndex: 3, // 0-indexed, so this is the 3rd item
    targetSubMenuIndex: 7, // 0-indexed, so this is the 2nd item in submenu
    mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
    subMenuWindowSize: [0.12, 0.12], // [width, height] of submenu window
    mainMenuOrigin: [0.1, 0.01], // Origin of main menu (top-left corner)
    timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 204,
    tunnelType: 'cascading_menu',
    mainMenuSize:8,
    subMenuSize: 8,
    targetMainMenuIndex: 3, // 0-indexed, so this is the 3rd item
    targetSubMenuIndex: 3, // 0-indexed, so this is the 2nd item in submenu
    mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
    subMenuWindowSize: [0.12, 0.12], // [width, height] of submenu window
    mainMenuOrigin: [0.1, 0.01], // Origin of main menu (top-left corner)
    timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 205,
    tunnelType: 'cascading_menu',
    mainMenuSize: 4,
    subMenuSize: 4,
    targetMainMenuIndex: 1, // 0-indexed, so this is the 3rd item
    targetSubMenuIndex: 3, // 0-indexed, so this is the 2nd item in submenu
    mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
    subMenuWindowSize: [0.12, 0.12], // [width, height] of submenu window
    mainMenuOrigin: [0.1, 0.02], // Origin of main menu (top-left corner)
    timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
  },
  {
    id: 206,
    tunnelType: 'cascading_menu',
    mainMenuSize: 4,
    subMenuSize: 4,
    targetMainMenuIndex: 1, // 0-indexed, so this is the 3rd item
    targetSubMenuIndex: 1, // 0-indexed, so this is the 2nd item in submenu
    mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
    subMenuWindowSize: [0.12, 0.12], // [width, height] of submenu window
    mainMenuOrigin: [0.1, 0.02], // Origin of main menu (top-left corner)
    timeLimit: null,
    description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
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
export const BASIC_TRIAL_REPETITIONS = 3; // Number of times to repeat each basic condition trial
export const LASSO_TRIAL_REPETITIONS = 3; // Number of times to repeat each lasso trial
export const CASCADING_MENU_TRIAL_REPETITIONS = 3; // Number of times to repeat each cascading menu trial

