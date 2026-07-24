const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) {
      v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    }
    table[n] = v;
  }
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([len, typeData, crc]);
}

function generatePNG(width, height, r, g, b) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 3);
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3;

      const cx = x - width / 2;
      const cy = y - height / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      const radius = width * 0.42;
      const cornerRadius = width * 0.15;

      const dx = Math.max(Math.abs(cx) - (width / 2 - cornerRadius), 0);
      const dy = Math.max(Math.abs(cy) - (height / 2 - cornerRadius), 0);
      const cornerDist = Math.sqrt(dx * dx + dy * dy);

      if (cornerDist > cornerRadius) {
        rawData[px] = 255;
        rawData[px + 1] = 255;
        rawData[px + 2] = 255;
        continue;
      }

      // "GRS" text approximation using simple geometry
      const nx = cx / (width / 2);
      const ny = cy / (height / 2);

      let inText = false;

      // G
      const gx = nx + 0.28;
      const gy = ny + 0.02;
      const gAngle = Math.atan2(gy, gx);
      const gDist = Math.sqrt(gx * gx + gy * gy);
      if (gDist < 0.18 && gDist > 0.1) inText = true;
      if (Math.abs(gy + 0.14) < 0.025 && gx > -0.14 && gx < 0.1) inText = true;
      if (Math.abs(gx - 0.04) < 0.025 && gy > -0.14 && gy < 0) inText = true;
      if (Math.abs(gy + 0.14) < 0.025 && gx > 0.04 && gx < 0.16) inText = true;
      if (Math.abs(gx + 0.14) < 0.025 && gy > 0 && gy < 0.14) inText = true;

      // R
      const rx = nx + 0.02;
      const ry = ny + 0.02;
      if (Math.abs(rx + 0.14) < 0.025 && ry > -0.14 && ry < 0.14) inText = true;
      if (Math.abs(ry + 0.14) < 0.025 && rx > -0.14 && rx < 0) inText = true;
      if (Math.abs(ry) < 0.025 && rx > -0.14 && rx < 0.02) inText = true;
      if (Math.abs(ry - 0.14) < 0.025 && rx > -0.14 && rx < 0) inText = true;
      const rLegX = rx - 0.02;
      const rLegY = ry;
      if (rLegX > 0 && rLegX < 0.14 && Math.abs(rLegY - rLegX * 0.8) < 0.035) inText = true;

      // S
      const sx = nx - 0.24;
      const sy = ny + 0.02;
      const sAngle = Math.atan2(sy, sx);
      const sDist = Math.sqrt(sx * sx + sy * sy);
      if (sDist < 0.18 && sDist > 0.1) inText = true;
      if (Math.abs(sy + 0.14) < 0.025 && sx > -0.16 && sx < 0) inText = true;
      if (Math.abs(sy - 0.14) < 0.025 && sx > 0 && sx < 0.16) inText = true;
      if (Math.abs(sy) < 0.025 && sx > -0.14 && sx < 0) inText = true;

      // Bottom accent line
      if (Math.abs(ny - 0.34) < 0.025 && Math.abs(nx) < 0.35) inText = true;

      if (inText) {
        rawData[px] = 255;
        rawData[px + 1] = 255;
        rawData[px + 2] = 255;
      } else {
        // Subtle gradient
        const gradient = 1 - (dist / (width * 0.5)) * 0.15;
        rawData[px] = Math.round(r * gradient);
        rawData[px + 1] = Math.round(g * gradient);
        rawData[px + 2] = Math.round(b * gradient);
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const outDir = path.join(__dirname, '..', 'public');
const R = 13, G = 110, B = 253; // #0d6efd

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-512x512.png', size: 512 },
];

sizes.forEach(({ name, size }) => {
  const png = generatePNG(size, size, R, G, B);
  const outPath = path.join(outDir, name);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${png.length} bytes)`);
});

console.log('Done.');
