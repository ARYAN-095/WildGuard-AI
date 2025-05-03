import os
import numpy as np
import librosa

def load_audio(path, sr=16000):
    """
    Load an audio file and return the waveform.
    """
    y, _ = librosa.load(path, sr=sr, mono=True)
    return y

def fix_length(y, sr=16000, length_s=5):
    """
    Pad or truncate the waveform to a fixed length in seconds.
    """
    target_len = sr * length_s
    if len(y) > target_len:
        return y[:target_len]
    return np.pad(y, (0, target_len - len(y)), mode="constant")

def compute_mel_spec(y, sr=16000, n_mels=128, win_length=400, hop_length=160):
    """
    Compute a log-scaled Mel spectrogram.
    """
    S = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_fft=win_length,
        hop_length=hop_length,
        n_mels=n_mels,
        power=2.0  # power spectrogram (default is 2.0)
    )
    return librosa.power_to_db(S, ref=np.max)

def normalize(spec):
    """
    Normalize spectrogram to zero mean and unit variance.
    """
    mean = np.mean(spec)
    std = np.std(spec)
    return (spec - mean) / (std + 1e-6)
