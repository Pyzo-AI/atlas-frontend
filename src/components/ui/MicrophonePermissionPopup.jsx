import React from 'react';

const MicrophonePermissionPopup = ({ onCancel, onAllowMicrophone }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 max-w-xs mx-auto text-center">
        <div className="mb-3">
          <svg className="w-10 h-10 mx-auto text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          Microphone Permission Required
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Interaction Mode requires microphone access to communicate with the AI assistant.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onAllowMicrophone}
            className="cursor-pointer flex-1 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicrophonePermissionPopup;