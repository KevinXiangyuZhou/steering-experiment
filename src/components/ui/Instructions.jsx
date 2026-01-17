import React from 'react';

export const Instructions = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight text-center">Study 1 (approximately 3 minutes)</h1>
        <h2 className="text-3xl font-bold text-red-600 mb-6 tracking-tight">Task Instructions (Please read carefully):</h2>
        <ul className="space-y-3 mb-6 text-base leading-relaxed">
          <li>Click the green START button to begin each trial</li>
          <li>Navigate through the tunnel to reach the red target</li>
          <li><b>Keep moving</b> once you clicked start button - do NOT STOP after clicking the start button</li>
          <li>To keep recorded trace clean, press <b>R</b> to restart if stopped or interrupted</li>
          <li>Try your best to move smoothly and accurately</li>
        </ul>
        <p className="mb-4 text-base leading-relaxed">You will start with a practice trial to get familiar with the controls and task.</p>
        <p className="font-semibold text-lg text-gray-800">Press <kbd className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-base font-mono font-bold">SPACEBAR</kbd> to start practice</p>
      </div>
    </div>
  );
};

