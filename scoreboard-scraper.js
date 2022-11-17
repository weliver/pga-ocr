const fs = require('node:fs');
const path = require('node:path');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const Tesseract = require('tesseract.js');

const sharp = require('sharp');
const { ConnectionService } = require('discord.js');


const mockInput = {
  society: "Kinetic",
  eventName: "Emerald Basin Reserve TGC",
  eventDate: "Nov 13 - Nov 19",
  screenShots: [
    'kinetic-hd-1.jpg',
    'kinetic-hd-2.jpg',
    'kinetic-hd-3.jpg',
    'kinetic-hd-4.jpg',
    // 'rotg-persephone-1.jpg',
    // 'rotg-persephone-2.jpg'
  ]
};


const testImagePath = path.join(__dirname, 'test-images', 'rotg-persephone-1.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'kinetic-hd-1.jpg');



// const testImagePath = path.join(__dirname, 'test-images', 'rotg-persephone-1-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'single-row-test-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'column-test.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'column-test-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'ElbnDol3Ro.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'score-row.jpg');

const captureAreas = {
  player: {
    left: 270,
    top: 340,
    width: 350,
    height: 30
  },
  round1: {
    left: 1190,
    top: 340,
    width: 40,
    height: 40
  },
  round2: {
    left: 1320,
    top: 340,
    width: 40,
    height: 40
  },
  round3: {
    left: 1450,
    top: 340,
    width: 40,
    height: 40
  },
  round4: {
    left: 1580,
    top: 340,
    width: 40,
    height: 40
  },
  final: {
    left: 1720,
    top: 340,
    width: 40,
    height: 40
  }
};



const processImages = async (images) => {

  const scoreList = {};
  const promises = [];

  let imgCount = 0;
  await images.map(async img => {
    imgCount++;
    const imagePath = path.join(__dirname, 'test-images', img);
    await Object.keys(captureAreas).map(async area => {

      for (let i = 0; i < 10; i++) {
        const ref = `${imgCount}${i}`;
        const areaCropFile = path.join(__dirname, 'test-images', 'processed', `${ref}-${area}.jpg`);
        promises.push(
          sharp(imagePath)
            .extract({
              ...captureAreas[area],
              top: (captureAreas[area].top + (60 * i)) + 15,
            })
            .negate()
            .grayscale()
            .gamma(1, 3)
            .threshold(90)
            .toFile(areaCropFile)
            .then(info => {
              scoreList[ref] = {
                ...scoreList[ref],
                [area]: areaCropFile
              };
            })
            .catch(err => {
              console.error("sharp error", err);
            })
        );
      }
    });
  });
  const finalResult = await Promise.all(promises).then(e => scoreList).catch(err => console.error("finalResult fail", err));
  return finalResult;
};

processImages(mockInput.screenShots).then(async res => {
  console.log("processImage complete", res);
  return await tessList(res);
})
  .catch(err => console.error("error", err));
// .finally(() => {
//   console.log("end");
//   process.exit();
// });


const worker = Tesseract.createWorker();
const tessList = async (images) => {
  console.log("tessList images", images);
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  console.log("scoreList", images);
  const output = {};
  try {
    for (const area of Object.keys(captureAreas)) {
      for (const i of Object.keys(images)) {
        console.log(`working on area`, images[i][area]);
        const { data: { text } } = await worker.recognize(images[i][area]);
        output[i] = {
          ...output[i],
          [area]: text.trim()
        };
      }

    }
  } catch (e) {
    console.log("error", e);
  }

  const sorted = sortObject(output);
  console.log(sorted);
  // console.log(Object.values(sorted));

  const csvFileName = `${mockInput.society}-${mockInput.eventName}-${mockInput.eventDate}-${Date.now()}.csv`;
  const csvWriter = createCsvWriter({
    path: path.join(__dirname, 'public', 'csv', csvFileName),
    header: [
      {
        id: 'player',
        title: 'Player'
      },
      {
        id: 'round1',
        title: 'Round 1'
      },
      {
        id: 'round2',
        title: 'Round 2'
      },
      {
        id: 'round3',
        title: 'Round 3'
      },
      {
        id: 'round4',
        title: 'Round 4'
      },
      {
        id: 'final',
        title: 'Final'
      },
    ]
  });
  csvWriter
    .writeRecords(Object.values(output))
    .then(() => console.log(".csv created: ", csvFileName));

  await worker.terminate();

};

const sortObject = obj => Object.keys(obj).sort().reduce((res, key) => (res[key] = obj[key], res), {})
// tessList(scoreList);

// (async() => {
//   await worker.load();
//   await worker.loadLanguage('eng');
//   await worker.initialize('eng');
//   const { data: { text } } = await worker.recognize(testImagePath, { firstRow });
//   console.log(text);
//   await worker.terminate();
// })();

// const tess = (path) => Tesseract.recognize(
//   path,
//   'eng',
//   // {
//   //   logger: m => console.log(m),
//   //   // rectangle: firstRow
//   // }
// ).then(({ data: { text, ...rest } }) => {
//   console.log(text);
// });