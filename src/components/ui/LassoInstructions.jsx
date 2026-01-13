import React from 'react';

export const LassoInstructions = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight text-center"> Study 2 (approximately 4 minutes) - Lasso Selection Tasks</h1>
        <h2 className="text-3xl font-bold text-red-600 mb-6 tracking-tight">Task Instructions</h2>
        <ul className="space-y-3 mb-6 text-base leading-relaxed">
          <li>Click the <b>green START button</b> to begin each trial</li>
          <li>Draw the loop clockwise around the all yellow targets to "select" these targets and then stop at the red dot</li>
          <li><b>Keep moving</b> once you begin - don't stop</li>
          <li>Move smoothly and accurately</li>
          <li>Going too close to the targets or the distractors will cause the trial to fail</li>
          <li>Press <b>R</b> to restart if interrupted</li>
        </ul>
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-base leading-relaxed">
          </p>
        </div>
        <p className="font-semibold text-lg text-gray-800">Press <kbd className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-base font-mono font-bold">SPACEBAR</kbd> to begin</p>
      </div>
    </div>
  );
};
