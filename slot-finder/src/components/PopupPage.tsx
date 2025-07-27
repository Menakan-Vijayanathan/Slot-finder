import React from 'react';
import { Calendar, Settings, ExternalLink } from 'lucide-react';

const PopupPage: React.FC = () => {
  const openSidePanel = () => {
    chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
    window.close();
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };

  return (
    <div className="w-80 p-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          World Clock Meet Helper
        </h1>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Compare timezones and create Google Calendar meetings with ease.
      </p>
      
      <div className="space-y-2">
        <button
          onClick={openSidePanel}
          className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Side Panel
        </button>
        
        <button
          onClick={openOptions}
          className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Click the side panel to get started with timezone comparisons and meeting scheduling.
        </p>
      </div>
    </div>
  );
};

export default PopupPage;