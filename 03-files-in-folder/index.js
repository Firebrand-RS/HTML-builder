const path = require('path');
const fs = require('fs');
const { stdout } = process;

const TASK_FOLDER = 'secret-folder';

const folderPath = path.join(__dirname, TASK_FOLDER);
fs.promises.readdir(folderPath)
  .then((contents) => {
    return contents.map((content) => {
      const contentPath = path.resolve(folderPath, content);
      return getFileStatsString(contentPath);
    });
  })
  .then(getFileStatsPromises => Promise.allSettled(getFileStatsPromises))
  .then(results => results
    .filter(({ status }) => status !== 'rejected')
    .map(({ value }) => value)
    .join('\n'))
  .then((resultString) => stdout.write(resultString));

  function getFileStatsString(contentPath) {
    return new Promise((resolve, reject) => {
      fs.stat(contentPath, (error, stat) => {
        if (error) {
          reject(error);
        }

        if (stat.isDirectory()) {
          reject('is directory');
        }

        const { name, ext } = path.parse(contentPath);
        const { size } = stat;
        const statString = `${name} - ${ext.slice(1)} - ${Math.ceil(size / 1024)}kb`;
        resolve(statString);
      });
    });
  }