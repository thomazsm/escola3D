import * as THREE from 'three';

const generateTexture = (type: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (type === 'grass') {
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#22c55e' : '#16a34a';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 16);
    }
  } else if (type === 'wood') {
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#b45309';
    for (let i = 0; i < 300; i++) {
      ctx.fillRect(0, Math.random() * 512, 512, Math.random() * 8 + 2);
    }
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * 512, Math.random() * 512, Math.random() * 10 + 5, Math.random() * 30 + 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#92400e';
      ctx.fill();
    }
  } else if (type === 'asphalt') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 20000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#1e293b' : '#475569';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
  } else if (type === 'tile') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, 512, 512);
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
  } else if (type === 'brick') {
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#991b1b' : '#7f1d1d';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }
    ctx.fillStyle = '#e2e8f0';
    for(let y = 0; y < 512; y += 64) {
      ctx.fillRect(0, y, 512, 6);
      const offset = (y / 64) % 2 === 0 ? 0 : 64;
      for(let x = 0; x < 512; x += 128) {
        ctx.fillRect(x + offset, y, 6, 64);
      }
    }
  } else if (type === 'concrete') {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 10000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#cbd5e1' : '#64748b';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
  } else if (type === 'dirt') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#92400e' : '#451a03';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 5, 5);
    }
  } else if (type === 'carpet') {
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 15000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#2563eb' : '#60a5fa';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
    }
  } else if (type === 'gym') {
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#c2410c' : '#f97316';
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 4, 4);
    }
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const baseTextures: Record<string, THREE.CanvasTexture> = {};

export const getTexture = (type: string, repeatX: number = 1, repeatY: number = 1) => {
  if (!baseTextures[type]) {
    baseTextures[type] = generateTexture(type);
  }
  const tex = baseTextures[type].clone();
  tex.repeat.set(repeatX, repeatY);
  tex.needsUpdate = true;
  return tex;
};
