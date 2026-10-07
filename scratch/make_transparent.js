const fs = require('fs');
const zlib = require('zlib');

function decodePNG(buffer) {
  let pos = 8;
  let ihdr = null;
  let idatChunks = [];

  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    const data = buffer.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') ihdr = data;
    else if (type === 'IDAT') idatChunks.push(data);
    pos += 12 + len;
  }

  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = 4;
  const stride = 1 + width * bpp;

  // Unfilter
  const raw = Buffer.alloc(width * height * bpp);
  let prevRow = Buffer.alloc(width * bpp);

  for (let y = 0; y < height; y++) {
    const filter = decompressed[y * stride];
    const row = Buffer.alloc(width * bpp);

    for (let x = 0; x < width * bpp; x++) {
      const byte = decompressed[y * stride + 1 + x];
      const a = x >= bpp ? row[x - bpp] : 0;
      const b = prevRow[x];
      const c = x >= bpp ? prevRow[x - bpp] : 0;

      let val = 0;
      if (filter === 0) val = byte;
      else if (filter === 1) val = (byte + a) & 0xff;
      else if (filter === 2) val = (byte + b) & 0xff;
      else if (filter === 3) val = (byte + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (byte + pr) & 0xff;
      }
      row[x] = val;
    }
    row.copy(raw, y * width * bpp);
    prevRow = row;
  }

  return { width, height, raw };
}

function encodePNG(width, height, rgbaBuffer) {
  const bpp = 4;
  const stride = 1 + width * bpp;
  const filtered = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y++) {
    filtered[y * stride] = 0; // None filter
    rgbaBuffer.copy(filtered, y * stride + 1, y * width * bpp, (y + 1) * width * bpp);
  }

  const compressed = zlib.deflateSync(filtered);

  // CRC32
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (-(c & 1) & 0xedb88320);
      }
    }
    return ~c >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const typeAndData = buf.slice(4, 8 + len);
    buf.writeUInt32BE(crc32(typeAndData), 8 + len);
    return buf;
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const inputBuf = fs.readFileSync('assets/meta-ai-logo.png');
const { width, height, raw } = decodePNG(inputBuf);

// Process transparency: remove pure white / near-white background
// High fidelity alpha feathering
for (let i = 0; i < raw.length; i += 4) {
  const r = raw[i];
  const g = raw[i + 1];
  const b = raw[i + 2];

  // Whiteness measure: min of r, g, b
  const minVal = Math.min(r, g, b);
  if (minVal > 248) {
    raw[i + 3] = 0;
  } else if (minVal > 225) {
    const factor = (248 - minVal) / (248 - 225);
    raw[i + 3] = Math.round(factor * 255);
  }
}

const outPng = encodePNG(width, height, raw);
fs.writeFileSync('assets/meta-ai-logo.png', outPng);
fs.writeFileSync('assets/meta-ai-orb.png', outPng);
console.log('Successfully made transparent PNG saved to assets/meta-ai-logo.png & assets/meta-ai-orb.png');
