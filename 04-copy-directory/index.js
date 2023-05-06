const path = require('path');
const fs = require('fs');
const { stdout } = process;

const FOLDER_TO_COPY_NAME = 'files';
const COPY_FOLDER_NAME = 'files-copy';


copyDirectory(__dirname, FOLDER_TO_COPY_NAME, COPY_FOLDER_NAME)
  .then((completeMsg) => stdout.write(completeMsg));

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
