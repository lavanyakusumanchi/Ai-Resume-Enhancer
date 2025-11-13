import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ResumeUpload from './components/ResumeUpload';
import HistoryView from './components/HistoryView';
import Login from './components/Login';
import Signup from './components/Signup';

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [activeTab, setActiveTab] = useState('upload');
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const { user, loading, logout, isAuthenticated } = useAuth();

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Update document class for dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleEnhanceComplete = () => {
    // Trigger history refresh (but don't switch tabs)
    setRefreshHistory(prev => prev + 1);
  };

  const handleSelectResume = (resume) => {
    // Switch to upload tab and load the selected resume
    setActiveTab('upload');
    // This would require passing data back to ResumeUpload
    // For now, just switch tabs
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <div className="animate-pulse text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  // Show login/signup if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="w-full max-w-md px-4">
          {authMode === 'login' ? (
            <Login onSwitchToSignup={() => setAuthMode('signup')} darkMode={darkMode} />
          ) : (
            <Signup onSwitchToLogin={() => setAuthMode('login')} darkMode={darkMode} />
          )}
          <div className="mt-4 text-center">
            <button
              onClick={toggleDarkMode}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <header className={`border-b ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } shadow-sm sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className={`text-2xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              🚀 AI Resume Enhancer (Jules Edition)
            </h1>
            <div className="flex items-center gap-4">
              {user && (
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  👤 {user.name || user.email}
                </span>
              )}
              <button
                onClick={logout}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  darkMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Logout
              </button>
              <button
                onClick={toggleDarkMode}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className={`flex gap-2 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 font-semibold transition-colors relative ${
                activeTab === 'upload'
                  ? darkMode
                    ? 'text-indigo-400'
                    : 'text-indigo-600'
                  : darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📄 Upload & Enhance
              {activeTab === 'upload' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  darkMode ? 'bg-indigo-400' : 'bg-indigo-600'
                }`} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 font-semibold transition-colors relative ${
                activeTab === 'history'
                  ? darkMode
                    ? 'text-indigo-400'
                    : 'text-indigo-600'
                  : darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📚 History
              {activeTab === 'history' && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                  darkMode ? 'bg-indigo-400' : 'bg-indigo-600'
                }`} />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'upload' && (
            <div className="flex justify-center">
              <ResumeUpload
                darkMode={darkMode}
                onEnhanceComplete={handleEnhanceComplete}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <HistoryView
              darkMode={darkMode}
              onSelectResume={handleSelectResume}
              refreshTrigger={refreshHistory}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 border-t ${
        darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            Powered by Google Jules API • Built with React & Node.js
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
