import React from 'react';

export const CompleteScreen = ({ 
  uploadStatus, 
  uploadError, 
  onCompleteExperiment, 
  onRetryUpload, 
  onDownloadData 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-md">
        <h2 className="text-2xl font-bold text-green-600 mb-6">Experiment Complete!</h2>
        <p className="mb-6">All trials completed successfully!</p>
        
        {/* Upload Status */}
        {uploadStatus === 'idle' && (
          <div className="mb-6">
            <button
              onClick={onCompleteExperiment}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded mb-4 w-full"
            >
              Upload Data
            </button>
          </div>
        )}
        
        {uploadStatus === 'uploading' && (
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-blue-600">Uploading data...</span>
            </div>
            <p className="text-sm text-gray-600">Please wait while we save your data</p>
          </div>
        )}
        
        {uploadStatus === 'success' && (
          <div className="mb-6">
            <div className="text-green-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="font-semibold">Data uploaded successfully!</p>
            </div>
          </div>
        )}
        
        {uploadStatus === 'error' && (
          <div className="mb-6">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="font-semibold">Upload failed</p>
            </div>
            <p className="text-sm text-red-600 mb-4">{uploadError}</p>
            <div className="space-y-2">
              <button
                onClick={onRetryUpload}
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Retry Upload
              </button>
              <button
                onClick={onDownloadData}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
              >
                Download Data Only
              </button>
            </div>
          </div>
        )}
        
        <p className="text-gray-600">Thank you for participating!</p>
      </div>
    </div>
  );
};

