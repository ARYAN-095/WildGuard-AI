// FileUploader.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowUpTrayIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

function FileUploader() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event) => {
    const selected = event.target.files[0];
    if (selected) {
      setFile(selected);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files[0];
    if (selected && selected.type.startsWith('audio/')) {
      setFile(selected);
    }
  };

  const uploadFile = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);
    } catch (error) {
      console.error("Upload failed:", error);
      setResult({ error: "Upload failed" });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
        <DocumentArrowUpIcon className="h-6 w-6 text-emerald-400 mr-2" />
        Audio File Analysis
      </h2>

      <div 
        className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-colors 
          ${isDragging ? 'border-emerald-400 bg-emerald-900/20' : 'border-gray-600 hover:border-emerald-500'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <ArrowUpTrayIcon className="h-12 w-12 mx-auto text-gray-400" />
          <p className="text-gray-400">
            {file ? file.name : 'Drag & drop audio file or click to browse'}
          </p>
          <input 
            type="file" 
            accept="audio/*" 
            onChange={handleFileChange}
            className="hidden"
            id="fileInput"
          />
          <motion.label
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            htmlFor="fileInput"
            className="inline-block px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer transition-colors"
          >
            Browse Files
          </motion.label>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={uploadFile}
        disabled={!file}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
      >
        Analyze Audio
      </motion.button>

      {result && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="mt-6 p-6 bg-gray-800 rounded-2xl border border-emerald-500/30 shadow-lg"
  >
    <h3 className="text-xl font-bold text-emerald-300 mb-4">
      Analysis Results
    </h3>

    <div className="space-y-3 text-gray-100">
      {/* Filename */}
      <div className="flex items-center">
        <span className="font-medium w-32">File:</span>
        <span className="font-mono">{result.filename}</span>
      </div>

      {/* Message */}
      <div className="flex items-center">
        <span className="font-medium w-32">Status:</span>
        <span>{result.message}</span>
      </div>

      {/* Prediction */}
      <div className="flex items-center">
        <span className="font-medium w-32">Prediction:</span>
        <span
          className={`
            inline-block px-3 py-1 rounded-full text-sm font-semibold
            ${
              result.prediction === "Wind" ? "bg-cyan-600 text-cyan-100" :
              result.prediction === "Gunshot" ? "bg-red-600 text-red-100" :
              result.prediction === "Chainsaw" ? "bg-orange-600 text-orange-100" :
              result.prediction === "Animal" ? "bg-emerald-600 text-emerald-100" :
              "bg-gray-600 text-gray-100"
            }
          `}
        >
          {result.prediction}
        </span>
      </div>

      {/* Confidence */}
      <div className="flex flex-col">
        <span className="font-medium mb-1">Confidence:</span>
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-emerald-400"
            style={{ width: result.confidence.replace('%','') + '%' }}
          />
        </div>
        <span className="mt-1 text-right text-sm font-mono">
          {result.confidence}
        </span>
      </div>
    </div>
  </motion.div>
)}
    </div>
  );
}

export default FileUploader;