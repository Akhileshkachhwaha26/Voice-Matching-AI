import torch
import librosa
import numpy as np
from speechbrain.pretrained import EncoderClassifier
from scipy.spatial.distance import cosine
from google.colab import files
import os

# Load model
classifier = EncoderClassifier.from_hparams(
    source="speechbrain/spkrec-ecapa-voxceleb",
    savedir="pretrained_models",
    run_opts={"device": "cpu"}
)

# Upload database voices
print("Upload DATABASE voices (same person)")
db_files = files.upload()

db_embeddings = {}
for name in db_files:
    audio, _ = librosa.load(name, sr=16000)
    emb = classifier.encode_batch(
        torch.tensor(audio).unsqueeze(0)
    ).squeeze().numpy()
    db_embeddings[name] = emb

# Upload test voice
print("\nUpload TEST voice")
test_file = files.upload()
test_name = list(test_file.keys())[0]

audio, _ = librosa.load(test_name, sr=16000)
test_emb = classifier.encode_batch(
    torch.tensor(audio).unsqueeze(0)
).squeeze().numpy()

# Matching
best_score = -1
best_match = None

for name, emb in db_embeddings.items():
    score = 1 - cosine(test_emb, emb)
    if score > best_score:
        best_score = score
        best_match = name

print("\nRESULT")
print("Best Match:", best_match)
print("Similarity Score:", round(best_score, 2))