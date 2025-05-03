# WildGuard-AI 
Forest Sound Classification & Poaching Detection




# Table of Contents

 Project Overview

Features

Directory Structure

Getting Started

Prerequisites

Installing Dependencies

Environment Setup

Data Preparation

FSC22 Dataset Layout

Generating Spectrogram Features

Training the Model

Inference & API

Frontend (React + Vite)

Architecture

Usage Examples

Advanced Topics & Tips

Acknowledgements

License







# Project Overview

WildGuard-AI is an end-to-end system for forest acoustic monitoring, designed to detect sounds associated with illegal activities (gunshots, chainsaws) and key wildlife calls. It combines:

Audio preprocessing (librosa): Mel-spectrogram extraction

Deep learning classifier (PyTorch ResNet-18 variant)

Backend API (Flask) for file upload & real-time inference

Frontend UI (React + Vite) for file upload & live recording

This toolkit enables rangers and conservationists to deploy low-cost acoustic sensors and receive actionable alerts.






# Features

27-class sound classification (chainsaws, gunshots, animal calls, ambient)

Offline batch processing: Precompute and cache spectrograms

Real-time inference: Flask endpoint accepts WAV/MP3/WebM

Web UI:

File uploader (supports multiple formats)

Live microphone recording with configurable input device

Extensible pipeline: Easily swap in new model architectures






# Directory Structure

```
WildGuard-AI/
│
├── app.py                      # Flask API server
├── predict.py                  # Audio loading & preprocessing utils
├── scripts/
│   └── generate_features.py    # Batch spectrogram extractor
├── src/
│   ├── dataset.py              # SpectrogramDataset class
│   ├── model.py                # AudioCNN & ResNetAudio definitions
│   └── train.py                # Training & evaluation script
│
├── data/
│   └── raw/
│       └── Audio Wise V1.0/     # FSC22 .wav files
│   └── metadata/
│       └── Metadata V1.0 fsc22.csv/.xlsx
│   └── processed/
│       └── specs/               # Generated .npy mel-specs & manifest.csv
│
├── experiments/
│   └── audio_cnn_final.pth     # Trained model weights
│
├── frontend/
│   └── src/
│       ├── App.jsx             # Main React component
│       ├── components/
│       │   ├── FileUploader.jsx
│       │   └── LiveRecorder.jsx
│       └── ...
│
├── uploads/                    # Temporary uploaded audio files
├── requirements.txt            # Python dependencies
└── package.json                # Frontend dependencies
```




 

# Getting Started

Prerequisites
Python 3.9+

Node.js 16+ & npm

FFmpeg (for pydub audio conversion)

Optional (Windows): Stereo Mix enabled in OS sound settings for system-sound recording







# Installing Dependencies

Clone the repository

```
git clone https://github.com/yourusername/WildGuard-AI.git
cd WildGuard-AI
```



Python environment
 ```
python -m venv venv
source venv/bin/activate      # Linux/macOS
.\venv\Scripts\activate       # Windows PowerShell
pip install -r requirements.txt
```


# Frontend

```
cd frontend
npm install
```

# Environment Setup

 Ensure FFMPEG is on your PATH

On Windows, enable “Stereo Mix” (Recording devices) if you plan to capture system audio




 
# Data Preparation

FSC22 Dataset Layout
Audio Wise V1.0/: 2,025 × 5s .wav files

Metadata V1.0 fsc22.csv/.xlsx: Columns:

Source File Name

Dataset File Name (e.g. 1_10101.wav)

Class ID, Class Name

Generating Spectrogram Features
 





# From project root

```
python scripts/generate_features.py \
  --metadata data/metadata/Metadata\ V1.0\ fsc22.csv \
  --output_dir data/processed/specs \
  --audio_dir data/raw/Audio\ Wise\ V1.0
```

This will:

Load metadata

Convert each audio to fixed 5s waveform

Compute log-mel spectrogram

Save .npy to data/processed/specs/

Create manifest.csv with columns Dataset File Name,Class Name,spec_path






# Training the Model
 
Activate venv, then:
```
python -m src.train \
  --manifest_csv data/processed/specs/manifest.csv \
  --batch_size 32 \
  --lr 1e-3 \
  --epochs 30 \
  --val_frac 0.2
Outputs loss/accuracy curves
```

Saves final weights to experiments/audio_cnn_final.pth







# Inference & API
Start the Flask server:

 
python app.py
POST /upload

Form-data key file → any audio file (.wav, .mp3, .webm)

Returns JSON:

 ```
{
  "message": "Prediction successful",
  "filename": "recorded_audio.wav",
  "prediction": "Gunshot",
  "confidence": "92.35%"
}
```
Internally, app.py:

Saves upload to uploads/

Converts to 16 kHz mono WAV (pydub + FFmpeg)

Preprocesses → model inference → returns result






# Frontend (React + Vite)
 
cd frontend
npm run dev

Upload Files tab: select audio → displays spectrogram & prediction

Live Detection tab:

Pick input device (e.g. Stereo Mix)

Start/Stop recording → uploads blob → shows real-time result






# Architecture
 
 ```
[Browser UI: React + Vite]
    │
    │ HTTP POST /upload         [Optional WebRTC for live]
    ▼
[Flask API Server: app.py]
    │
    ├─ Audio conversion (pydub)
    ├─ Preprocessing (predict.py: librosa → spectrogram)
    └─ Inference (PyTorch ResNetAudio)
          ↓
    JSON { prediction, confidence }
```








# Usage Examples
cURL Test
 ```
curl -X POST http://localhost:5000/upload \
  -F "file=@path/to/gunshot.wav"
  ```

Python Client
 
 ```
import requests
resp = requests.post(
    "http://localhost:5000/upload",
    files={"file": open("gunshot.wav","rb")}
)
print(resp.json())
```








# Advanced Topics & Tips

Model Improvements:

SpecAugment, MixUp, focal loss, ensemble of CNN + ResNet

Deployment:

Containerize with Docker + Gunicorn

Benchmark with ONNX / TorchScript

Monitoring:

Expose Prometheus metrics in Flask

Frontend WebSocket for live confidence streaming

System-sound capture:

Windows: Stereo Mix

macOS: BlackHole

Linux: PulseAudio loopback




# Acknowledgements
FSC22 dataset for forest sound benchmarks

librosa, PyTorch, Flask, React communities




# License
This project is released under the MIT License. See LICENSE for details.

