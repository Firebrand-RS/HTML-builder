const path = require('path');
const fs = require('fs');
const { stdout } = process;

const filePath = path.resolve(__dirname, 'text.txt');
const readStream = fs.createReadStream(filePath);
let collectedText = '';

readStream.on('data', (chank) => collectedText += chank);
readStream.on('end', () => stdout.write(collectedText));