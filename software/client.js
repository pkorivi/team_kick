// import './person';
import io from 'socket.io-client';

const startButton = document.getElementById('class-start');
const stopButton = document.getElementById('class-stop');
const labelingBlock = document.getElementById('labeling_block');
const swimmingButton = document.getElementById('class-swimming');
const drowningButton = document.getElementById('class-drowning');
const noneButton = document.getElementById('class-none');
const label_image = document.getElementById('label_image');
const startRecording = () => {
    // label_image.src = "./images/swimming.gif"
    socket.emit('recording', true);
}

const stopRecording = () => {
    // label_image.src = "./images/drowning.gif"
    socket.emit('recording', false);   
}

const markData = (label) => {
    socket.emit('labelData', label);
}

startButton.addEventListener('click', () => startRecording());
stopButton.addEventListener('click', () => stopRecording());

swimmingButton.addEventListener('click', () => markData('swimming'));
drowningButton.addEventListener('click', () => markData('drowning'));
noneButton.addEventListener('click', () => markData('none'));
//   document.getElementById('class-c').addEventListener('click', () => addExample(2));
  
const socket =
    io('http://localhost:8081',
       {reconnectionDelay: 300, reconnectionDelayMax: 300});
// const testSample = [2.668,-114.333,-1.908,4.786,25.707,-45.21,78,0]; 

       
// functions to handle socket events
socket.on('connect', () => {
    // document.getElementById('status').style.display = 'none';
    document.getElementById('status').innerHTML = 'connected';
});

// socket.on('trainingComplete', () => {
//     document.getElementById('trainingStatus').innerHTML = 'Training Complete';
//     document.getElementById('predictSample').innerHTML = '[' + testSample.join(', ') + ']';
//     predictContainer.style.display = 'block';
// });

socket.on('recordingStarted', () => {
    document.getElementById('status').innerHTML = 'recording';
    stopButton.disabled = false;
    startButton.disabled = true;
});

socket.on('recordingStopped', () => {
    document.getElementById('status').innerHTML = 'connected';
    stopButton.disabled = true;
    startButton.disabled = false;
    // labelingBlock.style.visibility = 'hidden';
});

socket.on('disconnect', () => {
    document.getElementById('status').innerHTML = 'disconnected';   
});

socket.on('markData', () => {
    console.log('data marked')
    labelingBlock.style.visibility = 'visible';
})

socket.on('predictActivity', label => {
    console.log('predictActivity', label)
    switch(label) {
        case 'swimming': 
        label_image.src = './images/swimming.gif'
        break;
        case 'drowning': 
        label_image.src = './images/drowning.gif'
        break;
        default: label_image.src = './images/none.gif'
    }
})
// function plotPredictResult(result) {
//     predictButton.disabled = false;
//     document.getElementById('predictResult').innerHTML = result;
//     console.log(result);
// }