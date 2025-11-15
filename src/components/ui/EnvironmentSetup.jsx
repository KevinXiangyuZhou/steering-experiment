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
            <h1 className="text-2xl font-bold">Environment Setup Instructions</h1>
          </div>
          <p className="text-blue-100">Thank you for joining our study!</p>
        </div>
        
        {/* Content */}
        <div className="p-8">
          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-semibold text-gray-800">Important</span>
            </div>
            <p className="text-sm text-gray-700">
              Please configure your setup correctly to ensure consistent and usable data.
            </p>
          </div>
          
          <div className="space-y-5">
            {/* Device Requirements */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">1</div>
                <Monitor className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Device Requirements</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="text-green-600">✓</span> Use a <strong>desktop/laptop</strong> with a <strong>physical mouse</strong> on a flat surface
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-red-600">✗</span> Do not use trackpad, touchscreen, or drawing tablet
                </p>
              </div>
            </div>
  
            {/* Mouse Settings */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">2</div>
                <Mouse className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Mouse Settings</h2>
              </div>
              <p className="text-sm text-gray-700 mb-3">Set your mouse to <strong>default sensitivity</strong>:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">Windows</h3>
                  <div className="text-xs text-gray-600 space-y-1">
                  <p>• Open Control Panel → Hardware and Sound → Devices and Printers → Mouse</p>
                  <p>• Go to the "Pointer Options" tab</p>
                  <p>• Uncheck "Enhance pointer precision"</p>
                  <p>• Set the pointer speed slider to the middle position</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">Mac (macOS)</h3>
                  <div className="text-xs text-gray-600 space-y-1">
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
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">3</div>
                <Eye className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Screen Setup</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong></strong> Make browser full screen: <kbd className="bg-gray-200 px-1 py-0.5 rounded text-xs">F11</kbd> (Windows) or <kbd className="bg-gray-200 px-1 py-0.5 rounded text-xs">⌘⌃F</kbd> (Mac)
                </p>
              </div>
            </div>
  
            {/* Positioning */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">4</div>
                <Users className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">Positioning</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Sit about one arm's length away from the monitor and try to keep the same position during the experiment.
                </p>
                <p>
                At the start of each trial, adjust your posture so you are comfortable.
                </p>
              </div>
            </div>
  
            {/* During Experiment */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">5</div>
                <CheckCircle className="w-6 h-6 text-blue-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-800">During the Experiment</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-700 space-y-1">
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

