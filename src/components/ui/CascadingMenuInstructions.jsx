import React from 'react';

export const CascadingMenuInstructions = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight text-center">Study 3 (approximately 4 minutes) - Cascading Menu Tasks</h1>
        <h2 className="text-3xl font-bold text-purple-600 mb-6 tracking-tight">Task Instructions</h2>
        <ul className="space-y-3 mb-6 text-base leading-relaxed">
          <li>Click the <b>green START button</b> to begin each trial</li>
          <li>Move your cursor <b>vertically down the main menu</b> to the <b>red target item</b></li>
          <li>When you hover over the red target item, a <b>submenu will appear</b> to the right</li>
          <li>Move your cursor to the <b>red target item in the submenu</b> to complete the trial</li>
          <li>As before, try moving smoothly and accurately as possible</li>
          <li>Press <b>R</b> to restart if interrupted</li>
        </ul>
        <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-400">
          <p className="text-base leading-relaxed">
          </p>
        </div>
        <p className="font-semibold text-lg text-gray-800">Press <kbd className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-base font-mono font-bold">SPACEBAR</kbd> to begin</p>
      </div>
    </div>
  );
};
