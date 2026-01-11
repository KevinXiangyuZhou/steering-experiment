import React from 'react';

export const TimeConstraintIntro = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl">
        <h2 className="text-3xl font-bold text-red-600 mb-6 tracking-tight">Time-Constrained Trials (Please read carefully):</h2>
        <p className="mb-4 text-base leading-relaxed text-gray-800">
          In this part of the experiment, you must complete each task within a set time limit.
        </p>
        <ul className="space-y-3 mb-6 text-base leading-relaxed">
          <li>Each trial has a different time limit.</li>
          <li>Before each new type of timed trial, you'll complete one practice round with a visible timer.</li>
          <li>During practice, learn the timing; in the actual trial, the timer won't be shown but the limit will still apply.</li>
          <li>You may cross the boundary in these trials, but aim to follow the tunnel as closely as possible.</li>
          <li>Balance speed and accuracy — the goal is to finish right as the time runs out.</li>
        </ul>
        <p className="font-semibold text-lg text-gray-800">Press <kbd className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-base font-mono font-bold">SPACEBAR</kbd> to begin time-constrained trials.</p>
      </div>
    </div>
  );
};

