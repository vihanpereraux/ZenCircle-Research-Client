const spaceBarKeyCode = 32; // Space bar key code
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

document.addEventListener('keydown', function(event) {
    if (event.keyCode === spaceBarKeyCode && !isRecording) {
        console.log("recording started....");
        startRecording();
    }
});

document.addEventListener('keyup', function(event) {
    if (event.keyCode === spaceBarKeyCode && isRecording) {
        console.log("recording stoped....");
        stopRecording();
    }
});

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function (event) {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = function () {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        sendAudio(audioBlob);
        audioChunks = [];
    };

    mediaRecorder.start();
    isRecording = true;
}

function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
}

async function sendAudio(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    const URL = 'http://localhost:5000/send-voice-note'

    try {
        const response = await fetch(URL, {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            console.log('Audio sent successfully');
        } else {
            console.error('Failed to send audio');
        }
    } catch (error) {
        console.error('Error sending audio:', error);
    }
}
