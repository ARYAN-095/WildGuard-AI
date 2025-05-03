# src/dataset.py

import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset

# Optional: Import SpecAugment transforms
from torchaudio.transforms import FrequencyMasking, TimeMasking

class SpectrogramDataset(Dataset):
    def __init__(self, manifest_csv, label_map=None, augment=False):
        """
        manifest_csv: path to CSV with columns ['Dataset File Name','Class Name','spec_path']
        label_map: dict mapping class names to integer labels. If None, builds from data.
        augment: whether to apply SpecAugment (data augmentation).
        """
        self.df = pd.read_csv(manifest_csv)
        if label_map is None:
            classes = sorted(self.df['Class Name'].unique())
            self.label_map = {c: i for i, c in enumerate(classes)}
        else:
            self.label_map = label_map

        self.augment = augment
        if self.augment:
            self.freq_mask = FrequencyMasking(freq_mask_param=15)
            self.time_mask = TimeMasking(time_mask_param=35)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        try:
            spec = np.load(row['spec_path'])
        except Exception as e:
            raise RuntimeError(f"Error loading spectrogram from {row['spec_path']}: {e}")

        spec = torch.tensor(spec, dtype=torch.float32).unsqueeze(0)  # (1, mels, time)
        label = self.label_map[row['Class Name']]

        if self.augment:
            spec = self.freq_mask(spec)
            spec = self.time_mask(spec)

        return spec, label
