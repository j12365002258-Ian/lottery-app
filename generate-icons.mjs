// 使用 zlib.deflate（帶 zlib 標頭），符合 PNG IDAT 規範
import { deflate } from 'zlib';
import { writeFileSync } from 'fs';
import { promisify } from 'util';

const compress = promisify(deflate); // zlib wrapper，非 deflateRaw

// CRC32 查表
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

async function generatePNG(size, outputPath) {
  // RGBA 像素緩衝
  const px = new Uint8Array(size * size * 4);

  function set(x, y, r, g, b, a = 255) {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r; px[i+1] = g; px[i+2] = b; px[i+3] = a;
  }

  function circle(cx, cy, radius, r, g, b, highlight = false) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const d2 = dx*dx + dy*dy;
        if (d2 > radius*radius) continue;
        // 簡單高光：左上角偏亮
        const bright = highlight && dx < -radius*0.2 && dy < -radius*0.2;
        set(cx+dx, cy+dy,
          bright ? Math.min(255, r+60) : r,
          bright ? Math.min(255, g+60) : g,
          bright ? Math.min(255, b+60) : b
        );
      }
    }
  }

  const s = size;
  const rad = Math.floor(s * 0.15); // 圓角半徑

  // 深藍背景 + 圓角遮罩
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      // 四個角的圓角判斷
      let inCorner = false;
      let ox = 0, oy = 0;
      if (x < rad && y < rad)         { ox = rad; oy = rad; inCorner = true; }
      else if (x >= s-rad && y < rad) { ox = s-1-rad; oy = rad; inCorner = true; }
      else if (x < rad && y >= s-rad) { ox = rad; oy = s-1-rad; inCorner = true; }
      else if (x >= s-rad && y >= s-rad) { ox = s-1-rad; oy = s-1-rad; inCorner = true; }

      if (inCorner && (x-ox)**2 + (y-oy)**2 > rad**2) {
        // 圓角外：透明
        set(x, y, 0, 0, 0, 0);
      } else {
        set(x, y, 0x0f, 0x17, 0x2a, 255);
      }
    }
  }

  const cx = Math.floor(s / 2);
  const cy = Math.floor(s / 2);
  const br = Math.floor(s * 0.105); // 小球半徑

  // 第一區：三個綠球（上排）
  const topY = cy - Math.floor(s * 0.16);
  circle(cx - Math.floor(s*0.24), topY, br, 0x05, 0x96, 0x69, true);
  circle(cx,                       topY, br, 0x05, 0x96, 0x69, true);
  circle(cx + Math.floor(s*0.24), topY, br, 0x05, 0x96, 0x69, true);

  // 第二區：一個較大紅球（下方置中）
  circle(cx, cy + Math.floor(s * 0.16), Math.floor(s * 0.135), 0xdc, 0x26, 0x26, true);

  // 黃色星星（右下角裝飾）
  circle(cx + Math.floor(s*0.30), cy + Math.floor(s*0.28), Math.floor(s*0.045), 0xfb, 0xbf, 0x24);

  // --- 組裝 PNG ---
  // IHDR：寬、高各 4 bytes，bit depth=8, colorType=6 (RGBA)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA

  // 掃描線：每行加 filter byte 0（None）
  const stride = 1 + size * 4;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * stride + 1 + x * 4;
      raw[dst]   = px[src];
      raw[dst+1] = px[src+1];
      raw[dst+2] = px[src+2];
      raw[dst+3] = px[src+3];
    }
  }

  // 使用 zlib.deflate（帶 zlib 標頭 + adler32），符合 PNG 規範
  const idat = await compress(raw, { level: 9 });

  const PNG_SIG = Buffer.from([137,80,78,71,13,10,26,10]);
  const out = Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  writeFileSync(outputPath, out);
  console.log(`✓ ${outputPath}  (${size}×${size}, ${out.length} bytes)`);
}

await generatePNG(192, 'public/icons/icon-192.png');
await generatePNG(512, 'public/icons/icon-512.png');
console.log('完成！');
