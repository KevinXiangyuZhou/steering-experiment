import React from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TrialState, ExperimentPhase } from '../../constants/experimentConstants.js';

export const TrialCanvas = ({
  canvasRef,
  phase,
  trialState,
  timeLimit,
  timeRemaining,
  failedDueToTimeout,
  shouldEnforceBoundaries,
  onMouseClick,
  onMouseMove,
  renderStatus,
  renderControls
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Time bar container - always reserve space when in time-related phases */}
        <div className="mb-4 w-full max-w-md mx-auto">
          {phase === ExperimentPhase.TIME_TRIAL_PRACTICE && timeLimit && (
            <div style={{width: '100%'}}>
              {/* Timer bar background */}
              <div style={{
                width: '100%', 
                height: '32px', 
                backgroundColor: '#d1d5db', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                marginBottom: '8px', 
                position: 'relative'
              }}>
                {/* Timer bar fill */}
                <div
                  style={{ 
                    height: '100%',
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    transition: 'all 0.1s',
                    backgroundColor: trialState !== TrialState.IN_PROGRESS
                      ? '#10b981'  // green-500
                      : (timeRemaining / timeLimit) > 0.2
                      ? '#f59e0b'  // yellow-500
                      : '#ef4444', // red-500
                    width: `${
                      trialState !== TrialState.IN_PROGRESS
                        ? 100 
                        : Math.max(0, (timeRemaining / timeLimit) * 100)
                    }%` 
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={onMouseClick}
          onMouseMove={onMouseMove}
          className="border border-gray-300 cursor-crosshair"
        />
        
        {/* Simple status and control information */}
        <div className="mt-4 text-center">
          {renderStatus()}
          {renderControls()}
        </div>
      </div>
      
      {/* Failure overlay */}
      {trialState === TrialState.FAILED && (phase === ExperimentPhase.TIME_TRIALS || phase === ExperimentPhase.SEQUENTIAL_TIME_TRIALS || phase === ExperimentPhase.TIME_TRIAL_PRACTICE) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <h3 className="text-xl font-bold mb-4 text-red-600">
              {failedDueToTimeout ? "TIME'S UP!" : "TRIAL FAILED"}
            </h3>
            <p className="mb-4">
              {failedDueToTimeout 
                ? "You ran out of time. Try to move faster."
                : shouldEnforceBoundaries()
                ? "You went outside the tunnel boundary, please retry the trial."
                : "Complete the task to advance."
              }
            </p>
            <p className="text-sm text-gray-600">Press R to restart trial</p>
          </div>
        </div>
      )}
    </div>
  );
};

