import React from 'react';
import { Monitor, Mouse, Settings, Eye, Users, CheckCircle, AlertTriangle } from 'lucide-react';

export const EnvironmentSetup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center rounded-t-2xl">
          <div className="flex items-center justify-center mb-2">
            <Settings className="w-8 h-8 mr-3" />
            <h1 className="text-3xl font-bold tracking-tight">Environment Setup Instructions</h1>
          </div>
          <p className="text-blue-100 text-lg">Thank you for joining our study!</p>
        </div>
        
        {/* Content */}
        <div className="p-8">
          {/* Important Notice */}
          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-6 mb-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-700 mr-2" />
              <span className="font-bold text-gray-900 text-lg"><b>Important Please Read Carefully</b></span>
            </div>
            <p className="text-xl font-bold text-gray-900 leading-relaxed bg-yellow-200 px-4 py-3 rounded-md inline-block">
              <b>Please configure your setup correctly for usable data.<br />
              The step will take approximately 2 minutes.</b>
            </p>
            
          </div>
          
          <div className="space-y-5">
            {/* Device Requirements */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Monitor className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Step 1: Check Device Requirements</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-5">
                <p className="text-base text-gray-700 mb-3 leading-relaxed">
                  <span className="text-green-600">✓</span> This experiment requires you to use a <strong>desktop/laptop</strong> with a <strong>physical mouse</strong> on a flat surface
                </p>
                <p className="text-base text-gray-700 leading-relaxed">
                  <span className="text-red-600">✗</span> DO NOT use trackpad, touchscreen, or drawing tablet
                </p>
              </div>
            </div>
  
            {/* Mouse Settings */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Mouse className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Step 2: Configure Mouse Settings</h2>
              </div>
              <p className="text-base text-gray-700 mb-4 leading-relaxed">Set your mouse to <strong>default sensitivity</strong>:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-800 mb-3 text-base">Windows</h3>
                  <div className="text-sm text-gray-700 space-y-2 leading-relaxed">
                  <p>• Open Control Panel → Hardware and Sound → Devices and Printers → Mouse</p>
                  <p>• Go to the "Pointer Options" tab</p>
                  <p>• Uncheck "Enhance pointer precision"</p>
                  <p>• Set the pointer speed slider to the middle position</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-5">
                  <h3 className="font-semibold text-gray-800 mb-3 text-base">Mac (macOS)</h3>
                  <div className="text-sm text-gray-700 space-y-2 leading-relaxed">
                    <p>• System Preferences → Mouse</p>
                    <p>• Set Tracking Speed to middle (4th from left)</p>
                    <p>• Click on advanced → disable Pointer acceleration</p>
                  </div>
                </div>
              </div>
            </div>
  
            {/* Screen Setup */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Eye className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Step 3: Set Up Screen</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 space-y-2">
                <p className="text-base text-gray-700 leading-relaxed">
                  <strong></strong> Make browser full screen: <kbd className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">F11</kbd> (Windows) or <kbd className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">⌘⌃F</kbd> (Mac)
                </p>
              </div>
            </div>
  
            {/* Positioning */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Step 4: Position Yourself</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-5">
                <p className="text-base text-gray-700 mb-2 leading-relaxed">
                  Sit about one arm's length away from the monitor and try to keep the same position during the experiment.
                </p>
                <p className="text-base text-gray-700 leading-relaxed">
                At the start of each trial, adjust your posture so you are comfortable.
                </p>
              </div>
            </div>
  
            {/* During Experiment */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Step 5: During the Experiment</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-5">
                <div className="text-base text-gray-700 space-y-2 leading-relaxed">
                  <p><span className="text-green-600">✓</span> Follow instructions carefully and try your best</p>
                  <p><span className="text-red-600">⚠</span> Do not change mouse settings once you start</p>
                </div>
              </div>
            </div>
          </div>
  
          {/* Continue Button */}
          <div className="mt-12 text-center">
            <div className="bg-white border-4 border-blue-600 px-12 py-8 rounded-2xl inline-block shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-3xl font-black text-gray-800">Ready to continue?</span>
              </div>
              <div className="mt-4 text-lg font-semibold text-gray-600">
                Press <kbd className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-lg font-bold">SPACEBAR</kbd> to proceed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

