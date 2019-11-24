const fs = require('fs');
let dataToSave = [];
let labelToStore = 'swimming';
function prepareDataToSave(data) {
    if (dataToSave.length >= 100) {
        saveData();
        return true;
    } else {
        dataToSave.push(data.replace('y', ''));
        console.log('data aadded', dataToSave.length, data)
        
        return false;
    }
    
}

function resetDataToSave() {
    dataToSave = [];
}

function setLabel(label) {
    labelToStore = label;
}
function saveData() {    
    fs.appendFileSync('./arduinoTrainingData.csv', '\r\n' + dataToSave.join(',') + ',' + labelToStore);
    dataToSave = [];
    return true;
}

function showData() {
    console.log('sample length', dataToSave.length)
}

module.exports = {
    prepareDataToSave,
    saveData,
    showData,
    setLabel,
    resetDataToSave
}