import React, { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import { Settings, User, Calendar, Clock, Trash2 } from 'lucide-react';

const OptionsPage: React.FC = () => {
  const [recentEmails, setRecentEmails] = useStorage<string[]>('recentEmails', []);
  const [defaultDuration, setDefaultDuration] = useStorage<number>('defaultDuration', 60);
  const [autoSignIn, setAutoSignIn] = useStorage<boolean>('autoSignIn', false);
  const { user, signOut, isSignedIn } = useAuth();

  const clearRecentEmails = () => {
    setRecentEmails([]);
  };

  const removeEmail = (emailToRemove: string) => {
    setRecentEmails(prev => prev.filter(email => email !== emailToRemove));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              World Clock Meet Helper Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your timezone and meeting preferences
          </p>
        </div>

        {/* Account Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Account
              </h2>
            </div>
            
            {isSignedIn ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={user?.picture} 
                    alt={user?.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user?.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="px-4 py-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                Not signed in. Sign in from the main panel to create meetings.
              </div>
            )}
          </div>

          <div className="p-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoSignIn}
                onChange={(e) => setAutoSignIn(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Automatically sign in when extension opens
              </span>
            </label>
          </div>
        </div>

        {/* Meeting Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Meeting Preferences
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Meeting Duration
                </label>
                <select
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Emails */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Email Addresses
                </h2>
              </div>
              {recentEmails.length > 0 && (
                <button
                  onClick={clearRecentEmails}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
            
            {recentEmails.length > 0 ? (
              <div className="space-y-2">
                {recentEmails.map((email, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <span className="text-gray-900 dark:text-white">{email}</span>
                    <button
                      onClick={() => removeEmail(email)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                No recent email addresses. Email addresses will appear here after creating meetings.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          World Clock Meet Helper v1.0.0
        </div>
      </div>
    </div>
  );
};

export default OptionsPage;