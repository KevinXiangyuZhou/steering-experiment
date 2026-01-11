import React from 'react';
import { CreditCard } from 'lucide-react';

export const ScreenCalibration = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <CreditCard className="w-8 h-8 mr-3" />
              <h1 className="text-3xl font-bold tracking-tight">Screen Calibration</h1>
            </div>
            <p className="text-lg text-blue-100 leading-relaxed">Calibrate your screen using a credit card</p>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Instructions */}
            <div className="text-center mb-6">
              <div className="bg-blue-50 rounded-lg p-5 mb-4">
                <p className="text-base text-gray-700 leading-relaxed">
                  Hold your <strong>credit card</strong> against the window below and adjust browser zoom until they match
                </p>
              </div>
              
              <div className="space-y-2 text-base text-gray-700 max-w-lg mx-auto leading-relaxed">
                <p>Use Ctrl/⌘ + "+" or "−" to adjust zoom</p>
              </div>
            </div>
            
            {/* Calibration Window */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg p-6">
                <div 
                  className="bg-blue-200 border-2 border-blue-400 rounded"
                  style={{
                    width: '340px',  // Same width as experiment canvas
                    height: '200px', // Same height as experiment canvas
                    position: 'relative'
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                  </div>
                </div>
              </div>
            </div>
            
            {/* Continue Button */}
            <div className="text-center">
              <div className="bg-white border-4 border-blue-600 px-8 py-4 rounded-2xl inline-block shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="text-xl font-semibold text-gray-700 leading-relaxed">
                  Press <kbd className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-lg font-mono font-bold">SPACEBAR</kbd> when done
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

