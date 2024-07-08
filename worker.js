const SIGNAL_PAUSE = 0;
const SIGNAL_READY = 1;
const SIGNAL_RUN = 2;

console.log("worker created");

let simulate = null;

onmessage = (event) => {
  if (!(event.data?.id >= 0) && simulate) {
    simulate();
    return;
  }

  const {
    sabParticles,
    sabSignals,
    sabSimData,
    sabPixelBuffs,
    id,
    chunkSize,
    chunkOffset,
    stride,
  } = event.data;

  const particlesView = new Float32Array(sabParticles);
  const signalsView = new Int32Array(sabSignals);
  const simDataView = new Float32Array(sabSimData);
  const pixelBuffs = new Uint8ClampedArray(sabPixelBuffs);
  const dt = () => simDataView[0];
  const input = () => [
    simDataView[1],
    simDataView[2],
    !!simDataView[3],
    simDataView[4],
    simDataView[5],
  ];
  console.log(`worker init ${id}`);
  self.postMessage({ id: SIGNAL_READY });

  simulate = () => {
    const delta = dt();
    const [mx, my, isTouch, width, height] = input();
    const buffStride = width * height * 3;

    pixelBuffs.fill(0, buffStride * id, buffStride * id + width * height * 3);
    for (let i = chunkOffset; i < chunkOffset + chunkSize; i++) {
      const decay = 1 / (1 + delta * 1);
      let x = particlesView[i * stride];
      let y = particlesView[i * stride + 1];
      let dx = particlesView[i * stride + 2] * decay;
      let dy = particlesView[i * stride + 3] * decay;

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
      particlesView[i * stride] = x;
      particlesView[i * stride + 1] = y;
      particlesView[i * stride + 2] = dx;
      particlesView[i * stride + 3] = dy;

      if (x < 0 || x >= width) continue;
      if (y < 0 || y >= height) continue;
      const pixelIndex = ((y | 0) * width + (x | 0)) * 3;
      const rx = x / width;
      const ry = y / height;
      pixelBuffs[buffStride * id + pixelIndex] += 25 + 50 * rx;
      pixelBuffs[buffStride * id + pixelIndex + 1] += 25 + 50 * ry;
      pixelBuffs[buffStride * id + pixelIndex + 2] += 25 + 50 * (1 - rx);
    }

    self.postMessage({ id: SIGNAL_READY });
  };
};
