const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('node:path');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');


const csvDir = path.join(__dirname, 'public', 'csv');
const imgDir = path.join(__dirname, 'public', 'images', 'processed');

[csvDir, imgDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// For hacking about and testing your sanity
const mockInput = {
  eventName: "Emerald Basin Reserve TGC",
  screenshots: [
    'https://cdn.discordapp.com/attachments/796765629856219146/1042914505979609178/kinetic-hd-1.jpg',
    'https://cdn.discordapp.com/attachments/796765629856219146/1042914506302558279/kinetic-hd-2.jpg',
    'https://cdn.discordapp.com/attachments/796765629856219146/1042914506642309250/kinetic-hd-3.jpg',
    'https://cdn.discordapp.com/attachments/796765629856219146/1042914507032367154/kinetic-hd-4.jpg'
  ]
};
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



// @TODO Clean up your promises, buddy.
const processImages = async (images) => {
  const scoreList = {};

  const sharpPromises = [];

  const fetchImages = await images.map(async img => {
    const imagePath = await fetch(img);
    return await imagePath.buffer();
  });

  await Promise.all(fetchImages).then(async fetchedImages => {
    let imgCount = 0;
    fetchedImages.map(ib => {
      imgCount++;
      Object.keys(captureAreas).map(async area => {
        //@TODO set up params for row count
        for (let i = 0; i < 10; i++) {
          const ref = `${imgCount}${i}`;
          const areaCropFile = path.join(__dirname, 'public', 'images', 'processed', `${ref}-${area}.jpg`);
          sharpPromises.push(
            sharp(ib)
              .resize(1920)
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
                console.error("Error while processing images with Sharp", err);
              })
          );
        }
      });
    });
  });

  return Promise.all(sharpPromises).then(e => {
    console.log("scorelist", scoreList);
    return scoreList;
  }).catch(err => console.error("finalResult fail", err));
};



const recognizeImages = async (images) => {

  const scheduler = Tesseract.createScheduler();
  const worker1 = Tesseract.createWorker();
  const worker2 = Tesseract.createWorker();


  await worker1.load();
  await worker1.loadLanguage('eng');
  await worker1.initialize('eng');
  scheduler.addWorker(worker1);

  await worker2.load();
  await worker2.loadLanguage('eng');
  await worker2.initialize('eng');
  scheduler.addWorker(worker2);

  const output = {};
  try {
    await Promise.all(
      Object.keys(captureAreas).map(async area => {
        for (const i of Object.keys(images)) {
          const { data: { text } } = await scheduler.addJob('recognize', images[i][area]);
          output[i] = {
            ...output[i],
            [area]: text.trim()
          };
        }
      })
    );
    await scheduler.terminate();
  } catch (e) {
    console.error("Error in Tesseract recognize", e);
  }
  return output;
};


const resultsToCsv = async (output, params) => {
  const csvFileName = `${params.eventName}-${Date.now()}.csv`;
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
  const csv = await csvWriter
    .writeRecords(Object.values(output))
    .then(c => {
      console.log(".csv created: ", csvFileName);
      return csvFileName;
    })
    .catch(err => {
      console.error("error creating .csv", err);
    });
  return csv;
};

const clean = () => {
  console.log("Clearing image directory");
  // @todo Clean up csv dir eventually
  [imgDir].forEach(dir => {

    fs.readdir(dir, (err, files) => {
      console.log("dir", dir);
      console.log("files...", files)
      if (err) throw err;

      for (const file of files) {
        fs.unlink(path.join(dir, file), (err) => {
          if (err) throw err;
        });
      }
    });
  });

};

// For testing w/ CLI
// if (process.argv.length > 0) {
//   console.log("Using CLI");
//   const [eventName, ...screenshots] = process.argv.slice(2);
//   leaderboardScraper({
//     eventName,
//     screenshots
//   });
// }
// leaderboardScraper(mockInput);


const leaderboardScraper = (
  params
) => processImages(params.screenshots)
  .then(recognizeImages)
  .then(res => resultsToCsv(res, params))
  .catch(err => console.error("error", err))
  .finally(() => {
    clean();
  });

module.exports = {
  leaderboardScraper
};