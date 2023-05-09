const path = require('path');
const fs = require('fs');
const { stdout } = process;

const TASK_FOLDER_TO_BUNDLE = 'styles';
const STYLE_BUNDLE_NAME = 'bundle.css';
const DIST_FOLDER_NAME = 'project-dist';

bundleStyles(__dirname, TASK_FOLDER_TO_BUNDLE, STYLE_BUNDLE_NAME, DIST_FOLDER_NAME)
  .then((completeMsg) => stdout.write(completeMsg))
  .catch((error) => stdout.write(error));

async function bundleStyles(rootDir, taskFolderToBundle, styleBundleName, distFolderName) {
  const bundleFolderPath = path.join(rootDir, taskFolderToBundle);
  const filesInFolderDirent = await fs.promises.readdir(bundleFolderPath, {withFileTypes: true});
  const fileNamelistToBundleDirent = filesInFolderDirent.filter((fileName) => {
    if(fileName.isDirectory()) {
      return false;
    }

    const {name} = fileName;
    const filePath = path.join(bundleFolderPath, name);
    const {ext} = path.parse(filePath);

    if(ext !== '.css') {
      return false;
    }

    return true;
  });

  await fs.promises.mkdir(path.join(rootDir, distFolderName), {recursive: true});
  const writeStream = fs.createWriteStream(path.join(rootDir, distFolderName, styleBundleName));
  const fileToBundlePromises = fileNamelistToBundleDirent.map(({name}) => {
    return async () => {
      const readStream= fs.createReadStream(path.join(rootDir, taskFolderToBundle, name), 'utf-8');
      readStream.on('data', (chunk) => writeStream.write(chunk));
      await new Promise((resolve) => {
        readStream.on('end', () => {
          resolve();
        });
      });
      return 'writing-end';
    };
  });
  await fileToBundlePromises.reduce((acc, writeFunc) => acc.then(writeFunc), Promise.resolve());
  return 'style merge done';
}
