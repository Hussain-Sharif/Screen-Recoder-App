let videoEle=document.querySelector('video')
let recordBtnCont=document.querySelector('.record-btn-cont')
let recordBtn=document.querySelector('.record-btn')

let contraints={
    video:true,
    audio:true
}

let recorderFlag=false;
let recorder
let chunks=[] // Media is stored in Chunk [chunk by chunk]

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
        }else{
            recorder.stop()
            recordBtn.classList.remove('scale-record')
        }
    })
})