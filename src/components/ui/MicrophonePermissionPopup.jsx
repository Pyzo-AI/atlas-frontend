import React from 'react';
import { HiMicrophone } from 'react-icons/hi2';
import { useTranslation } from 'react-i18next';

const MicrophonePermissionPopup = ({ onCancel, onAllowMicrophone }) => {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 max-w-xs mx-auto text-center">
        <div className="mb-3">
          <HiMicrophone className="w-10 h-10 mx-auto text-primary" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {t("micPermission.title")}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t("micPermission.description")}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer flex-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t("micPermission.cancel")}
          </button>
          <button
            onClick={onAllowMicrophone}
            className="cursor-pointer flex-1 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            {t("micPermission.allow")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicrophonePermissionPopup;