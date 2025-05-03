# predict.py

import argparse
import torch
import numpy as np
import librosa
import matplotlib.pyplot as plt

from src.model import ResNetAudio  # or AudioCNN if you stuck with that
from src.dataset import SpectrogramDataset  # for label_map
from src.model import ResNetAudio

# Preprocessing functions (or import from your src/preprocess.py)
def load_audio(path, sr=16000):
    y, _ = librosa.load(path, sr=sr, mono=True)
    return y

def fix_length(y, sr=16000, length_s=5):
    target_len = sr * length_s
    if len(y) > target_len:
        return y[:target_len]
    return np.pad(y, (0, target_len - len(y)), mode="constant")

def compute_mel_spec(y, sr=16000, n_mels=128, win_length=400, hop_length=160):
    S = librosa.feature.melspectrogram(
        y=y, sr=sr, n_mels=n_mels, n_fft=win_length, hop_length=hop_length
    )
    return librosa.power_to_db(S, ref=np.max)

def normalize(spec):
    mean, std = spec.mean(), spec.std()
    return (spec - mean) / (std + 1e-6)

def main(model_path, manifest_csv, audio_path, device="cpu"):
    # Load label map from dataset
    ds = SpectrogramDataset(manifest_csv, augment=False)
    classes = {v:k for k,v in ds.label_map.items()}

    # Build model
    model = ResNetAudio(len(classes)).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    # Preprocess audio
    y = load_audio(audio_path)
    y = fix_length(y)
    spec = compute_mel_spec(y)
    spec = normalize(spec)
    tensor = torch.tensor(spec, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)
    # shape: (1,1,n_mels,frames)

    # Inference
    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        top_idx = int(probs.argmax())
        print(f"Predicted: {classes[top_idx]} ({probs[top_idx]*100:.1f}% confidence)")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--model",    default="experiments/resnet_audio_final.pth")
    p.add_argument("--manifest", default="data/processed/specs/manifest.csv")
    p.add_argument("audio",      help="path to input .wav file")
    p.add_argument("--device",   default="cpu")
    args = p.parse_args()
    main(args.model, args.manifest, args.audio, args.device)
