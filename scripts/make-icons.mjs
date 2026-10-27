import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(import.meta.dirname, "../icons");
mkdirSync(dir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  writeFileSync(path.join(dir, `icon${size}.png`), png(size, size, paint));
}

function paint(x, y, size) {
  const ink = [20, 61, 54, 255];
  const paper = [246, 243, 236, 255];
  const mark = [12, 107, 77, 255];
  if (x < 1 || y < 1 || x > size - 2 || y > size - 2) return ink;
  const margin = Math.round(size * 0.18);
  const inPage = x >= margin && x < size - margin && y >= margin && y < size - margin;
  if (!inPage) return ink;
  const cx = size * 0.68;
  const cy = size * 0.7;
  const radius = size * 0.18;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  if (dx * dx + dy * dy <= radius * radius) return mark;
  const line = Math.round(size * 0.08);
  const bands = [0.42, 0.54, 0.66].map((ratio) => Math.round(size * ratio));
  if (
    x > size * 0.3 &&
    x < size * 0.62 &&
    bands.some((band) => y >= band && y < band + Math.max(1, line / 2))
  ) {
    return ink;
  }
  return paper;
}

function png(width, height, pixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = pixel(x, y, width);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])) >>> 0);
  return Buffer.concat([length, name, data, crc]);
}

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return ~crc;
}
