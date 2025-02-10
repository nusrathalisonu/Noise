let audioContext;
let audioBuffer;

async function processAudio() {
    const fileInput = document.getElementById("audioInput").files[0];
    if (!fileInput) {
        alert("Please upload an audio file first.");
        return;
    }

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(fileInput);
    fileReader.onload = async () => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = fileReader.result;
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Apply noise reduction (basic noise gate)
        const reducedAudioBuffer = await applyNoiseGate(audioBuffer);

        // Convert processed audio buffer to Blob
        const processedBlob = await bufferToWave(reducedAudioBuffer, reducedAudioBuffer.length);
        const processedUrl = URL.createObjectURL(processedBlob);

        // Update audio player with processed audio
        const audioPlayer = document.getElementById("audioPlayer");
        audioPlayer.src = processedUrl;

        // Enable download
        const downloadLink = document.getElementById("downloadLink");
        downloadLink.href = processedUrl;
        downloadLink.download = "noise_reduced.wav";
        downloadLink.style.display = "block";
        downloadLink.innerText = "Download Processed Audio";
    };
}

async function applyNoiseGate(audioBuffer) {
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Create a noise gate filter (High-Pass Filter to remove low-frequency hum)
    const filter = offlineContext.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1000; // Remove frequencies below 1000Hz

    source.connect(filter);
    filter.connect(offlineContext.destination);
    source.start();

    return await offlineContext.startRendering();
}

// Convert AudioBuffer to a WAV Blob
function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample, offset = 0;
    let pos = 0;

    const setUint16 = (data) => {
        view.setUint16(pos, data, true);
        pos += 2;
    };

    const
