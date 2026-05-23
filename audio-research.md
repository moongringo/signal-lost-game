# Audio Research: Web Audio API Sound Design for Signal Lost v2

**Goal:** Oscillator-based procedural audio (zero external files) extending the existing `SoundFX` class.

**Current SoundFX** (game-v2.js:2857): `init()`, `play(freq, duration, type, vol)`, plus named methods. Single `OscillatorNode` + `GainNode` per call. Missing: LFO, noise, stereo panning, frequency sweeps, buffer pooling.

---

## 1. AudioContext Lifecycle

```js
// Add to SoundFX
resume() {
  if (!this.ctx) return;
  if (this.ctx.state === 'suspended') {
    this.ctx.resume().catch(() => {});
  }
}

// Call on first user gesture:
document.addEventListener('click', () => { SoundFX.init(); SoundFX.resume(); }, { once: true });
```

- Browser autoplay policy: AudioContext created on user gesture, always call `resume()`
- `ctx.state` transitions: `suspended` → `running` after resume
- Dev: `chrome://flags/#autoplay-policy` → "No user gesture required"

---

## 2. Stereo Panning for Directional Audio

```js
playDirectional(freq, duration, type, vol, pan) {
  // pan: -1 (left) to +1 (right)
  if (!this.ctx) return;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  const panner = this.ctx.createStereoPanner();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
  gain.gain.setValueAtTime(vol, this.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
  panner.pan.setValueAtTime(pan, this.ctx.currentTime);
  osc.connect(panner).connect(gain).connect(this.ctx.destination);
  osc.start();
  osc.stop(this.ctx.currentTime + duration);
}

// World position → stereo pan
function worldToPan(myX, myY, targetX, targetY) {
  return Math.max(-1, Math.min(1, (targetX - myX) / 200));
}
```

Usage: threat pings panned toward enemy bearing, drone whine panned toward minimap position.

---

## 3. Sound Recipes

### Ambient Drone (LFO-Modulated Oscillator)

```js
startDrone(freq = 80, lfoFreq = 0.5, lfoDepth = 10, vol = 0.04) {
  if (!this.ctx) return null;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  const lfo = this.ctx.createOscillator();
  const lfoGain = this.ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(lfoFreq, this.ctx.currentTime);
  lfoGain.gain.setValueAtTime(lfoDepth, this.ctx.currentTime);

  lfo.connect(lfoGain).connect(osc.frequency);
  osc.connect(gain);
  gain.gain.setValueAtTime(vol, this.ctx.currentTime);
  gain.connect(this.ctx.destination);
  osc.start();
  lfo.start();

  return { osc, lfo, gain, stop: () => {
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.stop(this.ctx.currentTime + 0.5);
    lfo.stop(this.ctx.currentTime + 0.5);
  }};
}
```

**Drone variants:**
- Extraction hum: 80Hz, LFO 0.3Hz/Hz depth 15, sawtooth
- Decoder data stream: 120Hz, LFO 4Hz depth 30, square
- Medic aura: 100Hz, LFO 1.5Hz depth 8, triangle
- Night ambient: 55Hz, LFO 0.15Hz depth 20, sawtooth

### Ping Sound (Frequency Sweep)

```js
playPing(startFreq = 1200, endFreq = 400, duration = 0.3, vol = 0.08) {
  if (!this.ctx) return;
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
  gain.gain.setValueAtTime(vol, this.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
  osc.connect(gain).connect(this.ctx.destination);
  osc.start();
  osc.stop(this.ctx.currentTime + duration);
}
```

**Ping variants:**
- Courier objective found: 1500→500Hz, 0.25s
- Drone scout ping: 2000→800Hz, 0.3s, triangle
- Threat ping: 800→200Hz, 0.4s, sawtooth, panned toward threat
- Beacon ping: 1000→600Hz, 0.15s, repeated 3x with 0.2s gaps

```js
playBeaconPing(times = 3) {
  let count = 0;
  const pulse = () => {
    if (count >= times) return;
    SoundFX.playPing(1000, 600, 0.15, 0.08);
    count++;
    setTimeout(pulse, 200);
  };
  pulse();
}
```

### UI Clicks (Noise Burst)

```js
playClick(duration = 0.04, vol = 0.06) {
  if (!this.ctx) return;
  const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length); // linear decay
  }
  const src = this.ctx.createBufferSource();
  const gain = this.ctx.createGain();
  src.buffer = buf;
  gain.gain.setValueAtTime(vol, this.ctx.currentTime);
  src.connect(gain).connect(this.ctx.destination);
  src.start();
}

// Filtered variant (smoother, "knob" feel)
playFilteredClick() {
  if (!this.ctx) return;
  const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = this.ctx.createBufferSource();
  const gain = this.ctx.createGain();
  const filter = this.ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
  filter.Q.setValueAtTime(1, this.ctx.currentTime);
  src.buffer = buf;
  gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
  src.connect(filter).connect(gain).connect(this.ctx.destination);
  src.start();
}
```

**Click variants:** button press (raw, 0.03s), toggle on (filtered 2500Hz), toggle off (filtered 1500Hz), error buzz (filtered 800Hz).

### Ability SFX (Modulated Noise + Tone)

```js
playAbilitySFX(type = 'hack') {
  if (!this.ctx) return;
  const now = this.ctx.currentTime;

  // Noise layer (windowed)
  const nl = this.ctx.sampleRate * 0.3;
  const nb = this.ctx.createBuffer(1, nl, this.ctx.sampleRate);
  const nd = nb.getChannelData(0);
  for (let i = 0; i < nl; i++) nd[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / nl);
  const ns = this.ctx.createBufferSource();
  const ng = this.ctx.createGain();
  ns.buffer = nb;
  ng.gain.setValueAtTime(0.08, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  ns.connect(ng).connect(this.ctx.destination);
  ns.start();

  // Tonal layer
  const osc = this.ctx.createOscillator();
  const og = this.ctx.createGain();
  const configs = {
    hack:    { type: 'sawtooth', f: (n) => 200 + n * 2000 },    // Decoder — ascending
    heal:    { type: 'triangle', f: (n) => 400 + n * 1250 },    // Medic — soft rise
    boost:   { type: 'square',   f: (n) => 600 + n * 4000 },    // Courier — sharp burst
    scout:   { type: 'sine',     f: (n) => 1000 + n * 5000 },   // Drone — high whine
    repair:  { type: 'sawtooth', f: (n) => 100 + n * 500 },     // Mechanic — low growl
  };
  const cfg = configs[type] || configs.hack;
  osc.type = cfg.type;
  osc.frequency.setValueAtTime(cfg.f(0), now);
  osc.frequency.exponentialRampToValueAtTime(cfg.f(1), now + 0.3);
  og.gain.setValueAtTime(0.06, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.connect(og).connect(this.ctx.destination);
  osc.start();
  osc.stop(now + 0.4);
}
```

---

## 4. Audio Buffer Pool (GC-Free Playback)

Avoid allocating `AudioBuffer` on every noise burst — pre-allocate and recycle:

```js
// Add to SoundFX
bufferPool: {},

initPool() {
  if (!this.ctx || this._poolInited) return;
  this._poolInited = true;
  this.bufferPool.click  = this._makeNoise(this.ctx.sampleRate * 0.04);
  this.bufferPool.static = this._makeNoise(this.ctx.sampleRate * 0.3);
  this.bufferPool.pop    = this._makeNoise(this.ctx.sampleRate * 0.02);
},

_makeNoise(samples) {
  const buf = this.ctx.createBuffer(1, samples, this.ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < samples; i++) {
    const env = Math.min(1, i / (samples * 0.1), (samples - i) / (samples * 0.1));
    d[i] = (Math.random() * 2 - 1) * env;
  }
  return buf;
},

playFromPool(name, vol = 0.05) {
  if (!this.ctx || !this.bufferPool[name]) return;
  const src = this.ctx.createBufferSource();
  const gain = this.ctx.createGain();
  src.buffer = this.bufferPool[name];
  gain.gain.setValueAtTime(vol, this.ctx.currentTime);
  src.connect(gain).connect(this.ctx.destination);
  src.start();
}
```

`createBufferSource()` is lightweight (tiny object, short-lived). Heavy `AudioBuffer` allocated once. Call `initPool()` after `SoundFX.init()`.

---

## 5. Integration Recipe

```js
// Game init (first click)
document.addEventListener('click', () => {
  SoundFX.init();
  SoundFX.initPool();
  SoundFX.resume();
}, { once: true });

// Game events
function onBeaconFound(x, y, px, py) {
  SoundFX.playPing(1200, 400, 0.3, 0.08);
  SoundFX.playDirectional(1200, 0.3, 'sine', 0.08, worldToPan(px, py, x, y));
}

function onHackProgress(pct) {
  SoundFX.play(400 + pct * 800, 0.05, 'square', 0.04); // escalating beeps
}

function onDamage()     { SoundFX.playFromPool('static', 0.1); }
function onUIClick()    { SoundFX.playFromPool('click', 0.04); }
function onAbilityCast() { SoundFX.playAbilitySFX('hack'); }

// Ambient per state
const drones = {};
function setAmbient(type) {
  Object.values(drones).forEach(d => d?.stop());
  if (type === 'extraction') drones.x = SoundFX.startDrone(80, 0.3, 15, 0.03);
  if (type === 'decoder')    drones.x = SoundFX.startDrone(120, 4, 30, 0.02);
}
```

---

## 6. Quick Reference: SoundFX Extensions

| Method | Purpose | Creates |
|--------|---------|---------|
| `resume()` | Handle AudioContext suspension | — |
| `playDirectional(f,d,t,v,p)` | Panned tone | osc + gain + panner |
| `startDrone(f,lfoF,lfoD,v)` | LFO-modulated ambient | osc + gain + lfo + lfoGain → stop handle |
| `playPing(sF,eF,d,v)` | Frequency sweep | osc + gain |
| `playClick(d,v)` | Noise burst | noise buffer + source + gain |
| `playFilteredClick()` | Bandpass noise | noise + filter + gain |
| `playAbilitySFX(t)` | Role-specific SFX | noise + osc, per-role config |
| `initPool()` | Pre-allocate 3 AudioBuffers | click/pop/static buffers |
| `playFromPool(n,v)` | GC-free noise playback | source + gain |

**Init flow:** page load → first click → `init()` (AudioContext) → `initPool()` (3 AudioBuffers) → `resume()` (handle suspend) → ready.

**Edge case — too many concurrent oscillators:** Browsers limit total AudioContext nodes (~300 Chrome). Keep durations < 1s, use pool for UI sounds, avoid >20 drones simultaneously. Tiny source nodes from pool are GC'd naturally.
