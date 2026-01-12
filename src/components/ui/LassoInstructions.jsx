import React from 'react';

export const LassoInstructions = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight text-center">Lasso Selection Tasks</h1>
        <h2 className="text-3xl font-bold text-red-600 mb-6 tracking-tight">Task Instructions (Please read carefully):</h2>
        <ul className="space-y-3 mb-6 text-base leading-relaxed">
          <li>You will see a grid with <b>yellow target squares</b> and grey distractor squares</li>
          <li>Your task is to draw a <b>closed loop</b> around all the yellow target squares</li>
          <li>Click the green START button to begin each trial</li>
          <li>Move your cursor to form a loop that <b>encloses all yellow targets</b></li>
          <li>The loop must be <b>closed</b> - you must return to where you started</li>
          <li>Do <b>NOT</b> stop once you begin the trial</li>
          <li>Move as smoothly and accurately as possible</li>
          <li>Press R to restart the current trial at anytime if needed</li>
        </ul>
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-base leading-relaxed">
            <b>Important:</b> You have complete freedom to draw your loop around the targets. 
            There are no tunnel boundaries - just draw a closed loop that encloses all yellow target squares.
          </p>
        </div>
        <p className="font-semibold text-lg text-gray-800">Press <kbd className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-base font-mono font-bold">SPACEBAR</kbd> to begin the lasso selection tasks</p>
      </div>
    </div>
  );
};
