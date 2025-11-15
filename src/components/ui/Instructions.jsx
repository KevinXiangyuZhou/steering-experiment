import React from 'react';

export const Instructions = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
        <h2 className="text-2xl font-bold text-red-600 mb-6">Task Instructions (Please read carefully):</h2>
        <ul className="space-y-3 mb-6">
          <li>Click the green START button to begin each trial</li>
          <li>Navigate through the tunnel to reach the red target</li>
          <li>Do NOT stop once you begin the trial</li>
          <li>Move as smoothly and accurately as possible</li>
          <li>Press R to restart the current trial at anytime if needed</li>
        </ul>
        <p className="mb-4">You will start with a practice trial to get familiar with the controls and task.</p>
        <p className="font-semibold">Press 'SPACEBAR' to start practice</p>
      </div>
    </div>
  );
};

