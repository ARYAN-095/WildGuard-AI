import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GlobeAltIcon,
  MicrophoneIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import FileUploader from './components/FileUploader';
import AudioRecorder from './components/AudioRecorder';

function App() {
  const [currentView, setCurrentView] = useState('intro'); // 'intro' or 'dashboard'
  const [dashboardTab, setDashboardTab] = useState('upload'); // 'upload' or 'audio'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-emerald-900">
      <AnimatePresence mode="wait">
        {currentView === 'intro' ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 100 }}
              className="mb-8"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                <GlobeAltIcon className="h-24 w-24 text-emerald-400 mx-auto" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-7xl font-bold text-white mb-4"
            >
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                WildGuard
              </span>{' '}
              AI
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl text-emerald-100/80 max-w-2xl mx-auto mb-8"
            >
              Next-generation wildlife protection powered by artificial intelligence
            </motion.p>

            <div className="flex gap-6">
              <motion.button
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setDashboardTab('upload');
                  setCurrentView('dashboard');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-xl font-semibold text-lg text-white flex items-center gap-2 group"
              >
                <DocumentArrowUpIcon className="h-6 w-6" />
                Upload files
              </motion.button>

              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setDashboardTab('audio');
                  setCurrentView('dashboard');
                }}
                className="bg-cyan-600 hover:bg-cyan-500 px-8 py-4 rounded-xl font-semibold text-lg text-white flex items-center gap-2 group"
              >
                <MicrophoneIcon className="h-6 w-6" />
                Live Detection
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full"
          >
            {/* Navigation */}
            <nav className="border-b border-emerald-500/20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => setCurrentView('intro')}
                  >
                    <GlobeAltIcon className="h-8 w-8 text-emerald-400" />
                    <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                      WildGuard AI
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setDashboardTab('upload')}
                      className={`px-4 py-2 rounded-lg ${
                        dashboardTab === 'upload'
                          ? 'bg-emerald-600 text-white'
                          : 'text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      Upload Files
                    </button>
                    <button
                      onClick={() => setDashboardTab('audio')}
                      className={`px-4 py-2 rounded-lg ${
                        dashboardTab === 'audio'
                          ? 'bg-cyan-600 text-white'
                          : 'text-cyan-300 hover:bg-cyan-500/20'
                      }`}
                    >
                      Live Detection
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <AnimatePresence mode="wait">
                {dashboardTab === 'upload' ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-emerald-500/20"
                  >
                    <FileUploader />
                  </motion.div>
                ) : (
                  <motion.div
                    key="audio"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-cyan-500/20"
                  >
                    <AudioRecorder />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
