const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const downloadBtn = document.getElementById("downloadBtn");
const preview = document.getElementById("preview");
const status = document.getElementById("status");

let mediaRecorder = null;
let recordedChunks = [];
let stream = null;

function setStatus(message, color = "#aedcff") {
  status.textContent = message;
  status.style.color = color;
}

startBtn.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    preview.srcObject = stream;
    preview.play();

    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      preview.srcObject = null;
      preview.src = URL.createObjectURL(blob);
      preview.controls = true;
      preview.play();
      downloadBtn.disabled = false;
      setStatus("Recording finished. Ready to download.", "#6effa7");
    };
    mediaRecorder.start();

    setStatus("Recording in progress...", "#ffe266");

    startBtn.disabled = true;
    stopBtn.disabled = false;
    downloadBtn.disabled = true;
  } catch (e) {
    setStatus("Error: Permission denied or no display found.", "#ff3860");
    console.error(e);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

stopBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    stream.getTracks().forEach(track => track.stop());
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

downloadBtn.addEventListener("click", () => {
  if (recordedChunks.length) {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `screen-record-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setStatus("Downloaded! Ready for next recording.", "#aedcff");
    }, 120);
  }
});

// Reset UI and status on load
setStatus("Ready to record your screen");
stopBtn.disabled = true;
downloadBtn.disabled = true;
preview.controls = false;
