require('@tensorflow/tfjs-node');

const http = require('http');
const socketio = require('socket.io');
// const pitch_type = require('./pitch_type');
const saveData = require('./saveData');
const predictData = require('./predictData');
const TIMEOUT_BETWEEN_EPOCHS_MS = 500;
const PORT = 8081;

// function sleep(ms = TIMEOUT_BETWEEN_EPOCHS_MS) {
//     return new Promise((resolve) => setTimeout(resolve, ms));
// }

async function run() {
    const port = process.env.PORT|| PORT;
    const server = http.createServer();
    const io = socketio(server);

    let recordData = false;
    let data = [];
    server.listen(port, () => {
        console.log('server started at ', port);        
    });
    predictData.setSocketIO(io);
    io.on('connection', (socket) => {
        socket.on('recording', async (record) => {
            if (record) {
                startRecording();
                io.emit('recordingStarted', '');
                
            } else {
                recordData = false;
                io.emit('recordingStopped', '');
            }            
        });

        socket.on('labelData', (label) => {
            saveData.setLabel(label);
            // io.emit('recordingStopped', '');
        })
    });
    // await require('./arduino_data_training').load();

    function startRecording() {
        data = []
        saveData.resetDataToSave();
        recordData = true;
    }

    function stopRecording() {
        recordData = false;
        io.emit('markData', '');
        saveData.showData();
    }

    function connectBluetooth() {
        const bluetooth = require('node-bluetooth');

        // create bluetooth device instance
        const device = new bluetooth.DeviceINQ();
        
        device.listPairedDevices((bluetoothDevices) => {
            console.log(bluetoothDevices);
        });
        device.findSerialPortChannel('98-d3-71-fd-75-41', function(channel) {
            console.log('Found RFCOMM channel for serial port on %s: ', '998-d3-71-fd-75-41', channel);
          
            // make bluetooth connect to remote device
            bluetooth.connect('98-d3-71-fd-75-41', channel, function(err, connection) {
              if(err) {
                return console.error(err);
              }

              let collectData = false;
              let dataFlowStarted = true;
              connection.on('data', (buffer) => {
                // if (dataFlowStarted) {
                   
                    // dataFlowStarted = false;
                // }
                if (recordData) {
                    let charArray = buffer.toString().trim().split('');
                    // console.log('data started', charArray);
                    const indexOfY = charArray.indexOf('y');
                    if (indexOfY !== -1) {
                        collectData = true;
                        const dataBeforeY = charArray.slice(0, indexOfY);
                        charArray = charArray.slice(indexOfY);
                        if (data.length > 0) {
                            data = data.concat(dataBeforeY);
                            // const dataReadyToBeMarked = saveData.prepareDataToSave(data.join(''));
                            predictData.accumulateData(data.join(''));
                            
                            data = [];
                            // if (dataReadyToBeMarked) {
                            //     collectData = false;
                            //     stopRecording();
                            // }
                        }
                    }
                    if (collectData) {                        
                        data = data.concat(charArray);
                    }
                   
                } else {
                    collectData = false;
                }
                console.log("recevied bluetooth message", buffer.toString());
              });
            
            });
          
          });
       
    }
    await predictData.preparePrediction();
    connectBluetooth();
    // await require('./arduino_data_training').load();
}


run();