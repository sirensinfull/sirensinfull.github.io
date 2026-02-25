/* ═══════════════════════════════════════════════════════════════
   PARTICLE-VIZ.JS — 6 Visualizer Engines for Ouroboros Desktop
   
   All audio I/O stripped. Each engine reads frequency data from
   window.ouroborosAnalyser (the MP3 player's AnalyserNode).
   
   Engines:
     1. Particles2D  — 2D canvas, 4 modes (radial/scatter/lattice/spiral)
     2. Field3D      — Three.js, 4 modes (cymatic/collapse/lattice/helix)
     3. BlackHole v1 — Keplerian gravity, clusters, consume+respawn
     4. BlackHole v2 — v1 + EH bounce (no consume)
     5. BlackHole v3 — v2 + 7 Houses band-rotated physics
     6. BlackHole v4 — v3 + screensaver lifecycle + RNG + brightness boost
   
   ═══════════════════════════════════════════════════════════════ */
'use strict';

// ╔═══════════════════════════════════════════════════════╗
// ║  1. SHARED UTILITIES                                  ║
// ╚═══════════════════════════════════════════════════════╝

const PV = { engines: {} };

// Inject panel-internal styles once
(function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .pv-content{padding:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;max-height:none!important}
    .pv-viewport{flex:1;min-height:120px;position:relative;overflow:hidden;background:#020204}
    .pv-viewport canvas{display:block;width:100%!important;height:100%!important}
    .pv-ctrl{border-top:1px solid var(--border-subtle,#181828);padding:6px 8px;background:rgba(0,0,0,0.3);max-height:220px;overflow-y:auto;overflow-x:hidden}
    .pv-ctrl::-webkit-scrollbar{width:3px}.pv-ctrl::-webkit-scrollbar-thumb{background:#181828;border-radius:2px}
    .pv-row{display:flex;align-items:center;gap:4px;height:18px;margin-bottom:2px}
    .pv-row label{font-size:6.5px;text-transform:uppercase;letter-spacing:.5px;color:#3a3a55;width:38px;text-align:right;flex-shrink:0}
    .pv-row input[type=range]{flex:1;-webkit-appearance:none;background:#181828;height:1.5px;border-radius:1px;outline:none;min-width:30px}
    .pv-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:7px;height:7px;background:#b0b8d8;border-radius:50%;cursor:pointer}
    .pv-row .pv-val{font-size:6px;color:#222;width:20px;text-align:left;font-variant-numeric:tabular-nums}
    .pv-sep{height:1px;background:#0c0c14;margin:3px 0}
    .pv-modes{display:flex;gap:2px;margin-bottom:4px}
    .pv-mbtn{flex:1;height:16px;font-size:6px;letter-spacing:.3px;text-transform:uppercase;border:1px solid #181828;background:#08080e;color:#3a3a55;cursor:pointer;font-family:'JetBrains Mono',monospace;border-radius:2px;transition:all .15s;padding:0}
    .pv-mbtn:hover{color:#7780a0;border-color:#3a3a55}.pv-mbtn.active{color:#ffaa40;border-color:#ffaa40}
    .pv-rng{width:13px;height:13px;border:1px solid #151520;border-radius:2px;background:none;color:#2a2a3a;font-size:7px;cursor:pointer;font-family:'JetBrains Mono',monospace;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;transition:all .15s}
    .pv-rng:hover{color:#ffaa40;border-color:#ffaa40}
    .pv-hrow{display:flex;align-items:center;gap:3px;height:20px;margin-bottom:1px}
    .pv-swatch{width:13px;height:13px;border-radius:2px;cursor:pointer;border:1px solid #222;position:relative;overflow:hidden;flex-shrink:0}
    .pv-swatch input{position:absolute;inset:-4px;width:21px;height:21px;opacity:0;cursor:pointer}
    .pv-hlabel{font-size:6px;color:#3a3a55;width:18px;text-align:center;flex-shrink:0;font-weight:600}
    .pv-hslider{flex:1;-webkit-appearance:none;background:#181828;height:1.5px;border-radius:1px;outline:none;min-width:16px}
    .pv-hslider::-webkit-slider-thumb{-webkit-appearance:none;width:6px;height:6px;border-radius:50%;cursor:pointer;background:#b0b8d8}
    .pv-hval{font-size:5.5px;color:#1e1e2e;width:14px;text-align:right;flex-shrink:0}
    .pv-band-meter{width:14px;height:8px;border-radius:1px;background:#0a0a12;overflow:hidden;flex-shrink:0;position:relative}
    .pv-band-fill{height:100%;width:0%;position:absolute;bottom:0;left:0;border-radius:1px;transition:width 50ms}
    .pv-lcbtn{width:100%;height:18px;border:1px solid #181828;background:#08080e;color:#3a3a55;font-size:6px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;font-family:'JetBrains Mono',monospace;border-radius:2px;transition:all .15s;margin-top:2px}
    .pv-lcbtn:hover{color:#ffaa40;border-color:#ffaa40}
    .pv-lcbtn.active{color:#000;background:#ffaa40;border-color:#ffaa40}
    .pv-age{font-size:6px;color:#3a3a55;text-align:center;margin-top:2px;letter-spacing:.5px}
    .pv-stat{font-size:6px;color:#1a1a28;margin-top:3px;line-height:1.4}
    .pv-stat b{color:#2a2a3a}
    .pv-flash{position:absolute;inset:0;background:radial-gradient(circle,#fff2 0%,transparent 60%);opacity:0;pointer-events:none;z-index:2;transition:opacity .3s}
  `;
  document.head.appendChild(s);
})();

// ─── Constants ───
const PV_BANDS = [2, 3, 5, 7, 11, 13, 23];
const PV_BAND_COLORS_RGB = [
  [0.31,0.91,0.56], [1.00,0.67,0.25], [0.29,0.62,1.00], [1.00,0.38,0.53],
  [0.63,0.47,1.00], [1.00,0.86,0.39], [0.39,1.00,0.86]
];
const PV_BAND_COLORS_CSS = [
  [80,232,144], [255,170,64], [74,158,255], [255,96,136],
  [160,120,255], [255,220,100], [100,255,220]
];

function pvIsPrime(n) {
  n = Math.abs(n); if (n < 2) return false; if (n < 4) return true;
  if (n%2===0||n%3===0) return false;
  for (let i=5;i*i<=n;i+=6) if (n%i===0||n%(i+2)===0) return false;
  return true;
}

function pvGetBands(freqData, smoothBands, decay) {
  if (!freqData) return 0;
  const n = freqData.length, bw = Math.floor(n / 7);
  let total = 0;
  for (let b = 0; b < 7; b++) {
    let sum = 0;
    for (let i = b*bw; i < (b+1)*bw && i < n; i++) sum += freqData[i] / 255;
    const raw = sum / bw;
    smoothBands[b] = Math.max(raw, smoothBands[b] * (decay || 0.92));
    total += smoothBands[b];
  }
  return total / 7;
}

function pvRgbToHex(r,g,b){return'#'+[r,g,b].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}
function pvHexToRgb(hex){return[parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255]}
function pvRandomHue(){const h=Math.random(),s=0.6+Math.random()*0.4,l=0.4+Math.random()*0.3;const a=s*Math.min(l,1-l);const f=n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1))};return[f(0),f(8),f(4)]}

// ─── Engine base class ───
class PVEngine {
  constructor(panelId) {
    this.panelId = panelId;
    this.panel = document.getElementById(panelId);
    this.viewport = null;
    this.ctrlEl = null;
    this.rafId = null;
    this.running = false;
    this.freq = new Uint8Array(1024);
    this.time = new Uint8Array(2048);
    this.smoothBands = new Float32Array(7);
    this.totalEnergy = 0;
    this._lastTime = 0;
  }

  // Read audio from ouroboros analyser
  _readAudio() {
    const a = window.ouroborosAnalyser;
    if (a) {
      a.getByteFrequencyData(this.freq);
      a.getByteTimeDomainData(this.time);
      return true;
    }
    return false;
  }

  // Idle shimmer when no audio
  _shimmer(time, range, count) {
    for (let i = 0; i < (count||30); i++)
      this.freq[i] = Math.floor(Math.sin(time * 0.0008 + i * 0.4) * (range||12) + (range ? range+10 : 18));
  }

  _updateBands() {
    this.totalEnergy = pvGetBands(this.freq, this.smoothBands, 0.92);
  }

  // Slider helper
  _sv(prefix, id) { return parseInt(document.getElementById(prefix + id)?.value || 50); }
  _svUpdate(el, prefix) {
    const vEl = document.getElementById(prefix + 'v' + el.id.split('s')[1]);
    if (vEl) vEl.textContent = el.value;
  }

  // RAF lifecycle
  start() {
    if (this.running) return;
    this.running = true;
    this._lastTime = performance.now();
    const loop = (time) => {
      if (!this.running) { this.rafId = null; return; }
      this.rafId = requestAnimationFrame(loop);
      const dt = Math.min((time - this._lastTime) / 16, 3);
      this._lastTime = time;
      if (!this._readAudio()) this._shimmer(time);
      this._updateBands();
      this.render(time, dt);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  // Override in subclass
  init() {}
  render(time, dt) {}
  onResize() {}
  destroy() { this.stop(); }

  // Panel lifecycle hook
  hookPanel() {
    if (!this.panel) return;
    // Observe hidden class changes
    const obs = new MutationObserver(() => {
      if (this.panel.classList.contains('hidden')) this.stop();
      else { this.init(); this.start(); }
    });
    obs.observe(this.panel, { attributes: true, attributeFilter: ['class'] });
    // Init if not hidden
    if (!this.panel.classList.contains('hidden')) {
      setTimeout(() => { this.init(); this.start(); }, 200);
    }
  }
}


// ╔═══════════════════════════════════════════════════════╗
// ║  2. PARTICLES 2D ENGINE                               ║
// ╚═══════════════════════════════════════════════════════╝

class Particles2DEngine extends PVEngine {
  constructor(panelId) {
    super(panelId);
    this.prefix = panelId + '_';
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    this.W = 0; this.H = 0; this.cx = 0; this.cy = 0; this.radius = 0;
    this.vizMode = 0;
    this._inited = false;
  }

  init() {
    if (this._inited) { this.onResize(); return; }
    this._inited = true;
    const content = this.panel.querySelector('.panel-content');
    content.classList.add('pv-content');
    content.innerHTML = `
      <div class="pv-viewport"><canvas></canvas></div>
      <div class="pv-ctrl">
        <div class="pv-modes" id="${this.prefix}modes"></div>
        <div class="pv-row"><label>particles</label><input type="range" id="${this.prefix}sCount" min="500" max="8000" value="3000"><span class="pv-val" id="${this.prefix}vCount">3000</span></div>
        <div class="pv-row"><label>react</label><input type="range" id="${this.prefix}sReact" min="1" max="100" value="50"><span class="pv-val" id="${this.prefix}vReact">50</span></div>
        <div class="pv-row"><label>symmetry</label><input type="range" id="${this.prefix}sSym" min="1" max="24" value="7"><span class="pv-val" id="${this.prefix}vSym">7</span></div>
        <div class="pv-row"><label>decay</label><input type="range" id="${this.prefix}sDecay" min="1" max="99" value="92"><span class="pv-val" id="${this.prefix}vDecay">92</span></div>
      </div>`;

    this.viewport = content.querySelector('.pv-viewport');
    this.ctrlEl = content.querySelector('.pv-ctrl');
    this.canvas = this.viewport.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');

    // Mode buttons
    const modes = ['radial','scatter','lattice','spiral'];
    const mEl = document.getElementById(this.prefix + 'modes');
    modes.forEach((m, i) => {
      const b = document.createElement('button');
      b.className = 'pv-mbtn' + (i === 0 ? ' active' : '');
      b.textContent = m;
      b.addEventListener('click', () => {
        mEl.querySelectorAll('.pv-mbtn').forEach((x,j) => x.classList.toggle('active', j===i));
        this.vizMode = i;
        if (i === 2) this.particles.forEach(p => { p.x = p.homeX*this.W/2+this.cx; p.y = p.homeY*this.H/2+this.cy; });
      });
      mEl.appendChild(b);
    });

    // Slider events
    this.ctrlEl.querySelectorAll('input[type=range]').forEach(el => {
      el.addEventListener('input', () => {
        const vId = el.id.replace('s','v');
        const vEl = document.getElementById(vId);
        if (vEl) vEl.textContent = el.value;
        if (el.id.includes('Count')) this._initParticles();
      });
    });

    this._initParticles();
    new ResizeObserver(() => this.onResize()).observe(this.viewport);
    this.onResize();
  }

  _initParticles() {
    const count = parseInt(document.getElementById(this.prefix + 'sCount')?.value || 3000);
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: 0, y: 0,
        homeX: (Math.random()-0.5)*2, homeY: (Math.random()-0.5)*2,
        band: Math.floor(Math.random()*7),
        familyPrime: PV_BANDS[Math.floor(Math.random()*7)],
        phase: Math.random()*Math.PI*2,
        orbitR: 0.1+Math.random()*0.9,
        speed: 0.002+Math.random()*0.01,
        size: 0.5+Math.random()*1.5,
        energy: 0
      });
    }
  }

  onResize() {
    if (!this.canvas || !this.viewport) return;
    const dpr = window.devicePixelRatio || 1;
    this.W = this.viewport.clientWidth;
    this.H = this.viewport.clientHeight;
    if (this.W < 1 || this.H < 1) return;
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.canvas.style.width = this.W + 'px';
    this.canvas.style.height = this.H + 'px';
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.cx = this.W / 2;
    this.cy = this.H / 2;
    this.radius = Math.min(this.W, this.H) * 0.42;
  }

  render(time, dt) {
    if (!this.ctx || this.W < 1) return;
    const ctx = this.ctx;
    const p = this.prefix;
    const reactivity = parseInt(document.getElementById(p+'sReact')?.value||50) / 50;
    const sym = parseInt(document.getElementById(p+'sSym')?.value||7);
    const decayRate = parseInt(document.getElementById(p+'sDecay')?.value||92) / 100;
    const totalEnergy = this.totalEnergy;

    // Clear with fade
    ctx.fillStyle = `rgba(2,2,4,${0.08 + (1-decayRate)*0.4})`;
    ctx.fillRect(0, 0, this.W, this.H);

    const sb = this.smoothBands;
    const particles = this.particles;
    const cx = this.cx, cy = this.cy, radius = this.radius;
    const mode = this.vizMode;

    for (let i = 0; i < particles.length; i++) {
      const pt = particles[i];
      const bandE = sb[pt.band] * reactivity;
      pt.energy = pt.energy * 0.9 + bandE * 0.1;
      pt.phase += pt.speed * dt * (1 + pt.energy * 2);

      let tx, ty;
      if (mode === 0) { // RADIAL
        const r = pt.orbitR * radius;
        const angularMode = Math.cos(sym * pt.phase + pt.familyPrime * 0.3);
        const radialMode = Math.cos(pt.familyPrime * pt.orbitR * Math.PI * reactivity + totalEnergy * 5);
        const nodeStr = angularMode * radialMode;
        const effectiveR = r * (1 + nodeStr * bandE * 0.3);
        const angle = pt.phase + (pt.band / 7) * Math.PI * 2 / sym;
        const symAngle = Math.floor(angle / (Math.PI*2/sym)) * (Math.PI*2/sym) + (angle % (Math.PI*2/sym));
        tx = cx + Math.cos(symAngle) * effectiveR;
        ty = cy + Math.sin(symAngle) * effectiveR;
      } else if (mode === 1) { // SCATTER
        const angle = pt.phase * pt.familyPrime;
        const thrust = bandE * radius * 0.8;
        const drift = pt.orbitR * radius * 0.3;
        tx = cx + Math.cos(angle) * (drift + thrust);
        ty = cy + Math.sin(angle) * (drift + thrust);
      } else if (mode === 2) { // LATTICE
        const cols = Math.ceil(Math.sqrt(particles.length * this.W / this.H));
        const spacing = this.W / cols;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const baseX = col * spacing + (row%2 ? spacing/2 : 0) + spacing/2;
        const baseY = row * spacing * 0.866 + spacing/2;
        const px = Math.sin(baseX * 0.01 * pt.familyPrime + totalEnergy * 10) * bandE * 40;
        const py = Math.cos(baseY * 0.01 * pt.familyPrime + totalEnergy * 10) * bandE * 40;
        tx = baseX + px; ty = baseY + py;
      } else { // SPIRAL
        const spiralR = (pt.orbitR * 0.5 + totalEnergy * 0.5) * radius;
        const spiralAngle = pt.phase * 3 + pt.orbitR * Math.PI * 8;
        const growth = Math.log(1 + pt.orbitR * bandE * 3);
        tx = cx + Math.cos(spiralAngle) * spiralR * (1 + growth);
        ty = cy + Math.sin(spiralAngle) * spiralR * (1 + growth);
      }

      pt.x += (tx - pt.x) * (0.05 + pt.energy * 0.15) * dt;
      pt.y += (ty - pt.y) * (0.05 + pt.energy * 0.15) * dt;

      const sz = pt.size * (1 + pt.energy * 3);
      const c = PV_BAND_COLORS_CSS[pt.band];
      if (pt.energy > 0.3) {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, sz*3, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(pt.energy*0.3).toFixed(3)})`;
        ctx.fill();
      }
      ctx.beginPath(); ctx.arc(pt.x, pt.y, sz, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.15+pt.energy*0.85).toFixed(3)})`;
      ctx.fill();
    }

    if (totalEnergy > 0.05) {
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * totalEnergy);
      grad.addColorStop(0, `rgba(255,255,255,${totalEnergy*0.04})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }
}


// ╔═══════════════════════════════════════════════════════╗
// ║  3. FIELD 3D ENGINE                                   ║
// ╚═══════════════════════════════════════════════════════╝

class Field3DEngine extends PVEngine {
  constructor(panelId) {
    super(panelId);
    this.prefix = panelId + '_';
    this.scene = null; this.camera = null; this.renderer = null;
    this.particleMesh = null; this.particleData = null;
    this.PCOUNT = 4000;
    this.cam = { rx:0,ry:0.3,dist:150,px:0,py:0,pz:0,drag:false,shift:false,sx:0,sy:0,orx:0,ory:0,opx:0,opy:0,tier:1 };
    this.vizMode = 0;
    this._inited = false;
    this._dummy = null;
    this._ptLight = null;
    this._ehMesh = null;
    this._ringMesh = null;
    this._bhMesh = null;
  }

  init() {
    if (this._inited) { this.onResize(); return; }
    if (typeof THREE === 'undefined') return;
    this._inited = true;
    const content = this.panel.querySelector('.panel-content');
    content.classList.add('pv-content');
    content.innerHTML = `
      <div class="pv-viewport"></div>
      <div class="pv-ctrl">
        <div class="pv-modes" id="${this.prefix}modes"></div>
        <div class="pv-row"><label>count</label><input type="range" id="${this.prefix}sCount" min="1000" max="15000" value="4000"><span class="pv-val" id="${this.prefix}vCount">4k</span></div>
        <div class="pv-row"><label>react</label><input type="range" id="${this.prefix}sReact" min="1" max="100" value="50"><span class="pv-val" id="${this.prefix}vReact">50</span></div>
        <div class="pv-row"><label>sym</label><input type="range" id="${this.prefix}sSym" min="1" max="24" value="7"><span class="pv-val" id="${this.prefix}vSym">7</span></div>
        <div class="pv-row"><label>gravity</label><input type="range" id="${this.prefix}sGrav" min="0" max="100" value="30"><span class="pv-val" id="${this.prefix}vGrav">30</span></div>
        <div class="pv-row"><label>trail</label><input type="range" id="${this.prefix}sTrail" min="0" max="100" value="60"><span class="pv-val" id="${this.prefix}vTrail">60</span></div>
      </div>`;

    this.viewport = content.querySelector('.pv-viewport');
    this.ctrlEl = content.querySelector('.pv-ctrl');

    // Mode buttons
    const modes = ['cymatic','collapse','lattice','helix'];
    const mEl = document.getElementById(this.prefix+'modes');
    modes.forEach((m,i) => {
      const b = document.createElement('button');
      b.className = 'pv-mbtn'+(i===0?' active':'');
      b.textContent = m;
      b.addEventListener('click', () => {
        mEl.querySelectorAll('.pv-mbtn').forEach((x,j) => x.classList.toggle('active', j===i));
        this.vizMode = i;
      });
      mEl.appendChild(b);
    });

    // Slider events
    this.ctrlEl.querySelectorAll('input[type=range]').forEach(el => {
      el.addEventListener('input', () => {
        const vId = el.id.replace('s','v');
        const vEl = document.getElementById(vId);
        if (vEl) vEl.textContent = el.id.includes('Count') ? (el.value >= 1000 ? Math.round(el.value/1000)+'k' : el.value) : el.value;
        if (el.id.includes('Count')) this._createParticles();
      });
    });

    // Three.js setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020204, 0.004);
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.5, 2000);
    this.camera.position.set(0, 60, 150);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setClearColor(0x020204);
    this.viewport.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0x222244, 0.3));
    this._ptLight = new THREE.PointLight(0xffffff, 0.5, 500);
    this._ptLight.position.set(0, 50, 0);
    this.scene.add(this._ptLight);

    // Black hole + EH + ring (visual only)
    this._bhMesh = new THREE.Mesh(new THREE.SphereGeometry(2,16,16), new THREE.MeshBasicMaterial({color:0}));
    this.scene.add(this._bhMesh);
    this._ehMesh = new THREE.Mesh(new THREE.SphereGeometry(3,24,24), new THREE.MeshBasicMaterial({color:0x332244,transparent:true,opacity:0.15,wireframe:true}));
    this.scene.add(this._ehMesh);
    this._ringMesh = new THREE.Mesh(new THREE.TorusGeometry(8,0.3,8,64), new THREE.MeshBasicMaterial({color:0xff8844,transparent:true,opacity:0.2}));
    this._ringMesh.rotation.x = Math.PI/2;
    this.scene.add(this._ringMesh);

    this._dummy = new THREE.Object3D();
    this._initCamera();
    this._createParticles();
    new ResizeObserver(() => this.onResize()).observe(this.viewport);
    this.onResize();
  }

  _initCamera() {
    const cv = this.renderer.domElement;
    cv.style.cursor = 'grab';
    const c = this.cam;
    cv.addEventListener('mousedown', e => {
      c.drag=true;c.shift=e.shiftKey;c.sx=e.clientX;c.sy=e.clientY;
      c.orx=c.rx;c.ory=c.ry;c.opx=c.px;c.opy=c.py;cv.style.cursor='grabbing';
    });
    cv.addEventListener('mousemove', e => {
      if (!c.drag) return;
      const dx=e.clientX-c.sx,dy=e.clientY-c.sy;
      if(c.shift||e.shiftKey){c.px=c.opx-dx*0.3;c.py=c.opy+dy*0.3}
      else{c.rx=c.orx+dx*0.005;c.ry=Math.max(-1.4,Math.min(1.4,c.ory+dy*0.005))}
      this._updateCamera();
    });
    cv.addEventListener('mouseup', () => { c.drag=false; cv.style.cursor='grab'; });
    cv.addEventListener('wheel', e => {
      e.preventDefault(); e.stopPropagation();
      c.dist=Math.max(5,Math.min(600,c.dist*(e.deltaY>0?1.08:0.92)));
      this._updateCamera();
    }, { passive:false });
    this._updateCamera();
  }

  _updateCamera() {
    const c = this.cam;
    const x=c.dist*Math.sin(c.rx)*Math.cos(c.ry),y=c.dist*Math.sin(c.ry),z=c.dist*Math.cos(c.rx)*Math.cos(c.ry);
    this.camera.position.set(x+c.px,y+c.py,z+c.pz);
    this.camera.lookAt(c.px,c.py*0.3,c.pz);
    c.tier = Math.max(0.1, Math.min(10, c.dist/50));
  }

  _createParticles() {
    if (this.particleMesh) this.scene.remove(this.particleMesh);
    this.PCOUNT = parseInt(document.getElementById(this.prefix+'sCount')?.value || 4000);
    const geo = new THREE.SphereGeometry(0.3, 4, 3);
    const mat = new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9});
    this.particleMesh = new THREE.InstancedMesh(geo, mat, this.PCOUNT);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const colors = new Float32Array(this.PCOUNT * 3);
    this.particleData = [];
    for (let i = 0; i < this.PCOUNT; i++) {
      const band = Math.floor(Math.random()*7);
      const c = PV_BAND_COLORS_RGB[band];
      colors[i*3]=c[0]; colors[i*3+1]=c[1]; colors[i*3+2]=c[2];
      const theta=Math.random()*Math.PI*2, phi=Math.acos(2*Math.random()-1), r=10+Math.random()*80;
      this.particleData.push({
        band, homeR:r, theta, phi,
        phase:Math.random()*Math.PI*2, speed:0.001+Math.random()*0.005, energy:0,
        x:r*Math.sin(phi)*Math.cos(theta), y:r*Math.sin(phi)*Math.sin(theta), z:r*Math.cos(phi),
        vx:0, vy:0, vz:0
      });
    }
    this.particleMesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    this.scene.add(this.particleMesh);
  }

  onResize() {
    if (!this.renderer || !this.viewport) return;
    const w = this.viewport.clientWidth, h = this.viewport.clientHeight;
    if (w < 1 || h < 1) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  render(time, dt) {
    if (!this.particleMesh || !this.particleData || !this.renderer) return;
    const p = this.prefix;
    const reactivity = parseInt(document.getElementById(p+'sReact')?.value||50) / 50;
    const sym = parseInt(document.getElementById(p+'sSym')?.value||7);
    const grav = parseInt(document.getElementById(p+'sGrav')?.value||30) / 100;
    const trail = parseInt(document.getElementById(p+'sTrail')?.value||60) / 100;
    const totalE = this.totalEnergy;
    const tier = this.cam.tier;
    const sb = this.smoothBands;
    const dummy = this._dummy;
    const colors = this.particleMesh.instanceColor.array;
    const mode = this.vizMode;

    // Update visuals
    this._ehMesh.scale.setScalar(3+totalE*8);
    this._ehMesh.rotation.y=time*0.0003; this._ehMesh.rotation.z=time*0.0002;
    this._ehMesh.material.opacity=0.05+totalE*0.2;
    this._ringMesh.scale.setScalar(1+totalE*3);
    this._ringMesh.rotation.z=time*0.0005;
    this._ringMesh.material.opacity=0.1+totalE*0.3;
    this._ptLight.intensity=0.3+totalE*2;
    this._ptLight.color.setHSL(0.08+totalE*0.1,0.8,0.5+totalE*0.3);

    for (let i = 0; i < this.PCOUNT; i++) {
      const pd = this.particleData[i];
      const bandE = sb[pd.band] * reactivity;
      pd.energy = pd.energy * (0.85+trail*0.14) + bandE * (1-trail*0.14) * 0.15;
      pd.phase += pd.speed * dt * (1 + pd.energy * 3);

      let tx, ty, tz;
      if (mode === 0) { // CYMATIC
        const r = pd.homeR * (0.5+0.5/tier);
        const angN = Math.cos(sym*pd.theta+pd.band*0.5+time*0.0002);
        const radN = Math.cos(pd.band*pd.homeR/(20*tier)*Math.PI+totalE*8);
        const vertN = Math.cos(pd.phi*sym*0.5+bandE*5);
        const disp = angN*radN*vertN*bandE*20;
        const eR = r + disp;
        tx=eR*Math.sin(pd.phi+pd.phase*0.1)*Math.cos(pd.theta+pd.phase);
        ty=eR*Math.cos(pd.phi+pd.phase*0.1)*0.6;
        tz=eR*Math.sin(pd.phi+pd.phase*0.1)*Math.sin(pd.theta+pd.phase);
      } else if (mode === 1) { // COLLAPSE
        const dx=-pd.x,dy=-pd.y,dz=-pd.z;
        const dist=Math.sqrt(dx*dx+dy*dy+dz*dz)+0.1;
        const force=grav*500/(dist*dist+10)*(1+bandE*5);
        const tangX=-dz/dist,tangZ=dx/dist;
        const oSpeed=(0.5+bandE*2)*pd.speed*50;
        pd.vx+=(dx/dist*force+tangX*oSpeed-pd.vx*0.02)*dt*0.05;
        pd.vy+=(dy/dist*force*0.3-pd.vy*0.05)*dt*0.05;
        pd.vz+=(dz/dist*force+tangZ*oSpeed-pd.vz*0.02)*dt*0.05;
        tx=pd.x+pd.vx*dt; ty=pd.y+pd.vy*dt; tz=pd.z+pd.vz*dt;
        if(dist<2+totalE*5){const rp=Math.acos(2*Math.random()-1),rt=Math.random()*Math.PI*2,rr=60+Math.random()*40;
          tx=rr*Math.sin(rp)*Math.cos(rt);ty=rr*Math.sin(rp)*Math.sin(rt)*0.3;tz=rr*Math.cos(rp);pd.vx=pd.vy=pd.vz=0;}
      } else if (mode === 2) { // LATTICE
        const gs=Math.ceil(Math.pow(this.PCOUNT,1/3));const sp=120/gs;
        const ix=i%gs,iy=Math.floor(i/gs)%gs,iz=Math.floor(i/(gs*gs));
        const bx=(ix-gs/2)*sp,by=(iy-gs/2)*sp*0.8,bz=(iz-gs/2)*sp;
        tx=bx+Math.sin(bx*0.05*PV_BANDS[pd.band]/tier+totalE*10)*bandE*15;
        ty=by+Math.cos(by*0.05*PV_BANDS[pd.band]/tier+totalE*10)*bandE*15;
        tz=bz+Math.sin(bz*0.05*PV_BANDS[pd.band]/tier+totalE*8)*bandE*15;
      } else { // HELIX
        const hp=(i/this.PCOUNT)*Math.PI*14;
        const strand=pd.band%3,so=strand*Math.PI*2/3;
        const hR=15+bandE*30,rise=(i/this.PCOUNT-0.5)*150;
        const sa=hp+so+time*0.0003*(1+totalE*2);
        tx=Math.cos(sa)*hR; ty=rise; tz=Math.sin(sa)*hR;
        if(pd.band===1||pd.band===2){const ns=((strand+1)%3)*Math.PI*2/3;const ma=(so+ns)/2+hp+time*0.0003;
          tx=Math.cos(ma)*hR*0.6;tz=Math.sin(ma)*hR*0.6;}
      }

      const lr=0.03+pd.energy*0.12;
      if(mode===1){pd.x=tx;pd.y=ty;pd.z=tz}
      else{pd.x+=(tx-pd.x)*lr*dt;pd.y+=(ty-pd.y)*lr*dt;pd.z+=(tz-pd.z)*lr*dt}

      const scale=0.5+pd.energy*4;
      dummy.position.set(pd.x,pd.y,pd.z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i,dummy.matrix);

      const c=PV_BAND_COLORS_RGB[pd.band];
      const bright=0.3+pd.energy*2;
      colors[i*3]=Math.min(1,c[0]*bright);
      colors[i*3+1]=Math.min(1,c[1]*bright);
      colors[i*3+2]=Math.min(1,c[2]*bright);
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.particleMesh.instanceColor.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }
}


// ╔═══════════════════════════════════════════════════════╗
// ║  4. BLACK HOLE ENGINE (unified, feature-flagged)      ║
// ╚═══════════════════════════════════════════════════════╝

class BlackHoleEngine extends PVEngine {
  constructor(panelId, config) {
    super(panelId);
    this.prefix = panelId + '_';
    this.cfg = {
      bounce: config?.bounce || false,
      houses: config?.houses || false,
      screensaver: config?.screensaver || false,
      brightBoost: config?.brightBoost || false
    };
    this.scene = null; this.camera = null; this.renderer = null;
    this.cam = {rx:0,ry:0.35,dist:80,px:0,py:0,pz:0,drag:false,shift:false,sx:0,sy:0,orx:0,ory:0,opx:0,opy:0};
    this.disc = {mesh:null,max:1000,count:0,particles:[],clusters:[],clusterTimer:0,ejectQueue:[],totalBurps:0,totalBounces:0,ehRadius:2.0};
    this.currentTier = 1;
    this.TIERS = [100,1000,5000,20000,50000];
    this._dd = null;
    this._coreMesh = null; this._ehMesh = null; this._psMesh = null; this._glowMesh = null; this._ptLight = null;
    this._inited = false;

    // Houses state
    this.houses = [];
    for (let h=0;h<7;h++) this.houses.push({
      prime:PV_BANDS[h], r:PV_BAND_COLORS_RGB[h][0], g:PV_BAND_COLORS_RGB[h][1], b:PV_BAND_COLORS_RGB[h][2],
      alpha:1.0, standingHz:h+1, bandOffset:h
    });

    // Lifecycle
    this.lc = { active:false, timer:null, birthTime:0, generation:0 };
  }

  init() {
    if (this._inited) { this.onResize(); return; }
    if (typeof THREE === 'undefined') return;
    this._inited = true;
    const content = this.panel.querySelector('.panel-content');
    content.classList.add('pv-content');
    content.innerHTML = this._buildHTML();
    this.viewport = content.querySelector('.pv-viewport');
    this.ctrlEl = content.querySelector('.pv-ctrl');

    // Three.js
    const bb = this.cfg.brightBoost;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x020204, bb ? 0.0015 : 0.003);
    this.camera = new THREE.PerspectiveCamera(60,1,0.3,3000);
    this.camera.position.set(0,40,80);
    this.renderer = new THREE.WebGLRenderer({antialias:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    this.renderer.setClearColor(0x020204);
    this.viewport.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0x222244, bb ? 0.5 : 0.2));
    this._ptLight = new THREE.PointLight(0xffaa44, bb ? 0.6 : 0.1, bb ? 400 : 300);
    this._ptLight.position.set(0,0,0);
    this.scene.add(this._ptLight);

    // Core void
    this._coreMesh = new THREE.Mesh(new THREE.SphereGeometry(1.5,24,24), new THREE.MeshBasicMaterial({color:0}));
    this.scene.add(this._coreMesh);

    // EH wireframe, photon sphere, glow ring (not on brightBoost/final variant)
    if (!bb) {
      this._ehMesh = new THREE.Mesh(new THREE.SphereGeometry(2.5,20,20), new THREE.MeshBasicMaterial({color:0x221133,transparent:true,opacity:0.08,wireframe:true}));
      this.scene.add(this._ehMesh);
      this._psMesh = new THREE.Mesh(new THREE.TorusGeometry(4,0.08,8,80), new THREE.MeshBasicMaterial({color:0xffcc66,transparent:true,opacity:0.15}));
      this._psMesh.rotation.x = Math.PI/2;
      this.scene.add(this._psMesh);
      this._glowMesh = new THREE.Mesh(new THREE.TorusGeometry(6,1.5,6,64), new THREE.MeshBasicMaterial({color:0xff6622,transparent:true,opacity:0.04}));
      this._glowMesh.rotation.x = Math.PI*0.48;
      this.scene.add(this._glowMesh);
    }

    this._dd = new THREE.Object3D();
    this._initCamera();
    this._initSliderEvents();
    if (this.cfg.houses) this._buildHousePanel();
    this._rebuildDisc();
    new ResizeObserver(() => this.onResize()).observe(this.viewport);
    this.onResize();
  }

  _buildHTML() {
    const p = this.prefix;
    const rng = this.cfg.screensaver;
    const rngBtn = rng ? `<button class="pv-rng" onclick="PV.engines['${this.panelId}']._rng(this)" data-id="{ID}" data-min="{MIN}" data-max="{MAX}">&#x2684;</button>` : '';

    const slider = (label, id, min, max, val) => {
      const rb = rng ? `<button class="pv-rng" onclick="PV.engines['${this.panelId}']._rngSlider('${p}s${id}',${min},${max})">&#x2684;</button>` : '';
      return `<div class="pv-row"><label>${label}</label><input type="range" id="${p}s${id}" min="${min}" max="${max}" value="${val}"><span class="pv-val" id="${p}v${id}">${val}</span>${rb}</div>`;
    };

    let html = `<div class="pv-viewport"><div class="pv-flash" id="${p}flash"></div></div><div class="pv-ctrl">`;

    // Tier
    html += `<div class="pv-row"><label>tier</label><div class="pv-modes" id="${p}tiers" style="flex:1">`;
    ['100','1k','5k','20k','50k'].forEach((t,i) => {
      html += `<button class="pv-mbtn${i===1?' active':''}" data-tier="${i}">${t}</button>`;
    });
    html += '</div></div><div class="pv-sep"></div>';

    // Physics sliders
    html += slider('gravity','Grav',0,100,55);
    html += slider('size','Size',5,100, this.cfg.brightBoost ? 45 : 35);
    html += slider('twinkle','Twinkle',0,100,50);
    html += slider('react','React',0,100,60);
    html += slider('dissip','Dissip',0,100,30);
    html += slider('birth','Birth',0,100,70);
    html += slider('radius','Radius',10,100,50);
    html += '<div class="pv-sep"></div>';
    html += slider('twist','Twist',0,100,40);
    html += slider('spin','Spin',-100,100,60);

    if (this.cfg.houses) {
      html += '<div class="pv-sep"></div>';
      html += slider('emit','Emit',0,100,50);
      html += `<div id="${p}houses"></div>`;
    }

    if (this.cfg.screensaver) {
      html += '<div class="pv-sep"></div>';
      html += `<button class="pv-rng" onclick="PV.engines['${this.panelId}']._rngAll()" style="width:100%;height:16px;font-size:6px;letter-spacing:1px">&#x2684; RANDOMIZE ALL</button>`;
      html += '<div class="pv-sep"></div>';
      html += slider('cycle','Cycle',10,120,30);
      html += `<button class="pv-lcbtn" id="${p}lcBtn" onclick="PV.engines['${this.panelId}']._lcToggle()">&#9854; SCREENSAVER</button>`;
      html += `<div class="pv-age" id="${p}lcAge"></div>`;
    }

    html += `<div class="pv-stat" id="${p}stat"></div>`;
    html += '</div>';
    return html;
  }

  _initSliderEvents() {
    const p = this.prefix;
    this.ctrlEl.querySelectorAll('input[type=range]').forEach(el => {
      el.addEventListener('input', () => {
        const vId = el.id.replace(p+'s', p+'v');
        const vEl = document.getElementById(vId);
        if (vEl) vEl.textContent = el.value + (el.id.includes('Cycle') ? 's' : '');
      });
    });

    // Tier buttons
    const tiersEl = document.getElementById(p+'tiers');
    if (tiersEl) {
      tiersEl.querySelectorAll('.pv-mbtn').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = parseInt(btn.dataset.tier);
          tiersEl.querySelectorAll('.pv-mbtn').forEach((b,i) => b.classList.toggle('active', i===t));
          this.currentTier = t;
          this._rebuildDisc();
        });
      });
    }
  }

  _buildHousePanel() {
    const p = this.prefix;
    const el = document.getElementById(p+'houses');
    if (!el) return;
    const NAMES = ['II','III','V','VII','XI','XIII','XXIII'];
    let html = '';
    for (let h = 0; h < 7; h++) {
      const ho = this.houses[h];
      const hex = pvRgbToHex(ho.r, ho.g, ho.b);
      html += `<div class="pv-hrow">
        <div class="pv-swatch" id="${p}sw${h}" style="background:${hex}"><input type="color" value="${hex}" data-h="${h}"></div>
        <button class="pv-rng" data-h="${h}">&#x2684;</button>
        <span class="pv-hlabel">${NAMES[h]}</span>
        <input type="range" class="pv-hslider" id="${p}ha${h}" min="0" max="100" value="100" data-h="${h}">
        <span class="pv-hval" id="${p}hav${h}">1.0</span>
        <div class="pv-band-meter"><div class="pv-band-fill" id="${p}hbf${h}" style="background:${hex}"></div></div>
      </div>`;
    }
    el.innerHTML = html;

    // Wire events
    el.querySelectorAll('input[type=color]').forEach(inp => {
      inp.addEventListener('change', () => this._setHouseColor(parseInt(inp.dataset.h), inp.value));
    });
    el.querySelectorAll('.pv-rng').forEach(btn => {
      btn.addEventListener('click', () => this._rngHouse(parseInt(btn.dataset.h)));
    });
    el.querySelectorAll('.pv-hslider').forEach(sl => {
      sl.addEventListener('input', () => {
        const h = parseInt(sl.dataset.h);
        this.houses[h].alpha = sl.value / 100;
        document.getElementById(this.prefix+'hav'+h).textContent = (sl.value/100).toFixed(1);
      });
    });
  }

  _setHouseColor(h, hex) {
    const [r,g,b] = pvHexToRgb(hex);
    this.houses[h].r=r; this.houses[h].g=g; this.houses[h].b=b;
    const p = this.prefix;
    const sw = document.getElementById(p+'sw'+h);
    if (sw) sw.style.background = hex;
    const bf = document.getElementById(p+'hbf'+h);
    if (bf) bf.style.background = hex;
    this._recolorHouse(h);
  }

  _rngHouse(h) {
    const [r,g,b] = pvRandomHue();
    this.houses[h].r=r; this.houses[h].g=g; this.houses[h].b=b;
    const hex = pvRgbToHex(r,g,b);
    const p = this.prefix;
    const sw = document.getElementById(p+'sw'+h);
    if (sw) { sw.style.background = hex; const inp = sw.querySelector('input'); if(inp) inp.value = hex; }
    const bf = document.getElementById(p+'hbf'+h);
    if (bf) bf.style.background = hex;
    this._recolorHouse(h);
  }

  _recolorHouse(h) {
    if (!this.disc.mesh) return;
    const cols = this.disc.mesh.instanceColor.array;
    const ho = this.houses[h];
    for (let i = 0; i < this.disc.count; i++) {
      const pt = this.disc.particles[i];
      if (pt && pt.band === h) { cols[i*3]=ho.r; cols[i*3+1]=ho.g; cols[i*3+2]=ho.b; }
    }
    this.disc.mesh.instanceColor.needsUpdate = true;
  }

  _rngSlider(id, min, max) {
    const el = document.getElementById(id);
    if (!el) return;
    const v = min + Math.floor(Math.random()*(max-min+1));
    el.value = v;
    const vId = id.replace(/s([A-Z])/, 'v$1');
    const vEl = document.getElementById(vId);
    if (vEl) vEl.textContent = v;
  }

  _rngAll() {
    const p = this.prefix;
    this._rngSlider(p+'sGrav',10,90); this._rngSlider(p+'sSize',15,90);
    this._rngSlider(p+'sTwinkle',10,90); this._rngSlider(p+'sReact',20,90);
    this._rngSlider(p+'sDissip',5,80); this._rngSlider(p+'sBirth',30,95);
    this._rngSlider(p+'sRadius',15,90); this._rngSlider(p+'sTwist',0,80);
    this._rngSlider(p+'sSpin',-90,90);
    if (this.cfg.houses) for (let h=0;h<7;h++) this._rngHouse(h);
  }

  // Lifecycle / Screensaver
  _lcToggle() {
    this.lc.active = !this.lc.active;
    const btn = document.getElementById(this.prefix+'lcBtn');
    if (btn) btn.classList.toggle('active', this.lc.active);
    if (this.lc.active) { this._lcBirth(); this._lcStartTimer(); }
    else { if (this.lc.timer) clearInterval(this.lc.timer); this.lc.timer=null;
      const age = document.getElementById(this.prefix+'lcAge'); if(age) age.textContent=''; }
  }

  _lcStartTimer() {
    if (this.lc.timer) clearInterval(this.lc.timer);
    const sec = parseInt(document.getElementById(this.prefix+'sCycle')?.value || 30);
    this.lc.timer = setInterval(() => this._lcBirth(), sec*1000);
  }

  _lcBirth() {
    this.lc.generation++;
    this.lc.birthTime = performance.now();
    this._rngAll();
    const weights=[0.05,0.2,0.35,0.3,0.1];
    let roll=Math.random(),cum=0,tier=2;
    for(let t=0;t<5;t++){cum+=weights[t];if(roll<cum){tier=t;break}}
    this.currentTier = tier;
    const p = this.prefix;
    const tiersEl = document.getElementById(p+'tiers');
    if (tiersEl) tiersEl.querySelectorAll('.pv-mbtn').forEach((b,i) => b.classList.toggle('active',i===tier));
    this._rebuildDisc();
    const fl = document.getElementById(p+'flash');
    if (fl) { fl.style.opacity = 0.4; setTimeout(() => fl.style.opacity = 0, 600); }
  }

  _lcUpdateAge(time) {
    if (!this.lc.active) return;
    const age = document.getElementById(this.prefix+'lcAge');
    if (!age) return;
    const ageSec = (time - this.lc.birthTime) / 1000;
    let label;
    if (ageSec < 1) label = 'BIG BANG';
    else if (ageSec < 5) label = Math.floor(ageSec*1000)+'k yr';
    else if (ageSec < 15) label = Math.floor(ageSec*100)+'M yr';
    else label = ((ageSec-15)*0.5+1.5).toFixed(1)+'B yr';
    age.textContent = 'gen '+this.lc.generation+' · '+label;
  }

  // Camera
  _initCamera() {
    const cv = this.renderer.domElement;
    cv.style.cursor = 'grab';
    const c = this.cam;
    cv.addEventListener('mousedown', e => {
      c.drag=true;c.shift=e.shiftKey;c.sx=e.clientX;c.sy=e.clientY;
      c.orx=c.rx;c.ory=c.ry;c.opx=c.px;c.opy=c.py;cv.style.cursor='grabbing';
    });
    cv.addEventListener('mousemove', e => {
      if(!c.drag) return;
      const dx=e.clientX-c.sx,dy=e.clientY-c.sy;
      if(c.shift||e.shiftKey){c.px=c.opx-dx*0.25;c.py=c.opy+dy*0.25}
      else{c.rx=c.orx+dx*0.005;c.ry=Math.max(-1.4,Math.min(1.4,c.ory+dy*0.005))}
      this._updateCam();
    });
    cv.addEventListener('mouseup', () => { c.drag=false;cv.style.cursor='grab'; });
    cv.addEventListener('wheel', e => {
      e.preventDefault(); e.stopPropagation();
      c.dist=Math.max(3,Math.min(800,c.dist*(e.deltaY>0?1.07:0.93)));
      this._updateCam();
    }, {passive:false});
    this._updateCam();
  }

  _updateCam() {
    const c = this.cam;
    const x=c.dist*Math.sin(c.rx)*Math.cos(c.ry),y=c.dist*Math.sin(c.ry),z=c.dist*Math.cos(c.rx)*Math.cos(c.ry);
    this.camera.position.set(x+c.px,y+c.py,z+c.pz);
    this.camera.lookAt(c.px,c.py*0.3,c.pz);
  }

  // Disc management
  _rebuildDisc() {
    if (this.disc.mesh) { this.scene.remove(this.disc.mesh); this.disc.mesh = null; }
    this.disc.max = this.TIERS[this.currentTier];
    this.disc.count = 0; this.disc.particles = []; this.disc.clusters = [];
    this.disc.ejectQueue = []; this.disc.totalBurps = 0; this.disc.totalBounces = 0;
    const d = this.disc;
    const det=d.max<=1000?[5,4]:d.max<=5000?[4,3]:d.max<=20000?[3,2]:[2,2];
    const bR=d.max<=1000?0.3:d.max<=5000?0.22:d.max<=20000?0.15:0.1;
    const opac = this.cfg.brightBoost ? 1.0 : 0.85;
    const mesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(bR,det[0],det[1]),
      new THREE.MeshBasicMaterial({transparent:true,opacity:opac,depthWrite:false}),
      d.max
    );
    mesh.frustumCulled = false;
    const dd = this._dd;
    dd.scale.setScalar(0); dd.updateMatrix();
    for(let i=0;i<d.max;i++) mesh.setMatrixAt(i, dd.matrix);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(d.max*3), 3);
    this.scene.add(mesh);
    d.mesh = mesh;
  }

  _g(id) { return parseInt(document.getElementById(this.prefix+'s'+id)?.value || 50); }

  _getGM() {
    const g = this._g('Grav');
    return g*g*0.005 + this.totalEnergy*this._g('React')*0.01*15;
  }

  _birthParticle() {
    const d = this.disc;
    if (!d.mesh || d.count >= d.max) return;
    const slot = d.count;
    const maxR = this._g('Radius');
    const r = maxR*0.6 + Math.random()*maxR*0.4;
    const angle = Math.random()*Math.PI*2;
    const GM = this._getGM();
    const cO = GM > 0 ? Math.sqrt(GM/(r*r*r)) : 0.1;
    const spinDir = this._g('Spin') >= 0 ? 1 : -1;
    const band = Math.floor(Math.random()*7);
    d.particles[slot] = {
      angle, r, vr: (Math.random()-0.5)*0.03,
      vTheta: spinDir * cO * (0.82+Math.random()*0.15),
      mobiusPhase: angle,
      positive: Math.random() > 0.5,
      band, age: 0, clusterId: -1
    };
    const cols = d.mesh.instanceColor.array;
    if (this.cfg.houses) {
      const ho = this.houses[band];
      cols[slot*3]=ho.r; cols[slot*3+1]=ho.g; cols[slot*3+2]=ho.b;
    } else {
      const c = PV_BAND_COLORS_RGB[band];
      cols[slot*3]=c[0]; cols[slot*3+1]=c[1]; cols[slot*3+2]=c[2];
    }
    d.count++;
    d.mesh.instanceColor.needsUpdate = true;
  }

  onResize() {
    if (!this.renderer || !this.viewport) return;
    const w = this.viewport.clientWidth, h = this.viewport.clientHeight;
    if (w < 1 || h < 1) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ═══ MAIN PHYSICS STEP ═══
  _physicsStep(time) {
    const d = this.disc;
    if (!d.mesh || d.count === 0) return;
    const GM = this._getGM();
    const baseEps = this._g('Dissip') * 0.0001;
    const audioEps = this.smoothBands[1] * this._g('React') * 0.00005;
    const epsilon = baseEps + audioEps;
    const halfTwistH = this._g('Twist') * 0.03;
    const reactivity = this._g('React') / 100;
    const twinkle = this._g('Twinkle') / 100;
    const sizeBase = this._g('Size') / 100;
    const escapeR = this._g('Radius') * 1.3 + 10;
    const dt = 0.12, soft = 0.5;
    const active = Math.min(d.count, d.max);
    const cols = d.mesh.instanceColor.array;
    const sb = this.smoothBands;
    const totalEnergy = this.totalEnergy;
    const dd = this._dd;
    const bb = this.cfg.brightBoost;

    // EH pulse (bounce variants)
    let ehPulseR = 2.0, ehBounce = 0;
    if (this.cfg.bounce) {
      ehPulseR = 2.0 + sb[0]*reactivity*6 + totalEnergy*reactivity*3;
      ehBounce = 0.15 + totalEnergy*reactivity*0.8 + sb[0]*reactivity*0.5;
    }
    d.ehRadius = this.cfg.bounce ? ehPulseR : 2.0;
    const consumeR = this.cfg.bounce ? ehPulseR : 2.0;

    // Houses precompute
    let sw = null, HR = null, emission = 0;
    if (this.cfg.houses) {
      emission = (parseInt(document.getElementById(this.prefix+'sEmit')?.value||50)) / 100;
      const tSec = time * 0.001;
      sw = [];
      for (let h=0;h<7;h++) sw.push(Math.sin(tSec*Math.PI*2*this.houses[h].standingHz));
      HR = [];
      for (let h=0;h<7;h++) {
        HR.push({
          velocity:sb[(h+0)%7], amplitude:sb[(h+1)%7], pulse:sb[(h+2)%7],
          gravity:sb[(h+3)%7], push:sb[(h+4)%7], pull:sb[(h+5)%7], spin:sb[(h+6)%7]
        });
      }
      // Update band meters
      for (let h=0;h<7;h++) {
        const bf = document.getElementById(this.prefix+'hbf'+h);
        if (bf) bf.style.width = (sb[h]*100)+'%';
      }
    }

    // Cluster detection (every 30 frames)
    d.clusterTimer++;
    if (d.clusterTimer%30===0 && active > 10) {
      const aBins=24,rBins=8,rMax=escapeR;
      const hash=new Array(aBins*rBins);for(let b=0;b<hash.length;b++)hash[b]=[];
      for(let i=0;i<active;i++){const p=d.particles[i];if(!p)continue;p.clusterId=-1;
        const ai=Math.floor(((p.angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2)/(Math.PI*2)*aBins)%aBins;
        const ri=Math.min(rBins-1,Math.floor(p.r/rMax*rBins));hash[ai*rBins+ri].push(i)}
      const clusters=[];
      for(let b=0;b<hash.length;b++){if(hash[b].length<3)continue;const cell=hash[b];
        let posC=0,negC=0;for(const idx of cell){if(d.particles[idx].positive)posC++;else negC++}
        if(posC===0||negC===0)continue;
        let res=0;const cLen=Math.min(cell.length,12);
        for(let j=0;j<cLen-1;j++){const pj=d.particles[cell[j]];const oj=GM>0?Math.sqrt(GM/Math.max(1,pj.r*pj.r*pj.r)):0.1;
          for(let k=j+1;k<cLen;k++){const pk=d.particles[cell[k]];const ok=GM>0?Math.sqrt(GM/Math.max(1,pk.r*pk.r*pk.r)):0.1;
            const ratio=oj>0?ok/oj:0;if(Math.min(Math.abs(ratio-1),Math.abs(ratio-2),Math.abs(ratio-0.5),Math.abs(ratio-1.5),Math.abs(ratio-2/3))<0.2)res++}}
        const pairs=Math.min(posC,negC);const mersenne=Math.pow(2,pairs)-1;const stable=pvIsPrime(mersenne)&&pairs>1;
        if(res>=1||stable){const cId=clusters.length;
          const cx=cell.reduce((s,idx)=>s+Math.cos(d.particles[idx].angle)*d.particles[idx].r,0)/cell.length;
          const cz=cell.reduce((s,idx)=>s+Math.sin(d.particles[idx].angle)*d.particles[idx].r,0)/cell.length;
          clusters.push({id:cId,members:cell.slice(),cx,cz,cr:Math.sqrt(cx*cx+cz*cz),cAngle:Math.atan2(cz,cx),pairs,mersenne,stable,strength:cell.length*0.001*(stable?3:1)});
          for(const idx of cell)d.particles[idx].clusterId=cId}}
      d.clusters = clusters;

      // Recolor clustered particles (non-house mode only)
      if (!this.cfg.houses) {
        for(const c of clusters){for(const idx of c.members){
          if(c.stable){cols[idx*3]=1;cols[idx*3+1]=0.93;cols[idx*3+2]=0.73}
          else{cols[idx*3]=0.53;cols[idx*3+1]=0.67;cols[idx*3+2]=0.87}
        }}
      }
    }

    const arm1=time*0.0003*(1+sb[0]*3);
    const arm2=time*0.0004*(1+sb[5]*2)+Math.PI;

    // ═══ PER-PARTICLE ═══
    for (let i = 0; i < active; i++) {
      const p = d.particles[i];
      if (!p) { dd.scale.setScalar(0);dd.updateMatrix();d.mesh.setMatrixAt(i,dd.matrix);continue; }

      // Houses: hidden house (alpha≤0) still simulates but doesn't render
      if (this.cfg.houses && this.houses[p.band].alpha <= 0.01) {
        dd.scale.setScalar(0);dd.updateMatrix();d.mesh.setMatrixAt(i,dd.matrix);p.age++;
        let L=p.r*p.r*p.vTheta;L*=(1-epsilon);const grav=-GM/(p.r*p.r+soft);
        p.vr+=(grav+L*L/((p.r*p.r+soft)*p.r||1))*dt;p.vr*=0.9992;p.r+=p.vr*dt;
        if(p.r>0.1)p.vTheta=L/(p.r*p.r);p.angle+=p.vTheta*dt;
        if(this.cfg.bounce&&p.r<ehPulseR){p.r=ehPulseR+0.05;p.vr=Math.abs(p.vr)*0.3+ehBounce}
        if(p.r>escapeR){p.r=15+Math.random()*15;p.vr=-0.01;p.vTheta=Math.sqrt(GM/(p.r*p.r*p.r))*0.7}
        continue;
      }

      p.age++;
      const r = p.r;
      if(isNaN(r)||isNaN(p.vr)||isNaN(p.vTheta)||isNaN(p.angle)||r<=0){
        p.r=10+Math.random()*15;p.angle=Math.random()*Math.PI*2;p.vr=0;
        p.vTheta=Math.sqrt(Math.abs(GM)/(p.r*p.r*p.r)||0.01)*0.9*(Math.random()>0.5?1:-1);p.age=0;continue}

      const r2=r*r+soft, r3=r2*r||1;
      let L=r*r*p.vTheta;
      L*=(1-epsilon);

      // House-specific physics
      let hr = null, standW = 0, ho = null;
      if (this.cfg.houses) {
        ho = this.houses[p.band];
        hr = HR[p.band];
        standW = sw[p.band];
        const hR = reactivity;
        L*=(1+hr.velocity*hR*0.8);
        L*=(1-hr.pull*hR*0.001);
        L+=hr.spin*hR*0.05*r;
        L+=Math.cos((p.angle-arm1)*2)*0.08*r*hr.velocity*hR;
        p.vr+=Math.cos((p.angle-arm2)*2)*0.003*hr.amplitude*hR;
        p.vr+=standW*hr.amplitude*hR*0.005*r;
        p.vr+=standW*hr.pulse*hR*0.003;
        p.vr+=hr.push*hR*0.02*(0.5+0.5*standW);
      } else {
        // Standard audio perturbation
        const bandE = sb[p.band] * reactivity;
        L+=Math.cos((p.angle-arm1)*2)*0.08*r*bandE;
        p.vr+=Math.cos((p.angle-arm2)*2)*0.003*bandE;
      }

      // Cluster attraction
      if(d.clusters.length>0&&(p.clusterId==null||p.clusterId<0)){
        let nd=Infinity,nc=null;const px=Math.cos(p.angle)*r,pz=Math.sin(p.angle)*r;
        for(const c of d.clusters){const dx=px-c.cx,dz=pz-c.cz,d2=dx*dx+dz*dz;if(d2<nd&&d2>0.5){nd=d2;nc=c}}
        if(nc&&nd<400){const dist=Math.sqrt(nd),str=nc.strength/dist;L+=Math.sin(nc.cAngle-p.angle)*str*r*0.5;p.vr+=(nc.cr-r)*str*0.02}
      }

      // Radial EOM (with house gravity mod if applicable)
      const gravMod = (this.cfg.houses && hr) ? (1+hr.gravity*reactivity*1.5) : 1;
      p.vr+=(-GM*gravMod/r2+L*L/r3)*dt;
      p.vr*=0.9992;
      p.r+=p.vr*dt;
      if(p.r>0.1) p.vTheta=L/(p.r*p.r);
      p.angle+=p.vTheta*dt;

      // EH interaction
      if (p.r < consumeR) {
        const wasStable=p.clusterId>=0&&d.clusters[p.clusterId]&&d.clusters[p.clusterId].stable;
        if (wasStable) {
          // Generative burp
          const cl=d.clusters[p.clusterId],eR=15+cl.pairs*3;
          p.r=eR;p.angle+=Math.PI;
          p.vr=(this.cfg.bounce?0.08:0.04)+cl.pairs*(this.cfg.bounce?0.02:0.01)+(this.cfg.bounce?ehBounce*0.5:0);
          p.vTheta=Math.sqrt(GM/(p.r*p.r*p.r))*0.9*(p.vTheta>=0?1:-1);
          p.age=0;p.mobiusPhase=p.angle;
          d.ejectQueue.push({angle:p.angle,r:eR,spread:cl.pairs*2,ttl:60});
          d.totalBurps++;
          cols[i*3]=1;cols[i*3+1]=0.84;cols[i*3+2]=0;
        } else if (this.cfg.bounce) {
          // Bounce off EH
          p.r=ehPulseR+0.05;
          const pushMod = (this.cfg.houses && hr) ? hr.push*reactivity*0.1 : 0;
          p.vr=Math.abs(p.vr)*0.4+ehBounce+pushMod;
          p.vTheta+=(Math.random()-0.5)*0.02*(1+totalEnergy*3);
          const heat=Math.min(1,0.5+totalEnergy*0.5);
          cols[i*3]=1;cols[i*3+1]=0.7+heat*0.3;cols[i*3+2]=0.4+heat*0.2;
          p.clusterId=-1;d.totalBounces++;
        } else {
          // v1: consume + respawn
          const eR=8+Math.random()*12;const cO=Math.sqrt(GM/(eR*eR*eR));
          p.r=eR;p.angle+=Math.PI*(0.7+Math.random()*0.6);
          p.vr=0.02+Math.random()*0.04;p.vTheta=cO*(0.8+Math.random()*0.4);
          if(Math.random()>0.5) p.vTheta*=-1;
          p.age=0;p.mobiusPhase=p.angle;cols[i*3]=1;cols[i*3+1]=1;cols[i*3+2]=1;
          // Eject queue structures nearby respawns
          for(let eq=d.ejectQueue.length-1;eq>=0;eq--){const ej=d.ejectQueue[eq];ej.ttl--;
            if(ej.ttl<=0){d.ejectQueue.splice(eq,1);continue}
            const dAng=Math.abs(p.angle-ej.angle)%(Math.PI*2);
            if(dAng<0.5||dAng>Math.PI*2-0.5){p.r=ej.r+(Math.random()-0.5)*ej.spread;
              p.angle=ej.angle+(Math.random()-0.5)*0.3;
              p.vTheta=Math.sqrt(GM/(p.r*p.r*p.r))*0.85*(p.vTheta>=0?1:-1);p.vr=0.03;
              cols[i*3]=1;cols[i*3+1]=0.93;cols[i*3+2]=0.73}}
          p.clusterId=-1;
        }
      } else if (p.r > escapeR) {
        p.r=15+Math.random()*15;p.vr=-0.01;
        p.vTheta=Math.sqrt(GM/(p.r*p.r*p.r))*0.7;p.age=0;
      } else if (p.r < (this.cfg.bounce ? ehPulseR*0.5 : 1)) {
        if (this.cfg.bounce) { p.r=ehPulseR+0.1;p.vr=Math.abs(p.vr)+0.05; }
        else { p.r=1;p.vr=Math.abs(p.vr); }
      }

      // Position
      const flare=1+p.r*0.02;
      const mY=Math.sin(p.angle*0.5+p.mobiusPhase)*halfTwistH*flare;
      dd.position.set(Math.cos(p.angle)*p.r, mY, Math.sin(p.angle)*p.r);

      // Scale
      const ageIn=Math.min(1,p.age/20);
      const twkPulse=twinkle>0?(0.6+0.4*Math.abs(Math.cos(p.angle*0.5+time*0.002*(1+p.band*0.3)))):1;
      let bandBoost, emitWave = 1, alphaScale = 1;
      if (this.cfg.houses && hr && ho) {
        bandBoost = 1 + hr.velocity*reactivity*3;
        emitWave = bb ? (1+emission*Math.abs(standW)*0.8) : (1+emission*standW*0.6);
        alphaScale = ho.alpha;
      } else {
        bandBoost = 1 + sb[p.band]*reactivity*3;
      }
      const s = sizeBase*twkPulse*ageIn*bandBoost*alphaScale*emitWave;
      dd.scale.setScalar(Math.max(bb?0.15:0.05, s));

      // Color
      if (this.cfg.houses && ho) {
        if(p.age>0&&p.age<20){const t=p.age/20;cols[i*3]=1+(ho.r-1)*t;cols[i*3+1]=1+(ho.g-1)*t;cols[i*3+2]=1+(ho.b-1)*t}
        else if(p.age>=20){
          const baseBright = bb ? 0.8 : 0.35;
          const bright=(baseBright+hr.velocity*reactivity*(bb?1.5:1.2)+(p.clusterId>=0?(bb?0.4:0.3):0))*emitWave;
          cols[i*3]=Math.min(1,ho.r*bright);cols[i*3+1]=Math.min(1,ho.g*bright);cols[i*3+2]=Math.min(1,ho.b*bright);
        }
      } else {
        const bc = PV_BAND_COLORS_RGB[p.band];
        if(p.age>0&&p.age<20){const t=p.age/20;cols[i*3]=1+(bc[0]-1)*t;cols[i*3+1]=1+(bc[1]-1)*t;cols[i*3+2]=1+(bc[2]-1)*t}
        else if(p.age>=20){
          const bright=0.4+sb[p.band]*reactivity*1.5+(p.clusterId>=0?0.3:0);
          cols[i*3]=Math.min(1,bc[0]*bright);cols[i*3+1]=Math.min(1,bc[1]*bright);cols[i*3+2]=Math.min(1,bc[2]*bright);
        }
      }

      dd.updateMatrix();
      d.mesh.setMatrixAt(i, dd.matrix);
    }

    // Eject queue cleanup (bounce variants)
    if (this.cfg.bounce) {
      for(let eq=d.ejectQueue.length-1;eq>=0;eq--){d.ejectQueue[eq].ttl--;if(d.ejectQueue[eq].ttl<=0)d.ejectQueue.splice(eq,1)}
    }

    // Hide unused slots
    if(active<d.max){dd.scale.setScalar(0);dd.updateMatrix();for(let i=active;i<d.max;i++)d.mesh.setMatrixAt(i,dd.matrix)}
    d.mesh.instanceMatrix.needsUpdate = true;
    d.mesh.instanceColor.needsUpdate = true;
  }

  render(time, dt) {
    if (!this.renderer || !this.scene) return;
    const d = this.disc;
    const sb = this.smoothBands;
    const totalEnergy = this.totalEnergy;
    const bb = this.cfg.brightBoost;

    // Birth particles
    const birthRate = this._g('Birth') / 100;
    const audioBirth = totalEnergy * this._g('React') * 0.01;
    const births = Math.max(0, Math.floor((birthRate*3 + audioBirth*8) * dt));
    for (let b = 0; b < births; b++) this._birthParticle();

    // First batch flash
    if (d.count > 0 && d.count < 20) {
      const fl = document.getElementById(this.prefix+'flash');
      if (fl) { fl.style.opacity = 0.15; setTimeout(() => fl.style.opacity = 0, 300); }
    }

    // Physics
    this._physicsStep(time);

    // Core visuals
    const ehR = d.ehRadius || 2.5;
    this._coreMesh.scale.setScalar(this.cfg.bounce ? ehR*0.7 : 1.5);

    if (!bb && this._ehMesh) {
      const ehScale = this.cfg.bounce ? ehR : (2.5+sb[0]*6+totalEnergy*3);
      this._ehMesh.scale.setScalar(ehScale);
      this._ehMesh.rotation.y=time*0.0002; this._ehMesh.rotation.z=time*0.00015;
      this._ehMesh.material.opacity=0.04+totalEnergy*0.15;
      if(this.cfg.bounce) this._ehMesh.material.color.setHSL(0.75+sb[0]*0.1,0.3+totalEnergy*0.4,0.1+totalEnergy*0.15);
    }
    if (!bb && this._psMesh) {
      this._psMesh.scale.setScalar(this.cfg.bounce ? ehR*1.6 : (1+sb[0]*2));
      this._psMesh.rotation.z=time*0.0003;
      this._psMesh.material.opacity=0.05+totalEnergy*0.25;
      this._psMesh.material.color.setHSL(0.08+sb[5]*0.15,0.8,0.5+sb[0]*0.3);
    }
    if (!bb && this._glowMesh) {
      const grS = this.cfg.bounce ? (ehR*2.5+totalEnergy*4) : (1+totalEnergy*4);
      this._glowMesh.scale.setScalar(grS);
      this._glowMesh.rotation.z=time*0.0002;
      this._glowMesh.material.opacity=0.02+totalEnergy*0.1;
    }

    this._ptLight.intensity = (bb?0.4:0.05) + totalEnergy*(bb?4:3) + sb[0]*(bb?3:2);
    this._ptLight.color.setHSL(0.06+totalEnergy*0.12, 0.85, (bb?0.5:0.4)+totalEnergy*(bb?0.3:0.4));

    // Stats HUD
    const stC = d.clusters.filter(c=>c.stable).length;
    const stat = document.getElementById(this.prefix+'stat');
    if (stat) {
      stat.innerHTML = `<b>p</b>${d.count}/${d.max} <b>c</b>${d.clusters.length}${stC?' ★'+stC:''} <b>GM</b>${this._getGM().toFixed(0)} <b>E</b>${(totalEnergy*100|0)}%` +
        (this.cfg.bounce ? ` <b>bn</b>${d.totalBounces} <b>bp</b>${d.totalBurps}` : ` <b>burps</b>${d.totalBurps}`);
    }

    if (this.cfg.screensaver) this._lcUpdateAge(time);

    this.renderer.render(this.scene, this.camera);
  }
}


// ╔═══════════════════════════════════════════════════════╗
// ║  5. INITIALIZATION — Register all 6 engines           ║
// ╚═══════════════════════════════════════════════════════╝

document.addEventListener('DOMContentLoaded', () => {
  // Wait a beat for ouroboros.js to init first
  setTimeout(() => {
    const defs = [
      ['pvParticles2dPanel', () => new Particles2DEngine('pvParticles2dPanel')],
      ['pvField3dPanel',     () => new Field3DEngine('pvField3dPanel')],
      ['pvBlackhole1Panel',  () => new BlackHoleEngine('pvBlackhole1Panel', {})],
      ['pvBlackhole2Panel',  () => new BlackHoleEngine('pvBlackhole2Panel', { bounce:true })],
      ['pvBlackholeHPanel',  () => new BlackHoleEngine('pvBlackholeHPanel', { bounce:true, houses:true })],
      ['pvBlackholeFPanel',  () => new BlackHoleEngine('pvBlackholeFPanel', { bounce:true, houses:true, screensaver:true, brightBoost:true })],
    ];

    defs.forEach(([id, factory]) => {
      if (!document.getElementById(id)) return;
      const engine = factory();
      PV.engines[id] = engine;
      engine.hookPanel();
    });
  }, 300);
});
