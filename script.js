let mediaRecorder;
let audioChunks = [];
let audioBlob;

async function startRecording() {
    try {
        // Get the list of available audio input devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput');

        // Force selection of system audio sources only
        let selectedDeviceId = null;
        for (let device of audioInputDevices) {
            if (device.label.toLowerCase().includes('stereo mix') || device.label.toLowerCase().includes('cable output')) {
                selectedDeviceId = device.deviceId;
                break;
            }
        }

        if (!selectedDeviceId) {
            alert("No suitable system audio recording device found. Please enable 'Stereo Mix' or 'VB Audio Cable'.");
            return;
        }

        // Request audio stream from the selected system audio device ONLY
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: selectedDeviceId },
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            document.getElementById('download-button').style.display = 'inline';
        };

        mediaRecorder.start();
    } catch (error) {
        console.error("Recording error:", error);
        alert("Recording is not supported in your browser or the selected device is unavailable.");
    }
}

function convertToSpeech() {
    const text = document.getElementById('text-input').value;
    if (!text) {
        alert('Enter text first!');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    utterance.onstart = () => {
        audioChunks = [];
        startRecording();
    };

    utterance.onend = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
    };

    window.speechSynthesis.speak(utterance);
}

document.getElementById('download-button').addEventListener('click', () => {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'speech-recording.wav';
    a.click();
});
