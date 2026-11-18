"""
WasteWise AI — Custom PyTorch CNN Trainer & Local Inference (MobileNetV2)
Trains a 5-class waste image classifier for: glass, metal, organic, paper, plastic.
"""

from __future__ import annotations

from pathlib import Path
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from PIL import Image

WASTE_CLASSES = ["glass", "metal", "organic", "paper", "plastic"]

DISPOSAL_GUIDE = {
    "plastic": {
        "bin": "Recyclable Plastic Waste Bin",
        "recommendation": "Empty liquids, flatten container, and place in the recyclable plastic waste bin.",
        "impact": "Supports plastic recycling and prevents persistent polymer pollution.",
    },
    "paper": {
        "bin": "Paper & Cardboard Recycling Bin",
        "recommendation": "Keep dry, flatten cardboard boxes, and place in the paper recycling stream.",
        "impact": "Conserves forest pulp and reduces water and energy consumption.",
    },
    "metal": {
        "bin": "Metal Recycling Bin",
        "recommendation": "Rinse food residue from cans and place in the metal recycling bin.",
        "impact": "Recovers aluminum and steel while saving up to 95% of smelting energy.",
    },
    "glass": {
        "bin": "Glass Recycling Bin",
        "recommendation": "Remove metal caps, rinse jars, and place in the glass recycling bin.",
        "impact": "Enables closed-loop glass remelting with zero loss in material purity.",
    },
    "organic": {
        "bin": "Organic / Compost Bin",
        "recommendation": "Remove plastic stickers and place food scraps in the compost bin.",
        "impact": "Diverts biodegradable waste from landfills and reduces methane emissions.",
    },
}


def build_model(num_classes: int = 5, pretrained: bool = True) -> nn.Module:
    weights = models.MobileNet_V2_Weights.DEFAULT if pretrained else None
    model = models.mobilenet_v2(weights=weights)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.25),
        nn.Linear(in_features, num_classes),
    )
    return model


def train_classifier(
    data_dir: str | Path,
    epochs: int = 12,
    batch_size: int = 32,
    learning_rate: float = 3e-4,
    checkpoint_path: str = "wastewise_mobilenetv2.pth",
) -> None:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    train_tfms = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    val_tfms = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    train_ds = datasets.ImageFolder(Path(data_dir) / "train", transform=train_tfms)
    val_ds = datasets.ImageFolder(Path(data_dir) / "val", transform=val_tfms)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2)

    model = build_model(num_classes=len(train_ds.classes)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)

    best_acc = 0.0
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            loss = criterion(model(images), labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * images.size(0)

        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                preds = model(images).argmax(dim=1)
                correct += (preds == labels).sum().item()
                total += labels.size(0)

        val_acc = correct / max(total, 1)
        print(f"Epoch {epoch:02d}/{epochs} | Train Loss: {running_loss / len(train_ds):.4f} | Val Acc: {val_acc:.2%}")

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({"model_state": model.state_dict(), "classes": train_ds.classes}, checkpoint_path)


def predict_local_image(image_path: str | Path, checkpoint_path: str = "wastewise_mobilenetv2.pth") -> dict:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    ckpt = torch.load(checkpoint_path, map_location=device)
    classes = ckpt.get("classes", WASTE_CLASSES)

    model = build_model(num_classes=len(classes), pretrained=False).to(device)
    model.load_state_dict(ckpt["model_state"])
    model.eval()

    tfm = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    tensor = tfm(Image.open(image_path).convert("RGB")).unsqueeze(0).to(device)
    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)[0]
        conf, idx = torch.max(probs, dim=0)

    predicted = classes[int(idx)].lower()
    guide = DISPOSAL_GUIDE.get(predicted, DISPOSAL_GUIDE["plastic"])
    return {
        "category": predicted.capitalize(),
        "confidence": round(float(conf) * 100, 1),
        "bin_type": guide["bin"],
        "disposal_recommendation": guide["recommendation"],
        "environmental_impact": guide["impact"],
    }
