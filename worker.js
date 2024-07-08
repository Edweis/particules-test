const SIGNAL_PAUSE = 0;
const SIGNAL_READY = 1;
const SIGNAL_RUN = 2;

console.log("worker created");

let lastSetupEvent = null;

const simulate = (event, sabViewPixels) => {
  const {
    sabViewParticles,
    sabViewSimData,
    id,
    particleOffsetStart,
    particleOffsetEnd,
    particleStride,
  } = event.data;

  const [delta, mx, my, isTouch, width, height] = [
    sabViewSimData[0],
    sabViewSimData[1],
    sabViewSimData[2],
    !!sabViewSimData[3],
    sabViewSimData[4],
    sabViewSimData[5],
  ];
  const pixelChunkSize = width * height;
  const pixelOffset = id * pixelChunkSize;
  sabViewPixels.fill(0, pixelOffset, pixelOffset + pixelChunkSize);

  const start = particleOffsetStart;
  const end = particleOffsetEnd;
  for (let i = start; i < end; i++) {
    const decay = 1 / (1 + delta * 1);

    const pi = i * particleStride;
    let x = sabViewParticles[pi];
    let y = sabViewParticles[pi + 1];
    let dx = sabViewParticles[pi + 2] * decay;
    let dy = sabViewParticles[pi + 3] * decay;

    if (isTouch) {
      const tx = mx - x;
      const ty = my - y;
      const dist = Math.sqrt(tx * tx + ty * ty);
      const dirX = tx / dist;
      const dirY = ty / dist;
      const force = 3 * Math.min(1200, 25830000 / (dist * dist));
      dx += dirX * force * delta;
      dy += dirY * force * delta;
    }
    x += dx * delta;
    y += dy * delta;
    sabViewParticles[pi] = x;
    sabViewParticles[pi + 1] = y;
    sabViewParticles[pi + 2] = dx;
    sabViewParticles[pi + 3] = dy;

    if (x < 0 || x >= width) continue;
    if (y < 0 || y >= height) continue;
    const pixelIndex = (y | 0) * width + (x | 0);
    const rx = x / width;
    const ry = y / height;
    const col = sabViewPixels[pixelOffset + pixelIndex];
    const r = (col >> 16) & 0xff;
    const g = (col >> 8) & 0xff;
    const b = col & 0xff;
    const fr = (clamp(r + 25 + 255 * rx * 0.2) & 0xff) << 16;
    const fg = (clamp(g + 25 + 255 * ry * 0.2) & 0xff) << 8;
    const fb = clamp(b + 25 + 255 * (1 - rx) * 0.2) & 0xff;
    sabViewPixels[pixelOffset + pixelIndex] = fr | fg | fb;
    // const r = sabViewPixels[pixelOffset + pixelIndex];
    // const g = sabViewPixels[pixelOffset + pixelIndex + 1];
    // const b = sabViewPixels[pixelOffset + pixelIndex + 2];
    // sabViewPixels[pixelOffset + pixelIndex] = clamp(r + 25 + 35 * rx);
    // sabViewPixels[pixelOffset + pixelIndex + 1] = clamp(g + 25 + 35 * ry);
    // sabViewPixels[pixelOffset + pixelIndex + 2] = clamp(b + 25 + 35 * (1 - rx));
  }

  function clamp(n) {
    n &= -(n >= 0);
    return n | ((255 - n) >> 31);
  }

  postMessage({ id: SIGNAL_READY });
};

onmessage = (event) => {
  if (!(event.data?.id >= 0)) {
    simulate(lastSetupEvent, event.data.sabViewPixels);
    return;
  }

  lastSetupEvent = event;

  postMessage({ id: SIGNAL_READY });
};
