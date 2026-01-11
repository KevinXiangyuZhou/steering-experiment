import React from 'react';

export const WelcomeScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <h1 className="text-4xl font-bold mb-6 tracking-tight leading-tight">Human Steering Experiment</h1>
        <p className="mb-6 text-gray-700 text-lg leading-relaxed">Press ENTER to continue</p>
      </div>
    </div>
  );
};

