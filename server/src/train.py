# src/train.py

import os
import torch
from torch.utils.data import DataLoader, random_split
import torch.optim as optim
import torch.nn.functional as F
from tqdm import tqdm
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

from src.dataset import SpectrogramDataset
from src.model import ResNetAudio  # UPDATED: import new model

def train_and_evaluate(
    manifest_csv="data/processed/specs/manifest.csv",
    batch_size=16,
    lr=1e-3,
    epochs=20,
    val_frac=0.2,
    device=None,
    augment=True
):
    device = device or ("cuda" if torch.cuda.is_available() else "cpu")

    # Load dataset and label map
    full_dataset = SpectrogramDataset(manifest_csv, augment=False)
    label_map = full_dataset.label_map
    n_classes = len(label_map)

    # Split into training and validation sets
    val_size = int(len(full_dataset) * val_frac)
    train_size = len(full_dataset) - val_size
    train_ds, val_ds = random_split(full_dataset, [train_size, val_size])

    # Reload with correct label_map
    train_ds.dataset = SpectrogramDataset(manifest_csv, label_map=label_map, augment=augment)
    val_ds.dataset = SpectrogramDataset(manifest_csv, label_map=label_map, augment=False)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True)

    # Initialize model and optimizer
    model = ResNetAudio(n_classes).to(device)  # UPDATED
    optimizer = optim.Adam(model.parameters(), lr=lr)

    train_losses, val_losses = [], []
    train_accs, val_accs = [], []

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        loop = tqdm(train_loader, desc=f"Epoch {epoch}/{epochs}", leave=True, dynamic_ncols=True)

        for specs, labels in loop:
            specs, labels = specs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(specs)
            loss = F.cross_entropy(outputs, labels)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            preds = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            loop.set_postfix(batch_loss=f"{loss.item():.4f}")

        train_losses.append(total_loss / len(train_loader))
        train_accs.append(correct / total)

        # Validation
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        all_preds, all_labels = [], []
        with torch.no_grad():
            for specs, labels in val_loader:
                specs, labels = specs.to(device), labels.to(device)
                outputs = model(specs)
                loss = F.cross_entropy(outputs, labels)

                val_loss += loss.item()
                preds = outputs.argmax(dim=1)
                val_correct += (preds == labels).sum().item()
                val_total += labels.size(0)

                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        val_losses.append(val_loss / len(val_loader))
        val_accs.append(val_correct / val_total)

        print(f"Epoch {epoch}/{epochs}  "
              f"Train Loss: {train_losses[-1]:.4f}  Train Acc: {train_accs[-1]:.3f}  "
              f"Val Loss: {val_losses[-1]:.4f}  Val Acc: {val_accs[-1]:.3f}")

    # Save model
    os.makedirs("experiments", exist_ok=True)
    torch.save(model.state_dict(), "experiments/resnet_audio_final.pth")  # UPDATED

    # Plotting
    epochs_range = range(1, epochs + 1)
    plt.figure(figsize=(12, 5))

    plt.subplot(1, 2, 1)
    plt.plot(epochs_range, train_losses, label="Train Loss")
    plt.plot(epochs_range, val_losses, label="Val Loss")
    plt.xlabel("Epoch"); plt.ylabel("Loss"); plt.title("Loss Curve")
    plt.legend()

    plt.subplot(1, 2, 2)
    plt.plot(epochs_range, train_accs, label="Train Acc")
    plt.plot(epochs_range, val_accs, label="Val Acc")
    plt.xlabel("Epoch"); plt.ylabel("Accuracy"); plt.title("Accuracy Curve")
    plt.legend()

    plt.tight_layout()
    plt.show()

    # Confusion Matrix
    class_names = [k for k, _ in sorted(label_map.items(), key=lambda x: x[1])]
    cm = confusion_matrix(all_labels, all_preds)
    disp = ConfusionMatrixDisplay(cm, display_labels=class_names)
    disp.plot(cmap="Blues", xticks_rotation=45)
    plt.title("Validation Confusion Matrix")
    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    train_and_evaluate()
