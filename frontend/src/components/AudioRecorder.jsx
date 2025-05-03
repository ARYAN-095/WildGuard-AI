// src/components/LiveRecorder.jsx

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { MicrophoneIcon, StopCircleIcon } from "@heroicons/react/24/solid";

export default function LiveRecorder() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState("");
  const [result, setResult]     = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const streamRef        = useRef(null);

  // 1️⃣ Enumerate devices on mount
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(list => {
      const inputs = list
        .filter(d => d.kind === "audioinput")
        .map(d => ({ id: d.deviceId, label: d.label || "Unknown input" }));
      setDevices(inputs);
      // auto-select "Stereo Mix" if present
      const stereo = inputs.find(d => /Stereo Mix/i.test(d.label));
      if (stereo) setDeviceId(stereo.id);
    });
  }, []);

  // 2️⃣ MIME helpers
  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/wav"
    ];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || "";
  };
  const getExtension = mimeType => {
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("ogg"))  return "ogg";
    if (mimeType.includes("wav"))  return "wav";
    return "webm";
  };

  // 3️⃣ Start recording with chosen device
  const startRecording = async () => {
    try {
      const constraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          sampleRate:       44100,
          channelCount:     1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl:  false
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      setAudioURL("");
      setResult(null);

      mediaRecorderRef.current.ondataavailable = e => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url  = URL.createObjectURL(blob);
        setAudioURL(url);
        sendRecording(blob, mimeType);
        // release mic
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      console.log("Recording started via device:", deviceId || "default");
    } catch (err) {
      console.error("Mic error:", err);
      alert("Cannot access selected input. Check permissions & device settings.");
    }
  };

  // 4️⃣ Stop & process
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setIsProcessing(true);
      console.log("Recording stopped by user");
    }
  };

  // 5️⃣ Upload & inference
  const sendRecording = async (blob, mimeType) => {
    const ext = getExtension(mimeType);
    const fd  = new FormData();
    fd.append("file", blob, `recorded.${ext}`);

    try {
      const res = await axios.post("http://localhost:5000/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Inference response:", res.data);
      setResult(res.data);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
        <MicrophoneIcon className="h-6 w-6 text-emerald-400 mr-2"/>
        Live Threat Detection
      </h2>

      {/* 🎛️ Device Selector */}
      <div className="mb-4">
        <label className="text-emerald-200 mr-2">Input Device:</label>
        <select
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
          className="bg-gray-700 text-white px-2 py-1 rounded"
        >
          <option value="">Default Microphone</option>
          {devices.map(d => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* 🎙️ Controls */}
      <div className="flex gap-4 mb-6">
        <motion.button
          onClick={startRecording}
          disabled={recording}
          whileHover={!recording ? { scale: 1.1 } : {}}
          whileTap={{ scale: 0.95 }}
          className={`p-4 rounded-full ${
            recording ? "bg-red-500" : "bg-emerald-600 hover:bg-emerald-500"
          } text-white`}
        >
          <MicrophoneIcon className="h-6 w-6"/>
        </motion.button>

        <motion.button
          onClick={stopRecording}
          disabled={!recording}
          whileHover={recording ? { scale: 1.1 } : {}}
          whileTap={{ scale: 0.95 }}
          className="p-4 bg-red-600 hover:bg-red-500 rounded-full disabled:opacity-50 text-white"
        >
          <StopCircleIcon className="h-6 w-6"/>
        </motion.button>
      </div>

      {/* ⏳ Processing */}
      {isProcessing && <p className="text-emerald-400 animate-pulse">Analyzing...</p>}

      {/* ▶️ Preview */}
      {audioURL && (
        <div className="mb-6">
          <h4 className="text-gray-300 mb-2">Preview</h4>
          <audio src={audioURL} controls className="w-full"/>
        </div>
      )}

      {/* 📝 Results */}
      {result && (
        <div className="bg-gray-700 p-4 rounded-lg text-gray-100">
          <p><strong>Prediction:</strong> {result.prediction}</p>
          <p><strong>Confidence:</strong> {result.confidence}</p>
        </div>
      )}
    </div>
  );
}
