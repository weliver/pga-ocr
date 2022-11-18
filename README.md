# golf-bot & Leaderboard Scraper
So many societies, so much data entry, so much opportunity to make life a little easier and our daily competitions more fun!

## Objective
Create an OCR process that's scrapes leaderboard screenshots and outputs data to csv.

## Requirements
When a user provides the following:
- Society Name
- Event Name
- Event Date
- URL(s) of screenshots

They should receive a csv with an output of:
- File name: `SOCIETY_EVENTNAME_EVENTDATE.csv`
- Columns:
  - Rank
  - Player Name
  - R1 Score
  - R2 Score
  - R3 Score
  - R4 Score
  - Total Score

## Approach
Testing using [tesseract.js](https://github.com/naptha/tesseract.js)

### MVP
CLI that uses local files.

### v0.0.1
Standalone API

### v0.1.0
Discord Bot that proceses requests in a restricted channel.

### v0.2.0
SPA w/ limited user authentication.


