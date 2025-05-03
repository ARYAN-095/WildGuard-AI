# src/model.py

import torch
import torch.nn as nn
from torchvision import models

class ResNetAudio(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        
        # Load ResNet-18 and modify for 1 input channel
        self.base_model = models.resnet18(pretrained=False)
        self.base_model.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.base_model.fc = nn.Linear(self.base_model.fc.in_features, num_classes)

    def forward(self, x):
        return self.base_model(x)
