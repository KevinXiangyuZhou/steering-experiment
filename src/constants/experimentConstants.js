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

// Practice/tutorial condition — kept deliberately easy (wide straight tunnel, large target) so
// first-time participants learn the controls without also fighting a hard trial. Separate from
// BASIC_CONDITIONS so it never overlaps with (or silently removes) a real main-trial condition.
export const PRACTICE_CONDITION = {
  tunnelType: 'straight',
  tunnelWidth: 0.05,
  curvature: 0,
  radiusRatio: 0.5, // -> target radius 0.025 (25mm), matching 0.5 * tunnelWidth
  repetitions: 1,
  timeLimit: null,
  description: "practice: straight tunnel, width 50mm, target radius 25mm"
};

// Nominal tunnel length shared by every path generator (generateTunnelPath/
// generateSequentialTunnelPath both default startX=0, endX=0.46). Used as the reference distance
// (Fitts'-law amplitude) for unconstrained_pointing / constrained_to_unconstrained below.
const D = 0.46;

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

  // Straight tunnels — target radius sweep: 3 radius ratios (0.25/0.375/0.5 × tunnelWidth), each
  // repeated twice, per width. 5 widths × 3 ratio-entries = 15 entries (each repetitions: 2).
  { id: 11, tunnelType: 'straight', tunnelWidth: 0.01, curvature: 0, radiusRatio: 0.25, repetitions: 2, timeLimit: null, description: "straight, width 0.01, ratio 0.25" },
  { id: 12, tunnelType: 'straight', tunnelWidth: 0.01, curvature: 0, radiusRatio: 0.375, repetitions: 2, timeLimit: null, description: "straight, width 0.01, ratio 0.375" },
  { id: 13, tunnelType: 'straight', tunnelWidth: 0.01, curvature: 0, radiusRatio: 0.5, repetitions: 2, timeLimit: null, description: "straight, width 0.01, ratio 0.5" },
  { id: 14, tunnelType: 'straight', tunnelWidth: 0.02, curvature: 0, radiusRatio: 0.25, repetitions: 2, timeLimit: null, description: "straight, width 0.02, ratio 0.25" },
  { id: 15, tunnelType: 'straight', tunnelWidth: 0.02, curvature: 0, radiusRatio: 0.375, repetitions: 2, timeLimit: null, description: "straight, width 0.02, ratio 0.375" },
  { id: 16, tunnelType: 'straight', tunnelWidth: 0.02, curvature: 0, radiusRatio: 0.5, repetitions: 2, timeLimit: null, description: "straight, width 0.02, ratio 0.5" },
  { id: 17, tunnelType: 'straight', tunnelWidth: 0.03, curvature: 0, radiusRatio: 0.25, repetitions: 2, timeLimit: null, description: "straight, width 0.03, ratio 0.25" },
  { id: 18, tunnelType: 'straight', tunnelWidth: 0.03, curvature: 0, radiusRatio: 0.375, repetitions: 2, timeLimit: null, description: "straight, width 0.03, ratio 0.375" },
  { id: 19, tunnelType: 'straight', tunnelWidth: 0.03, curvature: 0, radiusRatio: 0.5, repetitions: 2, timeLimit: null, description: "straight, width 0.03, ratio 0.5" },
  { id: 20, tunnelType: 'straight', tunnelWidth: 0.04, curvature: 0, radiusRatio: 0.25, repetitions: 2, timeLimit: null, description: "straight, width 0.04, ratio 0.25" },
  { id: 21, tunnelType: 'straight', tunnelWidth: 0.04, curvature: 0, radiusRatio: 0.375, repetitions: 2, timeLimit: null, description: "straight, width 0.04, ratio 0.375" },
  { id: 22, tunnelType: 'straight', tunnelWidth: 0.04, curvature: 0, radiusRatio: 0.5, repetitions: 2, timeLimit: null, description: "straight, width 0.04, ratio 0.5" },
  { id: 23, tunnelType: 'straight', tunnelWidth: 0.05, curvature: 0, radiusRatio: 0.25, repetitions: 2, timeLimit: null, description: "straight, width 0.05, ratio 0.25" },
  { id: 24, tunnelType: 'straight', tunnelWidth: 0.05, curvature: 0, radiusRatio: 0.375, repetitions: 2, timeLimit: null, description: "straight, width 0.05, ratio 0.375" },
  { id: 25, tunnelType: 'straight', tunnelWidth: 0.05, curvature: 0, radiusRatio: 0.5, repetitions: 2, timeLimit: null, description: "straight, width 0.05, ratio 0.5" },

  // Gentle sinusoidal tunnels (lower curvature 0.015, 5 reps each) — 5 widths × 5 reps = 25 trials
  { id: 26, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.01, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.01" },
  { id: 27, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.02, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.02" },
  { id: 28, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.03, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.03" },
  { id: 29, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.04, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.04" },
  { id: 30, tunnelType: 'gentle_sinusoidal', tunnelWidth: 0.05, curvature: 0.015, repetitions: 5, timeLimit: null, description: "gentle sinusoidal, width 0.05" },

  // Sharp sinusoidal tunnels (higher curvature 0.05, 5 reps each) — 5 widths × 5 reps = 25 trials
  { id: 31, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.01, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.01" },
  { id: 32, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.02, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.02" },
  { id: 33, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.03, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.03" },
  { id: 34, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.04, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.04" },
  { id: 35, tunnelType: 'sharp_sinusoidal', tunnelWidth: 0.05, curvature: 0.05, repetitions: 5, timeLimit: null, description: "sharp sinusoidal, width 0.05" },

  // Wide-to-narrow tunnels (wide fixed at 0.05, 2 reps each) — 3 narrow widths × 2 reps = 6 trials
  { id: 36, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.01, repetitions: 2, timeLimit: null, description: "wide-to-narrow, narrow=0.01" },
  { id: 37, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.02, repetitions: 2, timeLimit: null, description: "wide-to-narrow, narrow=0.02" },
  { id: 38, tunnelType: 'wide_to_narrow', segment1Width: 0.05, segment2Width: 0.03, repetitions: 2, timeLimit: null, description: "wide-to-narrow, narrow=0.03" },

  // Narrow-to-wide tunnels (mirror of wide-to-narrow: narrow segment1 varies, wide segment2 fixed
  // at 0.05, 2 reps each) — 3 narrow widths × 2 reps = 6 trials
  { id: 39, tunnelType: 'narrow_to_wide', segment1Width: 0.01, segment2Width: 0.05, repetitions: 2, timeLimit: null, description: "narrow-to-wide, narrow=0.01" },
  { id: 40, tunnelType: 'narrow_to_wide', segment1Width: 0.02, segment2Width: 0.05, repetitions: 2, timeLimit: null, description: "narrow-to-wide, narrow=0.02" },
  { id: 41, tunnelType: 'narrow_to_wide', segment1Width: 0.03, segment2Width: 0.05, repetitions: 2, timeLimit: null, description: "narrow-to-wide, narrow=0.03" },

  // Unconstrained pointing (no tunnel; main variation is distance — D/3, 2D/3, D — for direct
  // Fitts'-law comparison; target radius swept 5-25mm, 2 reps each). Target position (top/middle/
  // bottom) is NOT a crossed factor here — it's assigned at runtime (see trialManager.js
  // assignTargetPositions), evenly split 1/3 each, so it can't confound the distance/radius
  // comparisons without tripling the trial count. 3 distances × 5 radii × 2 reps = 30 trials.
  { id: 42, tunnelType: 'unconstrained_pointing', distance: D / 3, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D/3, radius 5mm" },
  { id: 43, tunnelType: 'unconstrained_pointing', distance: D / 3, targetRadius: 0.01, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D/3, radius 10mm" },
  { id: 44, tunnelType: 'unconstrained_pointing', distance: D / 3, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D/3, radius 15mm" },
  { id: 45, tunnelType: 'unconstrained_pointing', distance: D / 3, targetRadius: 0.02, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D/3, radius 20mm" },
  { id: 46, tunnelType: 'unconstrained_pointing', distance: D / 3, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D/3, radius 25mm" },
  { id: 47, tunnelType: 'unconstrained_pointing', distance: 2 * D / 3, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance 2D/3, radius 5mm" },
  { id: 48, tunnelType: 'unconstrained_pointing', distance: 2 * D / 3, targetRadius: 0.01, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance 2D/3, radius 10mm" },
  { id: 49, tunnelType: 'unconstrained_pointing', distance: 2 * D / 3, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance 2D/3, radius 15mm" },
  { id: 50, tunnelType: 'unconstrained_pointing', distance: 2 * D / 3, targetRadius: 0.02, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance 2D/3, radius 20mm" },
  { id: 51, tunnelType: 'unconstrained_pointing', distance: 2 * D / 3, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance 2D/3, radius 25mm" },
  { id: 52, tunnelType: 'unconstrained_pointing', distance: D, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D, radius 5mm" },
  { id: 53, tunnelType: 'unconstrained_pointing', distance: D, targetRadius: 0.01, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D, radius 10mm" },
  { id: 54, tunnelType: 'unconstrained_pointing', distance: D, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D, radius 15mm" },
  { id: 55, tunnelType: 'unconstrained_pointing', distance: D, targetRadius: 0.02, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D, radius 20mm" },
  { id: 56, tunnelType: 'unconstrained_pointing', distance: D, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "unconstrained pointing, distance D, radius 25mm" },

  // Constrained-to-unconstrained pointing (first half: narrow corridor, width swept 10/30/50mm;
  // second half: open, main variation is distance — 4D/6, 5D/6, D — target radius swept 5/15/25mm,
  // 2 reps each). Target position is assigned at runtime the same way as unconstrained_pointing
  // above, not crossed. 3 widths × 3 distances × 3 radii × 2 reps = 54 trials.
  { id: 57, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: 4 * D / 6, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance 4D/6, radius 5mm" },
  { id: 58, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: 4 * D / 6, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance 4D/6, radius 15mm" },
  { id: 59, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: 4 * D / 6, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance 4D/6, radius 25mm" },
  { id: 60, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: 5 * D / 6, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance 5D/6, radius 5mm" },
  { id: 61, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: 5 * D / 6, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance 5D/6, radius 15mm" },
  { id: 62, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: 5 * D / 6, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance 5D/6, radius 25mm" },
  { id: 63, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: D, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance D, radius 5mm" },
  { id: 64, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: D, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance D, radius 15mm" },
  { id: 65, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.01, distance: D, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.01, distance D, radius 25mm" },
  { id: 66, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: 4 * D / 6, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance 4D/6, radius 5mm" },
  { id: 67, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: 4 * D / 6, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance 4D/6, radius 15mm" },
  { id: 68, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: 4 * D / 6, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance 4D/6, radius 25mm" },
  { id: 69, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: 5 * D / 6, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance 5D/6, radius 5mm" },
  { id: 70, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: 5 * D / 6, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance 5D/6, radius 15mm" },
  { id: 71, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: 5 * D / 6, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance 5D/6, radius 25mm" },
  { id: 72, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: D, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance D, radius 5mm" },
  { id: 73, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: D, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance D, radius 15mm" },
  { id: 74, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.03, distance: D, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.03, distance D, radius 25mm" },
  { id: 75, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: 4 * D / 6, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance 4D/6, radius 5mm" },
  { id: 76, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: 4 * D / 6, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance 4D/6, radius 15mm" },
  { id: 77, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: 4 * D / 6, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance 4D/6, radius 25mm" },
  { id: 78, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: 5 * D / 6, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance 5D/6, radius 5mm" },
  { id: 79, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: 5 * D / 6, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance 5D/6, radius 15mm" },
  { id: 80, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: 5 * D / 6, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance 5D/6, radius 25mm" },
  { id: 81, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: D, targetRadius: 0.005, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance D, radius 5mm" },
  { id: 82, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: D, targetRadius: 0.015, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance D, radius 15mm" },
  { id: 83, tunnelType: 'constrained_to_unconstrained', segment1Width: 0.05, distance: D, targetRadius: 0.025, repetitions: 2, timeLimit: null, description: "constrained-to-unconstrained, width 0.05, distance D, radius 25mm" },
];

// y-coordinates for the 3 target positions used by unconstrained_pointing and
// constrained_to_unconstrained (canvas center y = 0.13, height = 0.26)
export const TARGET_POSITION_Y = {
  top: 0.05,
  middle: 0.13,
  bottom: 0.21
};

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


// Temporarily commented out - Lasso selection trial conditions
// export const LASSO_CONDITIONS = [
//   {
//     id: 101,
//     tunnelType: 'lasso',
//     grid_layout: [
//       ". . . . . . . . .",
//       ". X X . . . . . .",
//       ". X X X X X X X .",
//       ". X X X X X X X .",
//       ". . . . . . . . ."
//     ],
//     icon_radius: 0.015,
//     icon_spacing: 0.035,
//     grid_origin: [0.1, 0.05],
//     timeLimit: null,
//     description: "L-shaped target cluster, medium spacing"
//   },
//   {
//     id: 102,
//     tunnelType: 'lasso',
//     grid_layout: [
//       ". . . . . . . . .",
//       ". X X . . . . . .",
//       ". X X X X X X X .",
//       ". X X X X X X X .",
//       ". . . . . . . . ."
//     ],
//     icon_radius: 0.013,
//     icon_spacing: 0.036,
//     grid_origin: [0.1, 0.05],
//     timeLimit: null,
//     description: "L-shaped target cluster, medium spacing"
//   },
//   {
//     id: 103,
//     tunnelType: 'lasso',
//     grid_layout: [
//       ". . . . . . . . .",
//       ". X X . . . . . .",
//       ". X X X X X X X .",
//       ". X X X X X X X .",
//       ". . . . . . . . ."
//     ],
//     icon_radius: 0.014,
//     icon_spacing: 0.0355,
//     grid_origin: [0.1, 0.05],
//     timeLimit: null,
//     description: "L-shaped target cluster, medium spacing"
//   },
//   
//   
//   
// ];
//
// Temporarily commented out - Cascading menu trial conditions
// export const CASCADING_MENU_CONDITIONS = [
//   {
//     id: 201,
//     tunnelType: 'cascading_menu',
//     mainMenuSize: 12,
//     subMenuSize: 12,
//     targetMainMenuIndex: 5, // 0-indexed, so this is the 3rd item
//     targetSubMenuIndex: 11, // 0-indexed, so this is the 2nd item in submenu
//     mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
//     subMenuWindowSize: [0.1, 0.12], // [width, height] of submenu window
//     mainMenuOrigin: [0.1, 0.02], // Origin of main menu (top-left corner)
//     timeLimit: null,
//     description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
//   },
//   {
//     id: 202,
//     tunnelType: 'cascading_menu',
//     mainMenuSize: 12,
//     subMenuSize: 12,
//     targetMainMenuIndex: 5, // 0-indexed, so this is the 3rd item
//     targetSubMenuIndex: 5, // 0-indexed, so this is the 2nd item in submenu
//     mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
//     subMenuWindowSize: [0.1, 0.12], // [width, height] of submenu window
//     mainMenuOrigin: [0.1, 0.02], // Origin of main menu (top-left corner)
//     timeLimit: null,
//     description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
//   },
//   {
//     id: 203,
//     tunnelType: 'cascading_menu',
//     mainMenuSize:8,
//     subMenuSize: 8,
//     targetMainMenuIndex: 3, // 0-indexed, so this is the 3rd item
//     targetSubMenuIndex: 7, // 0-indexed, so this is the 2nd item in submenu
//     mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
//     subMenuWindowSize: [0.12, 0.12], // [width, height] of submenu window
//     mainMenuOrigin: [0.1, 0.01], // Origin of main menu (top-left corner)
//     timeLimit: null,
//     description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
//   },
//   {
//     id: 204,
//     tunnelType: 'cascading_menu',
//     mainMenuSize:8,
//     subMenuSize: 8,
//     targetMainMenuIndex: 3, // 0-indexed, so this is the 3rd item
//     targetSubMenuIndex: 3, // 0-indexed, so this is the 2nd item in submenu
//     mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
//     subMenuWindowSize: [0.12, 0.12], // [width, height] of submenu window
//     mainMenuOrigin: [0.1, 0.01], // Origin of main menu (top-left corner)
//     timeLimit: null,
//     description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
//   },
//   {
//     id: 205,
//     tunnelType: 'cascading_menu',
//     mainMenuSize: 4,
//     subMenuSize: 4,
//     targetMainMenuIndex: 1, // 0-indexed, so this is the 3rd item
//     targetSubMenuIndex: 3, // 0-indexed, so this is the 2nd item in submenu
//     mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
//     subMenuWindowSize: [0.12, 0.12], // [width, height] of submenu window
//     mainMenuOrigin: [0.1, 0.02], // Origin of main menu (top-left corner)
//     timeLimit: null,
//     description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
//   },
//   {
//     id: 206,
//     tunnelType: 'cascading_menu',
//     mainMenuSize: 4,
//     subMenuSize: 4,
//     targetMainMenuIndex: 1, // 0-indexed, so this is the 3rd item
//     targetSubMenuIndex: 1, // 0-indexed, so this is the 2nd item in submenu
//     mainMenuWindowSize: [0.12, 0.12], // [width, height] of main menu window
//     subMenuWindowSize: [0.12, 0.12], // [width, height] of submenu window
//     mainMenuOrigin: [0.1, 0.02], // Origin of main menu (top-left corner)
//     timeLimit: null,
//     description: "5-item main menu, 4-item submenu, target at main[2] sub[1]"
//   },
// ];

// Temporary empty arrays to prevent import errors
export const TIME_CONDITIONS = [];
export const SEQUENTIAL_CONDITIONS = [];
export const SEQUENTIAL_TIME_CONDITIONS = [];
export const LASSO_CONDITIONS = [];
export const CASCADING_MENU_CONDITIONS = [];

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

