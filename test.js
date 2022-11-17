const fs = require('node:fs');
const path = require('node:path');
const Tesseract = require('tesseract.js');

const sharp = require('sharp');

const testImagePath = path.join(__dirname, 'test-images', 'rotg-persephone-1.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'rotg-persephone-1-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'single-row-test-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'column-test.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'column-test-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'ElbnDol3Ro.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'score-row.jpg');


const rows = [
  //Row 1, Name
  {
    left: 270,
    top: 340,
    // width: 200,
    width: 1500, //width of whoel row at 1920

    height: 30
  },
  //Row 2, Score
  {
    left: 1180,
    top: 350,
    width: 620,
    height: 40
  }
];


for (let i = 0; i < 10; i++) {
  const fileName = path.join(__dirname, 'test-images', 'processed', `name-${i}.jpg`);
  sharp(testImagePath)
    .extract({
      left: 270,
      top: (340 + (60 * i))+15,
      width: 350,
      height: 30
    })
    .negate()
    // .grayscale()
    .threshold(110)
    .toFile(fileName)
    .then(info => {
      // console.log("sharp", info);
      tess(fileName);

    })
    .catch(err => {
      console.error("sharp error", err);
    });


    // const fileNameScore = path.join(__dirname, 'test-images', 'processed', `score-${i}.jpg`);
    // sharp(testImagePath)
    //   .extract({
    //     left: 1180,
    //     top: (340 + (60 * i))+15,
    //     width: 620,
    //     height: 30
    //   })
    //   .negate()
    //   // .grayscale()
    //   .threshold(110)
    //   .toFile(fileNameScore)
    //   .then(info => {
    //     // console.log("sharp", info);
    //     tess(fileNameScore);

    //   })
    //   .catch(err => {
    //     console.error("sharp error", err);
    //   });

}


const tess = async (filePath) => {
  const worker = Tesseract.createWorker();
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data: { text } } = await worker.recognize(filePath);
  console.log(text);
  await worker.terminate();
};

// const tess = (path) => Tesseract.recognize(
//   path,
//   'eng',
//   // {
//   //   logger: m => console.log(m),
//   //   // rectangle: firstRow
//   // }
// ).then(({ data: { text, ...rest } }) => {
//   console.log(text);
//   // output[path] = text;
//   // console.log(output);
// });
