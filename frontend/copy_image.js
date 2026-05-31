const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\ShreyasWakhare\\.gemini\\antigravity-ide\\brain\\ae755cbf-5036-44c5-bad8-0d4c93ba54ac\\auth_globe_1780161367217.png";
const dest = path.join(__dirname, 'public', 'images', 'auth_globe.png');

try {
  fs.copyFileSync(src, dest);
  console.log('SUCCESS: File copied from ' + src + ' to ' + dest);
} catch (err) {
  console.error('ERROR copying file:', err);
}
