import noisereduce as nr
import librosa
import soundfile as sf
import os

# Set file paths
input_audio_path = "audio_files/input.wav"  # Change this if needed
output_audio_path = "audio_files/output_clean.wav"

# Check if input file exists
if not os.path.exists(input_audio_path):
    print("Error: input.wav not found in audio_files/ folder.")
    exit()

# Load the audio file
y, sr = librosa.load(input_audio_path, sr=None)

# Perform noise reduction (adjust prop_decrease for more/less noise reduction)
reduced_noise = nr.reduce_noise(y=y, sr=sr, prop_decrease=0.8)

# Save the cleaned audio
sf.write(output_audio_path, reduced_noise, sr)

print(f"✅ Noise reduction complete! Clean audio saved as {output_audio_path}")
