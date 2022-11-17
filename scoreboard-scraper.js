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


const scoreboardScrape = (
  params
) => {
  console.log("scoreboardScrape", params);
  processImages(params.screenShots).then(async res => {
    console.log("processImage complete", res);
    return await tessList(res, params);
  }).catch(err => console.error("error", err));
};

// const testImagePath = path.join(__dirname, 'test-images', 'rotg-persephone-1.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'kinetic-hd-1.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'rotg-persephone-1-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'single-row-test-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'column-test.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'column-test-inverted.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'ElbnDol3Ro.jpg');
// const testImagePath = path.join(__dirname, 'test-images', 'score-row.jpg');

// @TODO parameterize input based on image size.
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
    left: 1710,
    top: 340,
    width: 60,
    height: 40
  }
};



const processImages = async (images) => {

  const scoreList = {};
  const promises = [];

  let imgCount = 0;
  await images.map(async img => {
    imgCount++;
    // @todo confirm imagePath w/ params is okay
    // const imagePath = path.join(__dirname, 'test-images', img);
    const imagePath = img;

    await Object.keys(captureAreas).map(async area => {
      //@TODO parameterize 10 count
      for (let i = 0; i < 10; i++) {
        const ref = `${imgCount}${i}`;
        const areaCropFile = path.join(__dirname, 'public', 'images', 'processed', `${ref}-${area}.jpg`);
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

const worker = Tesseract.createWorker();
const tessList = async (images, params) => {
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

  const sortObject = obj => Object.keys(obj).sort().reduce((res, key) => (res[key] = obj[key], res), {});
  const sorted = sortObject(output);
  // console.log(sorted);
  // console.log(Object.values(sorted));

  const csvFileName = `${params.society}-${params.eventName}-${params.eventDate}-${Date.now()}.csv`;
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
    .then(() => {
      console.log(".csv created: ", csvFileName);

    })
    .catch(err => {
      console.error("error creating .csv", err);
    });

  await worker.terminate();

};

if (process.argv.length > 0) {
  console.log("Using CLI");
  const [society, eventName, eventDate, ...screenShots] = process.argv.slice(2);
  scoreboardScrape({
    society,
    eventName,
    eventDate,
    screenShots
  });
}



module.exports = {
  scoreboardScrape
};






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