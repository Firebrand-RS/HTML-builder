const path = require('path');
const fs = require('fs');
const { stdout, stdin } = process;

const filePath = path.join(__dirname, 'user-input.txt');

const errorCallback = (err) => {
  if (err) {
    throw err;
  }
}

fs.writeFile(filePath, '', errorCallback);
stdout.write('Enter any text:\n--------------\n');
stdin.on('data', (inputData) => {
  if (inputData.toString().trim() === 'exit') {
    process.exit();
  }

  fs.appendFile(filePath, inputData, errorCallback);

});


process.on('SIGINT', () => process.exit());
process.on('exit', () => stdout.write(`--------------\nBye!`));

