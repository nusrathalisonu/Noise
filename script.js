let audioContext;
let audioBuffer;

async function processAudio() {
    const fileInput = document.getElementById("audioInput").files[0];
    if (!fileInput) {
        alert("Please upload an audio file first.");
        return;
    }

    console.log("Processing file:", fileInput.name);  // Debugging log

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(fileInput);
    fileReader.onload = async () => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = fileReader.result;
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        console.log("Decoded audio successfully!");  // Debugging log

        // Apply noise reduction (basic high-pass filter)
        const reducedAudioBuffer = await applyNoiseGate(audioBuffer);

        console.log("Audio processing complete!");  // Debugging log

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

    const setUint32 = (data) => {
        view.setUint32(pos, data, true);
        pos += 4;
    };

    // RIFF header
    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);

    // fmt subchunk
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);

    // data subchunk
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (i = 0; i < abuffer.numberOfChannels; i++) {
        channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([buffer], { type: "audio/wav" });
}
