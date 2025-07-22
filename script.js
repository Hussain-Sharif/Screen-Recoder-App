// =================================================================
// 1. DOM ELEMENTS & STATE VARIABLES
// =================================================================
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const preview = document.getElementById("preview");
const status = document.getElementById("status");
const downloadBtn = document.getElementById("downloadBtn");
const authBtn = document.getElementById('authBtn');
const saveToDriveBtn = document.getElementById('saveToDriveBtn');

// Recording choice buttons
const selfRecordingBtn = document.getElementById('self-recording');
const screenRecordingBtn = document.getElementById('screen-recording');
const bothRecordingBtn = document.getElementById('both-recording');

// App State
let mediaRecorder = null;
let stream = null;
let recordedBlob = null; // CRITICAL: This will hold the final recording data
let googleAuth = null;
let currentRecordingType = 'self'; // 'self', 'screen', or 'both'

// Google API Credentials
const API_KEY = 'AIzaSyC6NK0xD_3j48RjeM1SRgMtGT0R1jRDzm8'; // Replace with your key
const CLIENT_ID = '600466717623-li9r2s1vru2m83t61731v3h5ga0sat00.apps.googleusercontent.com'; // Replace with your client ID
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// =================================================================
// 2. UI & STATE MANAGEMENT FUNCTIONS
// =================================================================
function setStatus(message, color = "#aedcff") {
  status.textContent = message;
  status.style.color = color;
}

function setIdleState() {
  startBtn.disabled = false;
  stopBtn.disabled = true;
  downloadBtn.disabled = true;
  saveToDriveBtn.disabled = true;
  selfRecordingBtn.disabled = false;
  screenRecordingBtn.disabled = false;
  bothRecordingBtn.disabled = false;
}

function setRecordingState() {
  startBtn.disabled = true;
  stopBtn.disabled = false;
  downloadBtn.disabled = true;
  saveToDriveBtn.disabled = true;
  selfRecordingBtn.disabled = true;
  screenRecordingBtn.disabled = true;
  bothRecordingBtn.disabled = true;
  setStatus("Recording in progress...", "#ffe266");
}

function setStoppedState() {
  setIdleState(); // Start with a clean slate
  downloadBtn.disabled = false; // Always enable download
  // Only enable "Save to Drive" if authorized
  if (googleAuth && googleAuth.isSignedIn.get() && recordedBlob) {
    saveToDriveBtn.disabled = false;
  }
  setStatus("Recording finished. Ready to download or save.", "#6effa7");
}

// =================================================================
// 3. CORE RECORDING & STREAM LOGIC
// =================================================================

// Function to start a preview stream (e.g., webcam on page load)
async function startPreview() {
  try {
    // Stop any existing streams to avoid conflicts
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    const previewStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream = previewStream;
    preview.srcObject = stream;
    preview.controls = false;
    preview.play();
  } catch (err) {
    setStatus("Could not access camera for preview. Please grant permission.", "#ff3860");
  }
}

// Event Listeners for recording type selection
selfRecordingBtn.addEventListener('click', () => {
  currentRecordingType = 'self';
  selfRecordingBtn.classList.add('selected');
  screenRecordingBtn.classList.remove('selected');
  bothRecordingBtn.classList.remove('selected');
  startPreview(); // Show webcam preview
  setStatus("Ready to record yourself");
});

screenRecordingBtn.addEventListener('click', () => {
  currentRecordingType = 'screen';
  screenRecordingBtn.classList.add('selected');
  selfRecordingBtn.classList.remove('selected');
  bothRecordingBtn.classList.remove('selected');
  setStatus("Ready to record your screen");
});

bothRecordingBtn.addEventListener('click', () => {
  currentRecordingType = 'both';
  bothRecordingBtn.classList.add('selected');
  selfRecordingBtn.classList.remove('selected');
  screenRecordingBtn.classList.remove('selected');
  setStatus("Recording both screen and camera is not yet implemented.");
});

// Main "Start Recording" logic
startBtn.addEventListener("click", async () => {
  try {
    let recordingStream;
    // Stop the preview stream before starting the recording stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Get the appropriate stream based on user choice
    switch (currentRecordingType) {
      case 'self':
        recordingStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        break;
      case 'screen':
        recordingStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        break;
      case 'both':
        // This is complex and requires merging streams. For now, we'll just show a message.
        setStatus("Recording both is not yet implemented. Please choose another option.", "#ff3860");
        return; // Exit the function
    }
    stream = recordingStream; // Store the active stream
    preview.srcObject = stream;
    preview.controls = false;
    preview.play();

    // -- MediaRecorder Setup --
    const recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      // **BUG FIX**: Create and assign the global recordedBlob here
      recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
      preview.srcObject = null;
      preview.src = URL.createObjectURL(recordedBlob);
      preview.controls = true;
      preview.play();
      setStoppedState(); // Update UI to the "stopped" state
    };
    
    mediaRecorder.start();
    setRecordingState();

  } catch (err) {
    setStatus("Error: " + err.message, "#ff3860");
    setIdleState(); // Reset UI on error
  }
});

stopBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop(); // This will trigger the 'onstop' event handler
    stream.getTracks().forEach(track => track.stop()); // Important: stop the stream tracks
  }
});

downloadBtn.addEventListener("click", () => {
  if (recordedBlob) {
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 120);
  }
});

// =================================================================
// 4. GOOGLE DRIVE INTEGRATION
// =================================================================
function updateAuthUI(isSignedIn) {
  if (isSignedIn) {
    authBtn.textContent = "Authorized";
    authBtn.disabled = true;
    setStatus("Google account authorized. Ready to record.");
    // If a recording is already waiting, enable the save button now
    if (recordedBlob) saveToDriveBtn.disabled = false;
  } else {
    authBtn.textContent = "Authorize Google";
    authBtn.disabled = false;
    saveToDriveBtn.disabled = true;
  }
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    scope: SCOPES,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
  }).then(() => {
    googleAuth = gapi.auth2.getAuthInstance();
    googleAuth.isSignedIn.listen(updateAuthUI);
    updateAuthUI(googleAuth.isSignedIn.get());
  }, (error) => {
    setStatus(`Google Client Error: ${error.details}`, "#ed4c63");
  });
}

authBtn.addEventListener("click", () => {
  if (googleAuth) {
    googleAuth.signIn();
  }
});

saveToDriveBtn.addEventListener("click", () => {
  if (!recordedBlob) {
    setStatus("No recording to save.", "#ed4c63");
    return;
  }
  
  setStatus("Uploading to Google Drive...", "#f4b400");
  saveToDriveBtn.disabled = true;

  const metadata = {
    name: `recording-${new Date().toISOString()}.webm`,
    mimeType: 'video/webm',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', recordedBlob);

  fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + googleAuth.currentUser.get().getAuthResponse().access_token }),
    body: form,
  }).then(res => res.json()).then(file => {
    if (file.error) throw new Error(file.error.message);
    setStatus(`Saved as '${file.name}' to Drive!`, "#1dde88");
  }).catch(error => {
    setStatus(`Upload failed: ${error.message}`, "#ed4c63");
    if(googleAuth.isSignedIn.get()) saveToDriveBtn.disabled = false;
  });
});

// =================================================================
// 5. APP INITIALIZATION
// =================================================================
window.onload = () => {
  // **BUG FIX**: This function is called by the Google API script once it's loaded
  // It ensures `gapi` is defined before we use it.
  const handleClientLoad = () => gapi.load('client:auth2', initClient);

  // Check if gapi is already there, otherwise wait for the script to call our function
  if (window.gapi) {
    handleClientLoad();
  } else {
    // This is a fallback in case the script tag loading order is wrong
    let gapiWait = setInterval(() => {
        if (window.gapi) {
            clearInterval(gapiWait);
            handleClientLoad();
        }
    }, 100);
  }
  
  // Set the initial UI state
  setIdleState();
  startPreview(); // Start with a webcam preview
  setStatus("Please authorize Google to save recordings.");
};
