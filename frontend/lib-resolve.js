// This file is used for resolving aliases in Netlify build
const path = require('path');

module.exports = {
  '@': path.resolve(__dirname, './src')
};