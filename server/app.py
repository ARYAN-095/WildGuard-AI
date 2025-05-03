import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from pydub import AudioSegment

from predict import load_audio, fix_length, compute_mel_spec, normalize
from src.model import ResNetAudio
from src.dataset import SpectrogramDataset

# ─── Setup Flask & Logging ────────────────────────────
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# ─── Uploads directory ─────────────────────────────────
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─── Load Model & Labels ───────────────────────────────
MODEL_PATH   = "experiments/resnet_audio_final.pth"
MANIFEST_CSV = "data/processed/specs/manifest.csv"

ds = SpectrogramDataset(MANIFEST_CSV, augment=False)
classes = {v: k for k, v in ds.label_map.items()}

model = ResNetAudio(len(classes))
model.load_state_dict(torch.load(MODEL_PATH, map_location="cpu"))
model.eval()


def convert_to_wav(src_path: str, target_sr: int = 16000) -> str:
    """
    Convert an audio file (mp3, webm, wav, etc.) to a WAV file
    at `target_sr` and mono. Returns the new WAV filepath.
    """
    base, ext = os.path.splitext(os.path.basename(src_path))
    ext = ext.lower().lstrip(".")
    wav_name = f"{base}_converted.wav"
    dst_path = os.path.join(UPLOAD_FOLDER, wav_name)

    try:
        logging.info(f"Converting {src_path} (format={ext}) → {dst_path}")
        audio = AudioSegment.from_file(src_path, format=ext)
        audio = audio.set_frame_rate(target_sr).set_channels(1)
        audio.export(dst_path, format="wav")
        logging.info("Conversion successful")
    except Exception as e:
        logging.exception("Conversion to WAV failed")
        raise

    return dst_path


@app.route("/upload", methods=["POST"])
def upload_audio():
    # 1) Validate upload
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    # 2) Save raw upload
    raw_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(raw_path)
    logging.info(f"Saved raw upload: {raw_path}")

    # 3) Convert to uniform WAV
    try:
        wav_path = convert_to_wav(raw_path)
    except Exception as e:
        return jsonify({"error": f"Audio conversion failed: {e}"}), 500

    # 4) Prediction
    try:
        # Load & preprocess exactly as in training
        y = load_audio(wav_path)                # librosa.load
        y = fix_length(y)                       # pad/truncate to 5s
        spec = compute_mel_spec(y)              # mel-spectrogram
        tensor = torch.tensor(
            normalize(spec),                    # normalize
            dtype=torch.float32
        ).unsqueeze(0).unsqueeze(0)             # (1,1,n_mels,frames)

        with torch.no_grad():
            logits = model(tensor)
            probs  = torch.softmax(logits, dim=1).cpu().numpy()[0]

        idx        = int(probs.argmax())
        prediction = classes[idx]
        confidence = float(probs[idx]) * 100

        logging.info(f"Predicted: {prediction} ({confidence:.2f}%)")

        return jsonify({
            "message":    "Prediction successful",
            "filename":   file.filename,
            "prediction": prediction,
            "confidence": f"{confidence:.2f}%"
        })

    except Exception as e:
        logging.exception("Inference failed")
        return jsonify({"error": f"Inference failed: {e}"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
