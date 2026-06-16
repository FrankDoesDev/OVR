const sharp = require('sharp');
const path = require('path');

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&amp;display=swap');
    </style>
  </defs>
  <rect width="512" height="512" rx="80" fill="#161514"/>
  <text x="256" y="290" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="180" font-weight="400" fill="#efeee8" letter-spacing="8">OVR</text>
</svg>`;

async function generateIcons() {
  const iconsDir = path.join(__dirname, 'src-tauri', 'icons');

  // Generate 512x512 PNG
  await sharp(Buffer.from(svgIcon))
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon.png'));
  console.log('Generated icon.png');

  // Generate 256x256 PNG for ICO
  await sharp(Buffer.from(svgIcon))
    .resize(256, 256)
    .png()
    .toFile(path.join(iconsDir, 'icon_256.png'));
  console.log('Generated icon_256.png');

  // Generate 128x128 PNG
  await sharp(Buffer.from(svgIcon))
    .resize(128, 128)
    .png()
    .toFile(path.join(iconsDir, 'icon_128.png'));
  console.log('Generated icon_128.png');

  // Generate 32x32 PNG
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(path.join(iconsDir, 'icon_32.png'));
  console.log('Generated icon_32.png');

  console.log('All icons generated!');
}

generateIcons().catch(console.error);
