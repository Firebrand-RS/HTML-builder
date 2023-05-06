const path = require('path');
const fs = require('fs');
const { stdout } = process;

const DIST_FOLDER_NAME = 'project-dist';
const MARKUP_TEMPLATE_NAME = 'template.html';
const MARKUP_BUNDLE_NAME = 'index.html';
const COMPONENTS_FOLDER_NAME = 'components';
const TASK_FOLDER_TO_BUNDLE = 'styles';
const STYLE_BUNDLE_NAME = 'style.css';
const FOLDER_TO_COPY_NAME = 'assets';

Promise.all([
    bundleMarkup(),
    bundleStyles(__dirname, TASK_FOLDER_TO_BUNDLE, STYLE_BUNDLE_NAME, DIST_FOLDER_NAME),
    copyDirectory(__dirname, FOLDER_TO_COPY_NAME, path.join(DIST_FOLDER_NAME, FOLDER_TO_COPY_NAME)),
  ])
  .then((results) => results.forEach((item) => stdout.write(item + '\n')))
  .then(() => stdout.write('----------\nbuild done'))
  .catch((error) => console.log(error));

async function bundleMarkup() {
  const componentsPath = path.join(__dirname, COMPONENTS_FOLDER_NAME);
  const list = await getFileListByExt(componentsPath, '.html');
  const availableComponentMarks = list.map((componentName) => ({ name: componentName, mark: '{{' + componentName.replace('.html', '') + '}}' }));

  const templatePath = path.join(__dirname, MARKUP_TEMPLATE_NAME);
  let template = (await fs.promises.readFile(templatePath)).toString();
  for (let { name, mark } of availableComponentMarks) {
    if (template.includes(mark)) {
      const componentMarkup = (await fs.promises.readFile(path.join(componentsPath, name))).toString();
      template = template.replace(mark, componentMarkup);
    }
  }

  await fs.promises.mkdir(path.join(__dirname, DIST_FOLDER_NAME), { recursive: true });
  await fs.promises.writeFile(path.join(__dirname, DIST_FOLDER_NAME, MARKUP_BUNDLE_NAME), template);
  return 'markup merge done';
}

async function getFileListByExt(dir, ext) {
  const contentListDirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const fileDirents = contentListDirents.filter((dirent) => dirent.isFile());
  const fileNames = fileDirents.map((fileDirent) => fileDirent.name);
  const filteredByExt = fileNames.filter((fileName) => {
    const fileExt = path.extname(path.join(dir, fileName));
    return fileExt === ext;
  });
  return filteredByExt;
}

async function copyDirectory(dirName, folderToCopyName, copyFolderName) {
  const folderPath = path.join(dirName, folderToCopyName);
  const folderCopyPath = path.join(dirName, copyFolderName);

  await fs.promises.mkdir(folderCopyPath, {recursive: true});
  await copyInner(folderPath, folderCopyPath);
  return 'copy done';

  async function copyInner(folderPath, folderCopyPath) {
    const fileNameSrcListDirent = await fs.promises.readdir(folderPath, {withFileTypes: true});
    const fileNameDestListDirent = await fs.promises.readdir(folderCopyPath, {withFileTypes: true});
  
    //чистим от излишков
    const fileNameSrcList = fileNameSrcListDirent.map((dirent) => dirent.name);
    const listToDelete = fileNameDestListDirent.filter(({name}) => !fileNameSrcList.includes(name));
    const listToDeletePromises = listToDelete.map((dirent) => {
      const filePath = path.join(folderCopyPath, dirent.name);
      return dirent.isDirectory() ? fs.promises.rm(filePath, { recursive: true, force: true }) : fs.promises.unlink(filePath);
    });
    await Promise.all(listToDeletePromises);

    //копируем
    const promises = [];
    for (let content of fileNameSrcListDirent) {
      if(content.isDirectory()) {
        await fs.promises.mkdir(path.join(folderCopyPath, content.name), {recursive: true});
        await copyInner(path.join(folderPath, content.name), path.join(folderCopyPath, content.name));
      } else {
        const filePathSrc = path.resolve(folderPath, content.name);
        const filePathDest = path.resolve(folderCopyPath, content.name);
        promises.push(fs.promises.copyFile(filePathSrc, filePathDest));      
      }  
    }
    await Promise.all(promises);
    return 'cycle end';
  }
}

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
      await new Promise((resolve,reject) => {
        readStream.on('end', () => {
          resolve();
        });
      })
      return 'writing-end';
    }
  });
  await fileToBundlePromises.reduce((acc, writeFunc) => acc.then(writeFunc), Promise.resolve());
  return 'style merge done';
}
