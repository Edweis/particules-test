const SIGNAL_RUN = 0;
const SIGNAL_PAUSE = 1;
const SIGNAL_READY = 2;

console.log("worker created");

onmessage = (event) => {
  const {
    sabParticles,
    sabSignals,
    id,
    chunkSize,
    chunkOffset,
    stride,
    sabSimData,
  } = event.data;
  const particlesView = new Float32Array(sabParticles);
  const signalsView = new Uint8Array(sabSignals);
  const simDataView = new Float32Array(sabSimData);
  const dt = () => simDataView[0];
  const input = () => [simDataView[1], simDataView[2], !!simDataView[3]];
  signalsView[id] = SIGNAL_READY;
  console.log(`worker init ${id}`);

  setInterval(() => {
    if (signalsView[id] !== SIGNAL_RUN) return;
    const delta = dt();
    const [mx, my, isTouch] = input();
    for (let i = chunkOffset; i <= chunkOffset + chunkSize; i++) {
      const decay = 1 / (1 + delta * 1);
      const x = particlesView[i * stride];
      const y = particlesView[i * stride + 1];
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
      particlesView[i * stride] = x + dx * delta;
      particlesView[i * stride + 1] = y + dy * delta;
      particlesView[i * stride + 2] = dx;
      particlesView[i * stride + 3] = dy;
    }
    signalsView[id] = SIGNAL_READY;
  }, 1);
};
