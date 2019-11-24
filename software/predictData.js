const tf = require('@tensorflow/tfjs');  
const knnClassifier = require('./node_modules/@tensorflow-models/knn-classifier/dist/knn-classifier');

const classifier = knnClassifier.create();
const max = tf.scalar(180);
const min = tf.scalar(-180);
const scale = max.sub(min);
  
const featureSize = 100;
async function preparePrediction() {
    const fs = require('fs');
    
    function fromDatasetObject(datasetObject) {
        return Object.entries(datasetObject).reduce((result, [indexString, {label, data, shape}]) => {
        const tensor = tf.tensor2d(data, shape);
        // const index = Number(indexString);
    
        result[label] = tensor;
    
        return result;
        }, {});
    
    }
    function loadClassifierFromLFile() {
        const datasetJson = fs.readFileSync('./knnDataModel.json');
        if (datasetJson) {
            const datasetObj = JSON.parse(datasetJson);
        
            const dataset = fromDatasetObject(datasetObj);
        
            classifier.setClassifierDataset(dataset);
        }
        return classifier;
    }
    loadClassifierFromLFile();
}

let dataToBepredicted = []
let socketIO;

function setSocketIO(io) {
    socketIO = io;
}
async function predictActivity() {
    const data = dataToBepredicted.slice(0, featureSize).join(',').split(',');
    dataToBepredicted = []; // reset data for next prediction
    const features = tf.tensor(data, [3, featureSize], 'float32').sub(min).div(scale);
    const predictedClass = await classifier.predictClass(features);
    socketIO.emit('predictActivity', predictedClass.label)
    
    return predictedClass.label;
}

function accumulateData(data) {
    dataToBepredicted.push(data.replace(/y/g, ''));
    if (dataToBepredicted.length >= featureSize) {
        predictActivity();
    }
    // predictData.predictActivity(data.join('')).then(label => io.emit('predictActivity', label));
}

module.exports = {
    preparePrediction,
    predictActivity,
    accumulateData,
    setSocketIO
}