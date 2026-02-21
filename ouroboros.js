/* ============================================================
   OUROBOROS — Immersive Media Engine
   All modules, EventBus architecture, zero external dependencies
   ============================================================ */

/* ============================================================
   1. EVENT BUS — Central nervous system
   ============================================================ */
class EventBus {
  constructor() { this._listeners = {}; }
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(f => f !== fn);
  }
  emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(fn => {
        try { fn(data); } catch (e) { console.error(`[EventBus] Error in "${event}" handler:`, e); }
      });
    }
  }
}

const bus = new EventBus();

/* ============================================================
   2. AUDIO ENGINE — Playback, playlist, MediaSession
   ============================================================ */
class AudioEngine {
  constructor() {
    this.audio = null;
    this.playlist = [];
    this.index = 0;
    this.isPlaying = false;
    this.repeatMode = 'off';      // 'off' → 'all' → 'one'
    this.shuffleOn = false;
    this.shuffleQueue = [];
    this.shufflePos = -1;
    this._seekInterval = null;
    this._seekSpeed = 2;
    this._bindDOM();
    this._initEvents();
    this._initMediaSession();
    this._initKeyboard();
  }

  _bindDOM() {
    this.playBtn = document.getElementById('audioPlayPauseBtn');
    this.prevBtn = document.getElementById('audioPrevBtn');
    this.nextBtn = document.getElementById('audioNextBtn');
    this.seekBar = document.getElementById('audioSeek');
    this.volBar = document.getElementById('audioVolume');
    this.timeCur = document.getElementById('audioCurrentTime');
    this.timeDur = document.getElementById('audioDuration');
    this.trackName = document.getElementById('audioTrackName');
    this.playlistEl = document.getElementById('audioPlaylist');
    this.openFilesBtn = document.getElementById('audioOpenFiles');
    this.openFolderBtn = document.getElementById('audioOpenFolder');
    this.repeatBtn = document.getElementById('audioRepeatBtn');
    this.shuffleBtn = document.getElementById('audioShuffleBtn');
    this.ffBtn = document.getElementById('audioFFBtn');
    this.rwBtn = document.getElementById('audioRWBtn');
    this.replayBtn = document.getElementById('audioReplayBtn');
  }

  _initEvents() {
    this.playBtn?.addEventListener('click', () => this.togglePlay());
    this.prevBtn?.addEventListener('click', () => this.prev());
    this.nextBtn?.addEventListener('click', () => this.next());
    this.seekBar?.addEventListener('input', () => this._seek());
    this.volBar?.addEventListener('input', () => {
      if (this.audio) this.audio.volume = parseFloat(this.volBar.value);
    });
    this.openFilesBtn?.addEventListener('click', () => this._openFiles());
    this.openFolderBtn?.addEventListener('click', () => this._openFolder());
    this.repeatBtn?.addEventListener('click', () => this.cycleRepeat());
    this.shuffleBtn?.addEventListener('click', () => this.toggleShuffle());
    this.replayBtn?.addEventListener('click', () => this.replay());
    this._bindHoldSeek(this.ffBtn, 1);
    this._bindHoldSeek(this.rwBtn, -1);
    this.playlistEl?.addEventListener('click', e => {
      const li = e.target.closest('li');
      if (li && li.dataset.idx !== undefined) this._selectTrack(+li.dataset.idx);
    });
  }

  _initMediaSession() {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => this.play());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
  }

  _openFiles() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'audio/*'; input.multiple = true;
    input.onchange = () => this._loadFiles(Array.from(input.files));
    input.click();
  }

  _openFolder() {
    const input = document.createElement('input');
    input.type = 'file'; input.webkitdirectory = true;
    input.onchange = () => this._loadFiles(Array.from(input.files));
    input.click();
  }

  _loadFiles(files) {
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    if (!audioFiles.length) { bus.emit('error', { msg: 'No audio files found in selection.' }); return; }
    this.playlist = audioFiles;
    this.index = 0;
    this._rebuildShuffle();
    this._renderPlaylist();
    this._loadTrack(this.index);
    this.play();
  }

  _renderPlaylist() {
    if (!this.playlistEl) return;
    this.playlistEl.innerHTML = '';
    this.playlist.forEach((f, idx) => {
      const li = document.createElement('li');
      li.textContent = f.name.replace(/\.[^/.]+$/, '');
      li.dataset.idx = idx;
      li.setAttribute('role', 'option');
      if (idx === this.index) li.className = 'selected';
      this.playlistEl.appendChild(li);
    });
  }

  _selectTrack(idx) {
    if (idx >= 0 && idx < this.playlist.length) {
      this.index = idx;
      this._loadTrack(idx);
      this.play();
    }
  }

  _loadTrack(idx) {
    // Hard reset audio element per track
    if (this.audio) {
      try { this.audio.pause(); } catch(e) {}
      if (this.audio.parentNode) this.audio.parentNode.removeChild(this.audio);
    }
    this.audio = document.createElement('audio');
    this.audio.style.display = 'none';
    document.body.appendChild(this.audio);

    this.audio.addEventListener('timeupdate', () => this._updateSeek());
    this.audio.addEventListener('loadedmetadata', () => this._updateMeta());
    this.audio.addEventListener('ended', () => this._onTrackEnd());
    this.audio.addEventListener('error', () => bus.emit('error', { msg: 'Audio playback error' }));
    this.audio.addEventListener('play', () => bus.emit('track:play', { audio: this.audio }));
    this.audio.addEventListener('pause', () => bus.emit('track:pause', { audio: this.audio }));

    if (!this.playlist[idx]) return;
    const url = URL.createObjectURL(this.playlist[idx]);
    this.audio.src = url;
    if (this.trackName) this.trackName.textContent = this.playlist[idx].name.replace(/\.[^/.]+$/, '');
    this._renderPlaylist();
    bus.emit('track:load', { audio: this.audio, name: this.playlist[idx].name, index: idx });
  }

  play() {
    if (!this.audio) return;
    this.audio.play().catch(e => bus.emit('error', { msg: 'Playback blocked: ' + e.message }));
    this.isPlaying = true;
    if (this.playBtn) this.playBtn.textContent = '⏸';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  }

  pause() {
    if (this.audio) this.audio.pause();
    this.isPlaying = false;
    if (this.playBtn) this.playBtn.textContent = '▶';
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  }

  togglePlay() { this.isPlaying ? this.pause() : this.play(); }

  prev() {
    // If >3s in, restart current track; otherwise go back
    if (this.audio && this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    if (this.shuffleOn && this.shufflePos > 0) {
      this.shufflePos--;
      this.index = this.shuffleQueue[this.shufflePos];
      this._loadTrack(this.index);
      this.play();
    } else if (this.index > 0) {
      this.index--;
      this._loadTrack(this.index);
      this.play();
    }
  }

  next() {
    if (this.shuffleOn) {
      this._nextShuffle();
    } else if (this.index < this.playlist.length - 1) {
      this.index++;
      this._loadTrack(this.index);
      this.play();
    } else if (this.repeatMode === 'all') {
      this.index = 0;
      this._loadTrack(this.index);
      this.play();
    } else {
      this.pause();
      bus.emit('track:end', {});
    }
  }

  // ── Track end handler (repeat-one loops here) ──────────
  _onTrackEnd() {
    if (this.repeatMode === 'one') {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {});
      return;
    }
    this.next();
  }

  // ── Replay current track from start ────────────────────
  replay() {
    if (!this.audio) return;
    this.audio.currentTime = 0;
    if (!this.isPlaying) this.play();
  }

  // ── Repeat: off → all → one → off ─────────────────────
  cycleRepeat() {
    const modes = ['off', 'all', 'one'];
    const labels = { off: '🔁', all: '🔁', one: '🔂' };
    this.repeatMode = modes[(modes.indexOf(this.repeatMode) + 1) % 3];
    if (this.repeatBtn) {
      this.repeatBtn.textContent = labels[this.repeatMode];
      this.repeatBtn.classList.toggle('active', this.repeatMode !== 'off');
      this.repeatBtn.title = 'Repeat: ' + this.repeatMode;
    }
  }

  // ── Shuffle toggle ─────────────────────────────────────
  toggleShuffle() {
    this.shuffleOn = !this.shuffleOn;
    if (this.shuffleOn) this._rebuildShuffle();
    if (this.shuffleBtn) {
      this.shuffleBtn.classList.toggle('active', this.shuffleOn);
      this.shuffleBtn.title = 'Shuffle: ' + (this.shuffleOn ? 'ON' : 'OFF');
    }
  }

  // Fisher-Yates shuffle — non-repeating until exhausted
  _rebuildShuffle() {
    const arr = this.playlist.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    this.shuffleQueue = arr;
    this.shufflePos = -1;
  }

  _nextShuffle() {
    this.shufflePos++;
    if (this.shufflePos >= this.shuffleQueue.length) {
      if (this.repeatMode === 'all') {
        this._rebuildShuffle();
        this.shufflePos = 0;
      } else {
        this.pause();
        bus.emit('track:end', {});
        return;
      }
    }
    this.index = this.shuffleQueue[this.shufflePos];
    this._loadTrack(this.index);
    this.play();
  }

  // ── Hold-to-seek (accelerating FF/RW) ──────────────────
  _bindHoldSeek(btn, direction) {
    if (!btn) return;
    const start = () => {
      this._seekSpeed = 2;
      this._seekInterval = setInterval(() => {
        if (!this.audio || !this.audio.duration) return;
        this.audio.currentTime = Math.max(0,
          Math.min(this.audio.duration, this.audio.currentTime + direction * this._seekSpeed));
        this._seekSpeed = Math.min(this._seekSpeed * 1.15, 30);
      }, 100);
    };
    const stop = () => {
      clearInterval(this._seekInterval);
      this._seekInterval = null;
      this._seekSpeed = 2;
    };
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    btn.addEventListener('touchstart', e => { e.preventDefault(); start(); });
    btn.addEventListener('touchend', stop);
  }

  // ── Keyboard shortcuts ─────────────────────────────────
  _initKeyboard() {
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      switch (e.code) {
        case 'Space':      e.preventDefault(); this.togglePlay(); break;
        case 'ArrowRight':  e.shiftKey ? this.next() : this._nudge(10); break;
        case 'ArrowLeft':   e.shiftKey ? this.prev() : this._nudge(-10); break;
        case 'KeyS':        if (!e.ctrlKey && !e.metaKey) this.toggleShuffle(); break;
        case 'KeyR':        if (!e.ctrlKey && !e.metaKey) this.cycleRepeat(); break;
      }
    });
  }

  _nudge(seconds) {
    if (!this.audio || !this.audio.duration) return;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + seconds));
  }

  _seek() {
    if (!this.audio || !this.seekBar || !this.audio.duration) return;
    this.audio.currentTime = (parseFloat(this.seekBar.value) / 100) * this.audio.duration;
  }

  _updateSeek() {
    if (!this.audio || !this.audio.duration || !this.seekBar) return;
    this.seekBar.value = (this.audio.currentTime / this.audio.duration) * 100;
    if (this.timeCur) this.timeCur.textContent = this._fmt(this.audio.currentTime);
    if (this.timeDur) this.timeDur.textContent = this._fmt(this.audio.duration);
  }

  _updateMeta() {
    if (!this.audio) return;
    if (this.volBar) this.volBar.value = this.audio.volume;
    this._updateSeek();
    if ('mediaSession' in navigator && this.playlist[this.index]) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.playlist[this.index].name.replace(/\.[^/.]+$/, ''),
        artist: 'Siren Sinful'
      });
    }
  }

  _fmt(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  getAudio() { return this.audio; }
}

/* ============================================================
   3. RENDER ENGINE — Audio Visualizer
   ============================================================ */
class RenderEngine {
  constructor() {
    this.canvas = document.getElementById('audioVisualizerCanvas');
    this.ctx = this.canvas?.getContext('2d');
    this.modeSel = document.getElementById('visualizerMode');
    this.toggleBtn = document.getElementById('visualizerToggle');
    this.fullscreenBtn = document.getElementById('visualizerFullscreenBtn');
    this.panel = document.getElementById('visualizerPanel');
    this.audioCtx = null;
    this.analyser = null;
    this.srcNode = null;
    this.rafId = null;
    this.active = true;
    this.mode = this.modeSel?.value || 'waveform';
    this.isFullscreen = false;
    this.currentAudio = null;

    this._initEvents();
    this._initResize();
    this._listenBus();
  }

  _initEvents() {
    this.toggleBtn?.addEventListener('click', () => this.toggle());
    this.modeSel?.addEventListener('change', () => { this.mode = this.modeSel.value; });
    this.fullscreenBtn?.addEventListener('click', () => this.toggleFullscreen());
  }

  _listenBus() {
    bus.on('track:load', ({ audio }) => {
      this.stop();
      this._destroyAudioCtx();
      this.currentAudio = audio;
    });
    bus.on('track:play', ({ audio }) => {
      this.currentAudio = audio;
      this.start();
    });
    bus.on('track:pause', () => this.stop());
    bus.on('track:end', () => { this.stop(); this.clear(); });
  }

  _destroyAudioCtx() {
    if (this.srcNode) { try { this.srcNode.disconnect(); } catch(e) {} this.srcNode = null; }
    if (this.audioCtx) { try { this.audioCtx.close(); } catch(e) {} this.audioCtx = null; }
    this.analyser = null;
  }

  _initResize() {
    const resize = () => {
      if (!this.canvas || !this.panel) return;
      const content = this.panel.querySelector('.panel-content');
      if (!content) return;
      const controls = content.querySelector('.visualizer-controls');
      if (this.isFullscreen) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - (controls?.offsetHeight || 0) - (this.panel.querySelector('.panel-header')?.offsetHeight || 0);
      } else {
        this.canvas.width = content.clientWidth;
        this.canvas.height = Math.max(100, content.clientHeight - (controls?.offsetHeight || 40));
      }
    };
    window.addEventListener('resize', resize);
    new ResizeObserver(resize).observe(this.panel);
    setTimeout(resize, 100);
    this._resize = resize;
  }

  toggle() {
    this.active = !this.active;
    this.toggleBtn && (this.toggleBtn.textContent = this.active ? 'On' : 'Off');
    if (this.active && this.currentAudio && !this.currentAudio.paused) this.start();
    if (!this.active) this.stop();
  }

  toggleFullscreen() {
    if (!this.panel) return;
    this.isFullscreen = !this.isFullscreen;
    this.panel.classList.toggle('fullscreen', this.isFullscreen);
    this.fullscreenBtn && (this.fullscreenBtn.textContent = this.isFullscreen ? '⊡' : '⛶');
    setTimeout(() => this._resize(), 50);
  }

  start() {
    if (!this.currentAudio || !this.active) return;
    // Only create new AudioContext if needed
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this._destroyAudioCtx();
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.srcNode = this.audioCtx.createMediaElementSource(this.currentAudio);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.srcNode.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    if (!this.rafId) this.rafId = requestAnimationFrame(() => this.render());
  }

  stop() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  render() {
    if (!this.active || !this.analyser) { this.rafId = null; return; }
    const { width: w, height: h } = this.canvas;
    this.ctx.clearRect(0, 0, w, h);

    if (this.mode === 'waveform') this._drawWaveform(w, h);
    else if (this.mode === 'spectrum') this._drawSpectrum(w, h);
    else if (this.mode === 'bars') this._drawBars(w, h);
    else if (this.mode === 'dots') this._drawDots(w, h);

    this.rafId = requestAnimationFrame(() => this.render());
  }

  _drawWaveform(w, h) {
    const len = this.analyser.fftSize;
    const data = new Uint8Array(len);
    this.analyser.getByteTimeDomainData(data);
    this.ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const x = (i / len) * w;
      const y = (data[i] / 255) * h;
      i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
    }
    this.ctx.strokeStyle = '#c9a84c';
    this.ctx.lineWidth = 1.5;
    this.ctx.shadowColor = '#c9a84c44';
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  _drawSpectrum(w, h) {
    const len = this.analyser.frequencyBinCount;
    const data = new Uint8Array(len);
    this.analyser.getByteFrequencyData(data);
    const barW = w / len;
    for (let i = 0; i < len; i++) {
      const v = data[i] / 255;
      const hue = 35 + v * 15;
      this.ctx.fillStyle = `hsla(${hue}, 60%, ${30 + v * 40}%, ${0.4 + v * 0.6})`;
      this.ctx.fillRect(i * barW, h * (1 - v), barW + 0.5, h * v);
    }
  }

  _drawBars(w, h) {
    const len = this.analyser.frequencyBinCount;
    const data = new Uint8Array(len);
    this.analyser.getByteFrequencyData(data);
    const step = 4;
    const barW = (w / (len / step)) - 2;
    for (let i = 0; i < len; i += step) {
      const v = data[i] / 255;
      const x = (i / step) * (barW + 2);
      this.ctx.fillStyle = `rgba(201,168,76,${0.3 + v * 0.7})`;
      this.ctx.fillRect(x, h * (1 - v), barW, h * v);
    }
  }

  _drawDots(w, h) {
    const len = this.analyser.frequencyBinCount;
    const data = new Uint8Array(len);
    this.analyser.getByteFrequencyData(data);
    for (let i = 0; i < len; i += 6) {
      const v = data[i] / 255;
      const x = (i / len) * w;
      const y = h * (1 - v);
      const r = 2 + v * 12;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(201,168,76,${0.15 + v * 0.6})`;
      this.ctx.fill();
    }
  }

  clear() {
    if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

/* ============================================================
   4. RGB OVERLAY
   ============================================================ */
class RGBOverlay {
  constructor() {
    this.canvas = document.getElementById('rgbOverlayCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.controls = {
      r: document.getElementById('rgbRed'),
      g: document.getElementById('rgbGreen'),
      b: document.getElementById('rgbBlue'),
      ra: document.getElementById('rgbRedAlpha'),
      ga: document.getElementById('rgbGreenAlpha'),
      ba: document.getElementById('rgbBlueAlpha'),
      hr: document.getElementById('hideRed'),
      hg: document.getElementById('hideGreen'),
      hb: document.getElementById('hideBlue'),
      hue: document.getElementById('hueSlider'),
    };
    this.animateBtn = document.getElementById('randomizeRGB');
    this.status = document.getElementById('rgbOverlayStatus');
    this.isAnimating = false;
    this.intervalId = null;

    Object.values(this.controls).forEach(el =>
      el?.addEventListener('input', () => this.draw())
    );
    this.animateBtn?.addEventListener('click', () => this.toggleAnimate());
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.draw();
  }

  draw() {
    if (!this.ctx) return;
    const c = this.controls;
    const r = c.hr?.checked ? 0 : parseInt(c.r?.value || 0);
    const g = c.hg?.checked ? 0 : parseInt(c.g?.value || 0);
    const b = c.hb?.checked ? 0 : parseInt(c.b?.value || 0);
    const a = (
      (c.hr?.checked ? 0 : parseFloat(c.ra?.value || 0)) +
      (c.hg?.checked ? 0 : parseFloat(c.ga?.value || 0)) +
      (c.hb?.checked ? 0 : parseFloat(c.ba?.value || 0))
    ) / 3;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.status) this.status.textContent = this.isAnimating ? 'Animating...' : '';
  }

  toggleAnimate() {
    if (this.isAnimating) {
      clearInterval(this.intervalId);
      this.isAnimating = false;
      this.draw();
      return;
    }
    this.isAnimating = true;
    this.intervalId = setInterval(() => this._step(), 120);
  }

  _step() {
    const c = this.controls;
    this._jitter(c.r, c.hr, 0, 255, 5);
    this._jitter(c.g, c.hg, 0, 255, 5);
    this._jitter(c.b, c.hb, 0, 255, 5);
    this._jitter(c.ra, c.hr, 0, 1, 0.04);
    this._jitter(c.ga, c.hg, 0, 1, 0.04);
    this._jitter(c.ba, c.hb, 0, 1, 0.04);
    if (c.hue && Math.random() < 0.3) {
      c.hue.value = ((parseInt(c.hue.value) || 0) + (Math.random() > 0.5 ? 3 : -3) + 360) % 360;
    }
    this.draw();
  }

  _jitter(input, hide, min, max, step) {
    if (!input || hide?.checked) return;
    let v = parseFloat(input.value);
    v += (Math.random() > 0.5 ? step : -step);
    v = Math.max(min, Math.min(max, v));
    input.value = max <= 1 ? v.toFixed(2) : Math.round(v);
  }
}

/* ============================================================
   5. SLIDESHOW ENGINE
   ============================================================ */
class SlideshowEngine {
  constructor() {
    this.layerA = document.getElementById('bgLayerA');
    this.layerB = document.getElementById('bgLayerB');
    this.images = [];
    this.index = 0;
    this.aActive = true;
    this.timer = null;
    this.paused = false;
    this.interval = 10;
    this.countEl = document.getElementById('slideshowCount');

    // Pan/bounce state — position as % (0–100), velocity as %/frame
    this.panScale = 145;  // background-size %, how much bigger than viewport
    this.pan = { x: 50, y: 50, vx: 0, vy: 0 };
    this._rafId = null;

    document.getElementById('slideshowOpenFiles')?.addEventListener('click', () => this._openFiles());
    document.getElementById('slideshowOpenFolder')?.addEventListener('click', () => this._openFolder());
    document.getElementById('slideshowPrev')?.addEventListener('click', () => this.prev());
    document.getElementById('slideshowNext')?.addEventListener('click', () => this.next());
    document.getElementById('slideshowPause')?.addEventListener('click', () => this.togglePause());

    const intInput = document.getElementById('slideshowInterval');
    intInput?.addEventListener('change', () => {
      this.interval = Math.max(1, parseInt(intInput.value) || 10);
      if (!this.paused && this.images.length) this._startTimer();
    });
  }

  _openFiles() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
    input.onchange = () => this._load(Array.from(input.files));
    input.click();
  }

  _openFolder() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.webkitdirectory = true;
    input.onchange = () => this._load(Array.from(input.files));
    input.click();
  }

  _load(files) {
    this.images = files.filter(f => f.type.startsWith('image/')).map(f => URL.createObjectURL(f));
    if (!this.images.length) { bus.emit('error', { msg: 'No image files found.' }); return; }
    this.index = 0;
    this._show();
    this._startTimer();
    this._startPan();
    this._updateCount();
  }

  _show() {
    if (!this.images.length) return;
    const url = this.images[this.index];
    const active = this.aActive ? this.layerA : this.layerB;
    const inactive = this.aActive ? this.layerB : this.layerA;
    if (active) {
      active.style.backgroundImage = `url('${url}')`;
      active.style.backgroundSize = this.panScale + '%';
      active.style.opacity = '0.15';
    }
    if (inactive) inactive.style.opacity = '0';
    this.aActive = !this.aActive;
    // New random direction on each image change
    this._randomizeVelocity();
  }

  // ── Pan / Bounce ───────────────────────────────────────
  _randomizeVelocity() {
    // Random angle, consistent slow speed (0.015–0.035 %/frame ≈ 1–2%/sec at 60fps)
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.015 + Math.random() * 0.02;
    this.pan.vx = Math.cos(angle) * speed;
    this.pan.vy = Math.sin(angle) * speed;
    // Start from a random position within the safe range
    this.pan.x = 20 + Math.random() * 60;
    this.pan.y = 20 + Math.random() * 60;
  }

  _startPan() {
    if (this._rafId) return; // already running
    this._randomizeVelocity();
    const step = () => {
      this._panFrame();
      this._rafId = requestAnimationFrame(step);
    };
    this._rafId = requestAnimationFrame(step);
  }

  _stopPan() {
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  }

  _panFrame() {
    // Move
    this.pan.x += this.pan.vx;
    this.pan.y += this.pan.vy;

    // Bounce at 0% and 100%
    if (this.pan.x <= 0)   { this.pan.x = 0;   this.pan.vx = Math.abs(this.pan.vx); }
    if (this.pan.x >= 100) { this.pan.x = 100;  this.pan.vx = -Math.abs(this.pan.vx); }
    if (this.pan.y <= 0)   { this.pan.y = 0;    this.pan.vy = Math.abs(this.pan.vy); }
    if (this.pan.y >= 100) { this.pan.y = 100;   this.pan.vy = -Math.abs(this.pan.vy); }

    // Apply to whichever layer is currently visible
    const visible = this.aActive ? this.layerB : this.layerA; // flipped because _show toggles after set
    if (visible) {
      visible.style.backgroundPosition = `${this.pan.x}% ${this.pan.y}%`;
    }
  }

  next() {
    if (!this.images.length) return;
    this.index = (this.index + 1) % this.images.length;
    this._show();
    this._updateCount();
  }

  prev() {
    if (!this.images.length) return;
    this.index = (this.index - 1 + this.images.length) % this.images.length;
    this._show();
    this._updateCount();
  }

  togglePause() {
    this.paused = !this.paused;
    const btn = document.getElementById('slideshowPause');
    if (btn) btn.textContent = this.paused ? 'Resume' : 'Pause';
    if (this.paused) {
      clearInterval(this.timer);
      this._stopPan();
    } else {
      this._startTimer();
      this._startPan();
    }
  }

  _startTimer() {
    clearInterval(this.timer);
    if (!this.images.length) return;
    this.timer = setInterval(() => this.next(), this.interval * 1000);
  }

  _updateCount() {
    if (this.countEl) this.countEl.textContent = this.images.length ? `${this.index + 1} / ${this.images.length}` : '';
  }
}

/* ============================================================
   6. SPEED READER (RSVP)
   ============================================================ */
class SpeedReader {
  constructor() {
    this.overlay = document.getElementById('rsvpOverlay');
    this.wordbox = document.getElementById('rsvpWordbox');
    this.input = document.getElementById('speedreaderInput');
    this.words = [];
    this.idx = 0;
    this.active = false;
    this.running = false;
    this.timer = null;

    // Toolbar controls
    this.wpmInput = document.getElementById('srWpmInput');
    this.phaseDropdown = document.getElementById('srPhaseDropdown');

    // Overlay controls
    this.oWpm = document.getElementById('rsvpWpmInput');
    this.oPhase = document.getElementById('rsvpPhaseDropdown');
    this.oPause = document.getElementById('rsvpPauseBtn');
    this.oRewind = document.getElementById('rsvpRewindBtn');
    this.oClose = document.getElementById('rsvpCloseBtn');
    this.oProgress = document.getElementById('rsvpProgress');

    // Badges
    this.bHz = document.getElementById('rsvpHzBadge');
    this.bPhase = document.getElementById('rsvpPhaseBadge');
    this.bStasis = document.getElementById('rsvpStasisBadge');

    document.getElementById('startRSVP')?.addEventListener('click', () => this.launch());
    document.getElementById('closeRSVP')?.addEventListener('click', () => this.close());
    this.oClose?.addEventListener('click', () => this.close());
    this.oPause?.addEventListener('click', () => this.togglePause());
    this.oRewind?.addEventListener('click', () => this.rewind());

    // Sync WPM between toolbar and overlay
    this.wpmInput?.addEventListener('input', () => { if (this.oWpm) this.oWpm.value = this.wpmInput.value; });
    this.oWpm?.addEventListener('input', () => { if (this.wpmInput) this.wpmInput.value = this.oWpm.value; });

    // Sync phase
    this.phaseDropdown?.addEventListener('change', () => { if (this.oPhase) this.oPhase.value = this.phaseDropdown.value; this._updateBadges(); });
    this.oPhase?.addEventListener('change', () => { if (this.phaseDropdown) this.phaseDropdown.value = this.oPhase.value; this._updateBadges(); });

    // ESC to close
    this.overlay?.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
  }

  launch(text) {
    const src = text || this.input?.value || '';
    if (!src.trim()) { bus.emit('error', { msg: 'No text to read. Paste text into the Speedreader panel first.' }); return; }
    this.words = src.match(/\S+/g) || [];
    this.idx = 0;
    this.active = true;
    this.running = true;

    // Sync overlay controls
    if (this.oWpm && this.wpmInput) this.oWpm.value = this.wpmInput.value;
    if (this.oPhase && this.phaseDropdown) this.oPhase.value = this.phaseDropdown.value;

    this.overlay?.classList.add('active');
    this.overlay?.focus();
    this._updateBadges();
    this._run();
  }

  close() {
    this.overlay?.classList.remove('active');
    this.active = false;
    this.running = false;
    clearTimeout(this.timer);
    if (this.wordbox) this.wordbox.innerHTML = '';
  }

  togglePause() {
    if (!this.active) return;
    this.running = !this.running;
    if (this.oPause) this.oPause.textContent = this.running ? 'Pause' : 'Resume';
    if (this.running) this._run();
  }

  rewind() {
    if (!this.active) return;
    this.idx = Math.max(0, this.idx - 10);
    this._display();
  }

  _run() {
    if (!this.active || !this.running) return;
    if (this.idx >= this.words.length) {
      if (this.wordbox) this.wordbox.innerHTML = '<span style="opacity:0.5">— end —</span>';
      this._updateProgress();
      return;
    }
    this._display();

    let wpm = parseInt(this.oWpm?.value || this.wpmInput?.value || 400, 10) || 400;
    let interval = 60000 / wpm;

    const hz = parseInt(this.oPhase?.value || '', 10);
    if (hz) interval = 1000 / hz;

    this.timer = setTimeout(() => {
      if (this.running) { this.idx++; this._run(); }
    }, interval);
  }

  _display() {
    if (!this.wordbox || !this.words.length) return;
    const word = this.words[this.idx] || '';
    const orp = this._getORP(word);
    const html = this._escHtml(word.slice(0, orp)) +
      '<span class="orp">' + this._escHtml(word[orp] || '') + '</span>' +
      this._escHtml(word.slice(orp + 1));
    this.wordbox.innerHTML = html;
    this._updateBadges();
    this._updateProgress();
  }

  _getORP(word) {
    return Math.max(0, Math.min(word.length - 1, Math.floor((word.length - 1) / 2)));
  }

  _escHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  _updateBadges() {
    const hz = this.oPhase?.value || '';
    if (this.bHz) this.bHz.textContent = hz || '—';
    if (this.bPhase) {
      this.bPhase.textContent = hz ? hz + 'Hz' : 'WPM';
      this.bPhase.classList.toggle('active', !!hz);
    }
    if (this.bStasis) this.bStasis.textContent = (!this.running && this.active) ? 'STASIS' : '';
  }

  _updateProgress() {
    if (this.oProgress) {
      this.oProgress.textContent = this.words.length ? `${this.idx + 1} / ${this.words.length}` : '';
    }
  }
}

/* ============================================================
   7. WINDOW MANAGER — Drag, Resize, Lock, Hide, Restore
   ============================================================ */
class WindowManager {
  constructor(panelIds) {
    this.panelIds = panelIds;
    this.sidebar = document.getElementById('windowSidebar');
    this._init();
  }

  _init() {
    this.panelIds.forEach(pid => {
      const panel = document.getElementById(pid);
      if (!panel) return;

      // Hide button
      const hideBtn = panel.querySelector('.panel-hide');
      hideBtn?.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.add('hidden');
        this._updateSidebar();
      });

      // Lock button
      const lockBtn = panel.querySelector('.panel-lock');
      lockBtn?.addEventListener('click', e => {
        e.stopPropagation();
        panel.classList.toggle('locked');
        lockBtn.textContent = panel.classList.contains('locked') ? '🔓' : '🔒';
      });

      // Drag
      const header = panel.querySelector('.panel-header');
      let dragging = false, ox = 0, oy = 0;
      header?.addEventListener('mousedown', e => {
        if (panel.classList.contains('locked') || e.target.tagName === 'BUTTON') return;
        dragging = true;
        ox = e.clientX - panel.offsetLeft;
        oy = e.clientY - panel.offsetTop;
        panel.classList.add('dragging');
        document.body.style.userSelect = 'none';
      });
      window.addEventListener('mousemove', e => {
        if (!dragging) return;
        panel.style.left = (e.clientX - ox) + 'px';
        panel.style.top = (e.clientY - oy) + 'px';
      });
      window.addEventListener('mouseup', () => {
        if (dragging) {
          dragging = false;
          panel.classList.remove('dragging');
          document.body.style.userSelect = '';
        }
      });

      // Resize handle
      const handle = document.createElement('div');
      handle.className = 'panel-resize-handle';
      panel.appendChild(handle);
      let resizing = false, sw, sh, sx, sy;
      handle.addEventListener('mousedown', e => {
        if (panel.classList.contains('locked')) return;
        resizing = true; sw = panel.offsetWidth; sh = panel.offsetHeight;
        sx = e.clientX; sy = e.clientY;
        e.stopPropagation(); e.preventDefault();
      });
      window.addEventListener('mousemove', e => {
        if (!resizing) return;
        panel.style.width = Math.max(220, sw + (e.clientX - sx)) + 'px';
        panel.style.height = Math.max(120, sh + (e.clientY - sy)) + 'px';
      });
      window.addEventListener('mouseup', () => { resizing = false; });

      // Z-index: click to bring to front
      panel.addEventListener('mousedown', () => {
        document.querySelectorAll('.panel').forEach(p => p.style.zIndex = 1011);
        panel.style.zIndex = 1020;
      });
    });

    this._updateSidebar();
  }

  _updateSidebar() {
    if (!this.sidebar) return;
    this.sidebar.innerHTML = '';
    this.panelIds.forEach(pid => {
      const panel = document.getElementById(pid);
      if (!panel || !panel.classList.contains('hidden')) return;
      const btn = document.createElement('button');
      btn.textContent = panel.querySelector('.panel-header')?.childNodes[0]?.textContent?.trim() || pid;
      btn.addEventListener('click', () => {
        panel.classList.remove('hidden');
        this._updateSidebar();
      });
      this.sidebar.appendChild(btn);
    });
  }
}

/* ============================================================
   8. ERROR DISPLAY
   ============================================================ */
bus.on('error', ({ msg }) => {
  console.warn('[Ouroboros]', msg);
  // Brief visual toast — could be enhanced
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    background: '#1e1218', color: '#c44a6c', border: '1px solid #c44a6c33',
    padding: '8px 18px', borderRadius: '6px', fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem', zIndex: '9000', opacity: '0', transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  });
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.style.opacity = '1');
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
});

/* ============================================================
   9. APP INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Landing overlay — click to enter (also unlocks AudioContext)
  const landing = document.getElementById('landingOverlay');
  const nav = document.getElementById('siteNav');

  function enterSite() {
    landing?.classList.add('hidden');
    nav?.classList.add('visible');
    landing?.removeEventListener('click', enterSite);
  }
  landing?.addEventListener('click', enterSite);

  // Also allow Enter key
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && landing && !landing.classList.contains('hidden')) enterSite();
  });

  // Initialize all modules
  window.audioEngine = new AudioEngine();
  window.renderEngine = new RenderEngine();
  window.rgbOverlay = new RGBOverlay();
  window.slideshowEngine = new SlideshowEngine();
  window.speedReader = new SpeedReader();
  window.windowManager = new WindowManager([
    'playlistPanel', 'controlsPanel', 'visualizerPanel',
    'overlayPanel', 'settingsPanel', 'slideshowPanel', 'speedreaderPanel'
  ]);
});
