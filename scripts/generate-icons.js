const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const svgPath = path.join(__dirname, '../assets/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generateIcons() {
    for (const size of sizes) {
        await sharp(svgBuffer)
            .resize(size, size)
            .png()
            .toFile(path.join(__dirname, `../assets/icon${size}.png`));
    }
    
    // Also create default favicon
    await sharp(svgBuffer)
        .resize(16, 16)
        .png()
        .toFile(path.join(__dirname, '../assets/default-favicon.png'));
}

generateIcons().catch(console.error); 