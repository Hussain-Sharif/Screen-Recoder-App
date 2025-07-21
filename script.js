let videoEle=document.querySelector('video')
let recordBtnCont=document.querySelector('.record-btn-cont')
let recordBtn=document.querySelector('.record-btn')
let captureBtnCont=document.querySelector('.capture-btn-cont')
let captureBtn=document.querySelector('.Capture-btn')

let contraints={
    video:true,
    audio:false
}

let recorderFlag=false;
let recorder
let chunks=[] // Media is stored in Chunk [chunk by chunk]

const launchRecording=()=>{
    navigator.mediaDevices.getUserMedia(contraints)
.then((stream)=>{
    console.log(stream)
    videoEle.srcObject=stream;

    recorder=new MediaRecorder(stream)
    recorder.addEventListener("start",(e)=>{
        chunks=[] // REMOVING THE PREVIOUS chunks to start fresh recording
    })

    recorder.addEventListener('dataavailable',(e)=>{
        chunks.push(e.data)
    })

    recorder.addEventListener("stop",(e)=>{
        // To Download the recoding
        // Convert the Media Chunk data into video
        let blobData=new Blob(chunks,{type:'video/mp4'})
        let videoURL=URL.createObjectURL(blobData)
        let a=document.createElement('a')
        a.href=videoURL
        a.download="stream.mp4"
        a.click()
    })

    recordBtnCont.addEventListener('click',()=>{
        if(!recorder) return ;

        recorderFlag=!recorderFlag
        if(recorderFlag){
            recorder.start()
            recordBtn.classList.add('scale-record')
            startTimer()
        }else{
            recorder.stop()
            recordBtn.classList.remove('scale-record')
            stopTimer()
        }
    })
})

// capture Code:
captureBtnCont.addEventListener('click',(e)=>{
    captureBtn.classList.add('scale-capture')

    const canvasEle=document.createElement('canvas')
    let canvasContext=canvasEle.getContext('2d')
    
    canvasEle.width=videoEle.width
    canvasEle.height=videoEle.height
    canvasContext.drawImage(videoEle,0,0,canvasEle.width,canvasEle.height) // Destination co-ordinates
    
    const imageURL=canvasEle.toDataURL()
    let a=document.createElement('a')
    a.href=imageURL
    a.download="image.jpg"
    a.click()
    setTimeout(()=>{
        captureBtn.classList.remove('scale-capture')
    },1000)
})

}

const startRecordingEle=document.querySelector(".start-Record-btn")
startRecordingEle.addEventListener('click',()=>{
    launchRecording()
})




let timerID
let timerEle=document.querySelector('.timer')

function startTimer(){
    let counter=0 //Total Seconds
    timerEle.style.display="block"
    function displayTimer(){
        let totalSeconds=counter
        const hrs=Number.parseInt(totalSeconds/3600)
        totalSeconds=totalSeconds%3600

        let mins=Number.parseInt(totalSeconds/60)
        totalSeconds=totalSeconds%60

        let seconds=totalSeconds
        timerEle.textContent=`${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
        counter++;
    }
    timerID=setInterval(displayTimer,1000)
}

function stopTimer(){
    clearInterval(timerID)
    timerEle.style.display="none"
}



