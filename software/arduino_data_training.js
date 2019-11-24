async function load() {
  const tf = require('@tensorflow/tfjs');
  
  const knnClassifier = require('./node_modules/@tensorflow-models/knn-classifier/dist/knn-classifier');
  // const webcamElement = document.getElementById('webcam');
  const fs = require('fs');
  const csvParser = require('csv-parser');

  const classifier = knnClassifier.create();
  

async function toDatasetObject(dataset) {
  const result = await Promise.all(
    Object.entries(dataset).map(async ([label,value], index) => {
      const data = await value.data();

      return {
        label,
        data: Array.from(data),
        shape: value.shape
      };
   })
  );

  return result;
};


async function saveClassifierInToFile() {
  const dataset = classifier.getClassifierDataset();
  Object.entries(dataset).map(async ([label,value], index) => {
    const data = await value.data();
  });
  const datasetOjb = await toDatasetObject(dataset);
  const jsonStr = JSON.stringify(datasetOjb);
  //can be change to other source
  fs.writeFileSync('./knnDataModel2.json', jsonStr);
}


  // const max = tf.scalar([19.531578063964844,19.5860595703125,19.38175392150879,3.5772268772125244,7.074430465698242,8.998656272888184]);
  // const min = tf.tensor1d([-19.51795768737793,-7.7091169357299805,-14.873419761657715,-3.3823609352111816,-6.74364709854126,-7.708508491516113]);
  const max = tf.scalar(180);
  const min = tf.scalar(-180);
  const scale = max.sub(min);
  const trainingData = []
  fs.createReadStream('./arduinoTrainingData.csv')
      .pipe(csvParser({headers: false}))
      .on('data', (data) => trainingData.push(Object.values(data)))
      .on('end', loadModel);

  async function loadModel() {
      console.log('Loading mobilenet..');
      
      // Load the model.
      // let net = await mobilenet.load();
      console.log('Successfully loaded model');
      
      const shuffledData = await tf.data.array(trainingData).shuffle(trainingData.length, 4).toArray();
      const train_test_split = Math.floor(shuffledData.length * 0.8);
      const train_data = shuffledData.slice(0, train_test_split);
      
      const test_data = shuffledData.slice(train_test_split);
      const train_data_with_activity = {}
      for (const td of train_data) {
        const labelIndex = td.length - 1
        if (!train_data_with_activity[td[labelIndex]]) {
          train_data_with_activity[td[labelIndex]] = []
        }
        train_data_with_activity[td[labelIndex]].push(td);
      }

      const test_data_with_activity = {}
      for (const td of test_data) {
        const labelIndex = td.length - 1
        if (!test_data_with_activity[td[labelIndex]]) {
          test_data_with_activity[td[labelIndex]] = []
        }
        test_data_with_activity[td[labelIndex]].push(td);
      }
      
      for (const activity of Object.keys(train_data_with_activity)) {
        const train_data_per_activity = train_data_with_activity[activity]
        for (const activityData of train_data_per_activity) {
          // const chunkData = train_data_per_activity.slice(i, i + 10);
          const acitvityData100 = activityData.slice(0, activityData.length - 1);
          const features1 = tf.tensor(acitvityData100.slice(0, 150), [3, 50], 'float32').sub(min).div(scale);
          const features2 = tf.tensor(acitvityData100.slice(150), [3, 50], 'float32').sub(min).div(scale);
          // const label = activityData[activityData.length - 1]
          // const dataToFit = chunkData.map(cd => tf.tensor1d(cd.slice(0, cd.length - 1).map(f => Number(f))).sub(min).div(scale).arraySync());
          // let dataToFitFlattened = [].concat.apply([], dataToFit);
          // console.log('dataToFitFlattened', dataToFitFlattened.length);
          // dataToFitFlattened = dataToFitFlattened.concat(dataToFitFlattened, dataToFitFlattened);
          // const dataToFitFlattenedTF = tf.tensor3d(dataToFitFlattened, [10, 6, 3]);
          // console.log('dataToFitFlattenedTF', dataToFitFlattenedTF);
          // const activation = net.infer(dataToFitFlattenedTF, 'conv_preds');
          classifier.addExample(features1, activity);
          classifier.addExample(features2, activity);
        } 
      }
      saveClassifierInToFile();
      // loadClassifierFromLFile();
      let correctPrediction = 0;
      
      for (const activity of Object.keys(test_data_with_activity)) {
        const test_data_per_activity = test_data_with_activity[activity];
        for (const activityData of test_data_per_activity) {
          const acitvityData100 = activityData.slice(0, activityData.length - 1);
          const features1 = tf.tensor(acitvityData100.slice(0, 150), [3, 50], 'float32').sub(min).div(scale);
          const features2 = tf.tensor(acitvityData100.slice(150), [3, 50], 'float32').sub(min).div(scale);
          // const label = activityData[activityData.length - 1]
          
          // const chunkData = test_data_per_activity.slice(i, i + 10);
          // const dataToFit = chunkData.map(cd => tf.tensor1d(dataLabels.map(dl => Number(cd[dl]))).sub(min).div(scale).arraySync());
          // let dataToFitFlattened = [].concat.apply([], dataToFit);
          // dataToFitFlattened = dataToFitFlattened.concat(dataToFitFlattened, dataToFitFlattened)
          // const activation = tf.tensor3d(dataToFitFlattened, [10, 6, 3]); //net.infer(tf.tensor3d(dataToFitFlattened, [10, 6, 3]), 'conv_preds');
          const predictedClass1 = await classifier.predictClass(features1);
          if (activity === predictedClass1.label) {
            correctPrediction ++;
          }
          const predictedClass2 = await classifier.predictClass(features2);
          if (activity === predictedClass2.label) {
            correctPrediction ++;
          }
          // console.log(`Predicted class: ${predictedClass.label}, Actual class: ${activity}`);    
        } 
      }
      console.log(`Predicted accuracy: ${correctPrediction} of ${test_data.length*2}`);    
      // while(true) {
        
      //   if (classifier.getNumClasses() > 0) {
      //     const img = await webcam.capture();
      //     const activation = net.infer(img, 'conv_preds');
      //     const result = await classifier.predictClass(activation);
      //     const classes = ['A', 'B', 'C'];
        
      //     document.getElementById('console').innerText = `
      //     prediction: ${classes[result.label]}\n
      //     probability: ${result.confidences[result.label]}
      //   `;
      //   // Dispose the tensor to release the memory.
      //     img.dispose();
      //   }
      //   // Give some breathing room by waiting for the next animation frame to
      //   // fire.
      //   await tf.nextFrame();
      // }
    // Make a prediction through the model on our image.
  //   const imgEl = document.getElementById('img');
  //   const result = await net.classify(imgEl);
  //   console.log(result);
  }
}

module.exports = {
  load
}
// app();
