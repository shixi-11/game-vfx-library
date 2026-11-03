const canvas = document.querySelector('#stage');
const ctx = canvas.getContext('2d');
const presets = [
  { name: '苍穹星矢', color: '#78efff', shape: 'bolt', count: 72 },
  { name: '紫电裂隙', color: '#c39aff', shape: 'rift', count: 84 },
  { name: '鎏金陨火', color: '#ffc66d', shape: 'meteor', count: 112 },
  { name: '碧光法环', color: '#8df3c6', shape: 'ring', count: 64 },
  { name: '寒星碎晶', color: '#aecbff', shape: 'frost', count: 52 },
];
const tau = Math.PI * 2;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let width, height, scale, selected = 0, burst = null, frame = 0;
let looping = false;

function line(x1, y1, x2, y2, color, weight) {
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(x, y, radius, color, weight, squash = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = weight;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * squash, 0, 0, tau);
  ctx.stroke();
}

function backdrop() {
  const sky = ctx.createRadialGradient(width / 2, height * .45, 0, width / 2, height * .45, width * .65);
  sky.addColorStop(0, '#1a3451');
  sky.addColorStop(1, '#080e1a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = i % 7 === 0 ? '#91a6c681' : '#6883a742';
    ctx.fillRect(((i * 173 + 31) % 997) / 997 * width, ((i * 307 + 13) % 991) / 991 * height, 1.5, 1.5);
  }
  const x = width / 2, y = height * .68;
  for (const radius of [90, 146, 205]) circle(x, y, radius * scale, '#6697b150', 1, .29);
  for (let i = 0; i < 12; i++) {
    const a = i * tau / 12;
    line(x + Math.cos(a) * 146 * scale, y + Math.sin(a) * 42 * scale,
      x + Math.cos(a) * 205 * scale, y + Math.sin(a) * 59 * scale, '#6697b144', 1);
  }
}

function paint(age) {
  backdrop();
  if (!burst) return;
  const { x, y, preset, particles } = burst;
  const t = Math.max(0, age - .26);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x * width, y * height);
  ctx.scale(scale, scale);
  if (age < .26 && ['bolt', 'meteor'].includes(preset.shape)) {
    const distance = (1 - age / .26) * 290;
    const angle = preset.shape === 'meteor' ? -1.12 : -2.85;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    line(dx * distance, dy * distance, dx * (distance + 92), dy * (distance + 92), preset.color, 5);
    circle(dx * distance, dy * distance, 8, '#ffffff', 3);
  }
  if (age >= .26) {
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
    glow.addColorStop(0, preset.color);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = Math.max(0, 1 - t * 2.6) * .63;
    ctx.fillStyle = glow;
    ctx.fillRect(-100, -100, 200, 200);
    ctx.globalAlpha = Math.max(0, 1 - t * 1.2);
    for (let i = 0; i < (preset.shape === 'ring' ? 4 : 2); i++) {
      circle(0, 0, 14 + i * 18 + t * 132, preset.color, 1.7, preset.shape === 'ring' ? .36 : .72);
    }
    if (preset.shape === 'rift' && t < .55) {
      for (let arm = 0; arm < 7; arm++) {
        const a = arm * tau / 7 + .12;
        let px = 0, py = 0;
        for (let j = 1; j < 7; j++) {
          const r = j * 18;
          const bend = a + Math.sin(j * 8 + arm * 3 + t * 14) * .24;
          const nx = Math.cos(bend) * r, ny = Math.sin(bend) * r;
          line(px, py, nx, ny, preset.color, 2);
          px = nx; py = ny;
        }
      }
    }
    for (const p of particles) {
      if (t >= p.life) continue;
      ctx.globalAlpha = (1 - t / p.life) * .9;
      const px = p.vx * t, py = p.vy * t + 32 * t * t;
      if (preset.shape === 'frost') {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.spin + t * 2);
        ctx.fillStyle = preset.color;
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 2);
        ctx.restore();
      } else {
        line(px, py, px - p.vx * .043, py - p.vy * .043, preset.color, p.size);
      }
    }
  }
  ctx.restore();
}

function tick(now) {
  frame = 0;
  if (document.hidden || !burst) return;
  const age = (now - burst.start) / 1000;
  if (age >= 1.75) {
    if (looping) cast();
    else { burst = null; backdrop(); }
    return;
  }
  paint(age);
  frame = requestAnimationFrame(tick);
}

function cast(x = .5, y = .55) {
  const preset = presets[selected];
  const particles = Array.from({ length: preset.count }, () => {
    const angle = Math.random() * tau;
    const speed = 36 + Math.random() * 166;
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * .78,
      life: .36 + Math.random() * .96, size: 1 + Math.random() * 2.4, spin: angle };
  });
  burst = { x, y, preset, particles, start: performance.now() };
  if (frame) cancelAnimationFrame(frame);
  if (reducedMotion.matches) {
    frame = 0;
    paint(.46);
  } else {
    paint(0);
    frame = requestAnimationFrame(tick);
  }
}

function resize() {
  const box = canvas.getBoundingClientRect();
  width = box.width; height = box.height;
  scale = Math.min(1.3, width / 560, height / 340);
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  paint(burst ? (reducedMotion.matches ? .46 : (performance.now() - burst.start) / 1000) : 0);
}

const controls = document.querySelector('#presets');
const label = document.querySelector('#effect-name');
const buttons = presets.map((preset, i) => {
  const button = document.createElement('button');
  button.textContent = preset.name;
  button.setAttribute('aria-pressed', String(i === selected));
  button.addEventListener('click', () => {
    selected = i;
    buttons.forEach((entry, index) => entry.setAttribute('aria-pressed', String(index === i)));
    label.textContent = preset.name;
    cast();
  });
  controls.append(button);
  return button;
});
label.textContent = presets[selected].name;
document.querySelector('#cast').addEventListener('click', () => cast());
canvas.addEventListener('click', event => {
  const box = canvas.getBoundingClientRect();
  cast((event.clientX - box.left) / width, (event.clientY - box.top) / height);
});
const loop = document.querySelector('#loop');
function syncMotion() {
  loop.disabled = reducedMotion.matches;
  if (reducedMotion.matches) {
    looping = false;
    loop.setAttribute('aria-pressed', 'false');
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    paint(burst ? .46 : 0);
  }
}
loop.addEventListener('click', () => {
  looping = !looping;
  loop.setAttribute('aria-pressed', String(looping));
  if (looping) cast();
});
reducedMotion.addEventListener('change', syncMotion);
document.addEventListener('keydown', event => {
  if (event.code === 'Space' && !event.repeat && event.target === document.body) {
    event.preventDefault();
    cast();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else if (looping) {
    cast();
  } else if (!reducedMotion.matches) {
    burst = null;
    backdrop();
  }
});
new ResizeObserver(resize).observe(canvas);
resize();
syncMotion();
cast();
