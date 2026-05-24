const fs = require('fs');
const path = require('path');

// Create canvas-based icons (Node.js canvas)
const { createCanvas } = require('canvas');

const sizes = [48, 72, 96, 128, 144, 192, 256, 512];
const publicDir = path.join(__dirname, '..', 'public');

async function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#ffd700');
  gradient.addColorStop(1, '#ffaa00');
  
  // Draw rounded rect
  const radius = size * 0.2;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();
  
  // Draw "A" text
  ctx.fillStyle = '#000000';
  ctx.font = `bold ${size * 0.6}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', size / 2, size * 0.55);
  
  // Save PNG
  const buffer = canvas.toBuffer('image/png');
  const fileName = `icon-${size}x${size}.png`;
  fs.writeFileSync(path.join(publicDir, fileName), buffer);
  console.log(`Generated ${fileName}`);
}

async function main() {
  console.log('Generating PNG icons...');
  
  for (const size of sizes) {
    await generateIcon(size);
  }
  
  console.log('Done!');
}

main().catch(console.error);
