import os
import pandas as pd
import numpy as np
from src import preprocess  # Assuming your src/preprocess.py exists and is correct

def generate_features(metadata_path, output_dir="data/processed/specs", audio_dir="data/raw/Audio Wise V1.0"):
    """
    Generate Mel spectrograms for each audio file and save as .npy.
    Args:
        metadata_path (str): Path to metadata (CSV or Excel).
        output_dir (str): Directory to save processed spectrograms.
        audio_dir (str): Directory containing raw audio files.
    """
    # Load metadata
    if metadata_path.endswith('.xlsx'):
        meta = pd.read_excel(metadata_path)
    elif metadata_path.endswith('.csv'):
        meta = pd.read_csv(metadata_path)
    else:
        raise ValueError("Unsupported file type. Please provide a CSV or Excel file.")
    
    os.makedirs(output_dir, exist_ok=True)

    # Build full paths
    meta["filepath"] = meta["Dataset File Name"].apply(lambda fn: os.path.normpath(os.path.join(audio_dir, fn)))

    spec_paths = []

    for _, row in meta.iterrows():
        try:
            # Load and preprocess audio
            y = preprocess.load_audio(row.filepath)
            y = preprocess.fix_length(y)
            spec = preprocess.compute_mel_spec(y)
            spec = preprocess.normalize(spec)

            # Generate filename without ".wav"
            base_filename = os.path.splitext(row['Dataset File Name'])[0]
            out_fp = os.path.join(output_dir, base_filename + ".npy")

            # Save spectrogram
            np.save(out_fp, spec)
            spec_paths.append(out_fp)

        except Exception as e:
            print(f"Error processing {row.filepath}: {e}")
            spec_paths.append("")

    # Add paths to metadata
    meta["spec_path"] = spec_paths

    # Save manifest
    manifest_path = os.path.join(output_dir, "manifest.csv")
    meta[["Dataset File Name", "Class Name", "spec_path"]].to_csv(manifest_path, index=False)
    print(f"Saved manifest to: {manifest_path}")

if __name__ == "__main__":
    metadata_path = "data/metadata/Metadata V1.0 FSC22_.xlsx"
    output_dir = "data/processed/specs"
    generate_features(metadata_path, output_dir)
