// =====================================================
// SIGNAL LOST — 1960s COLD WAR TERMINAL EFFECTS ENGINE
// CRT flicker, phosphor persistence, teletype animation
// =====================================================

class Terminal60s {
  constructor(options = {}) {
    this.config = {
      flickerIntensity: options.flickerIntensity || 0.03,
      scanlineOpacity: options.scanlineOpacity || 0.08,
      phosphorPersistence: options.phosphorPersistence || true,
      reducedMotion: options.reducedMotion || false,
      soundEnabled: options.soundEnabled || false
    };

    this.init();
  }

  init() {
    this.createCrtOverlay();
    this.createFilmGrain();
    this.initTeletypeElements();
    if (!this.config.reducedMotion) {
      this.initFlicker();
      this.initPhosphorPersistence();
    }
    this.initCursorBlink();
    this.initTypewriterSounds();
  }

  // ─── CRT Overlay ───
  createCrtOverlay() {
    if (document.querySelector('.crt-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'crt-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      background: repeating-linear-gradient(
        0deg,
        rgba(0,0,0,${this.config.scanlineOpacity}) 0px,
        rgba(0,0,0,${this.config.scanlineOpacity}) 1px,
        transparent 1px,
        transparent 2px
      );
      mix-blend-mode: multiply;
    `;
    document.body.appendChild(overlay);
  }

  // ─── Film Grain ───
  createFilmGrain() {
    if (document.querySelector('.film-grain')) return;
    
    const grain = document.createElement('div');
    grain.className = 'film-grain';
    grain.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9998;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      mix-blend-mode: overlay;
    `;
    document.body.appendChild(grain);
  }

  // ─── Screen Flicker ───
  initFlicker() {
    const flicker = () => {
      const intensity = Math.random() * this.config.flickerIntensity;
      document.body.style.filter = `brightness(${1 + intensity})`;
      
      // Random micro-flickers
      if (Math.random() > 0.97) {
        document.body.style.filter = `brightness(${0.95 + Math.random() * 0.1})`;
        setTimeout(() => {
          document.body.style.filter = 'brightness(1)';
        }, 50);
      }
    };

    setInterval(flicker, 2000 + Math.random() * 3000);
  }

  // ─── Phosphor Persistence (ghosting effect) ───
  initPhosphorPersistence() {
    const style = document.createElement('style');
    style.textContent = `
      .phosphor-persist {
        position: relative;
      }
      .phosphor-persist::after {
        content: attr(data-text);
        position: absolute;
        left: 1px;
        top: 0;
        color: rgba(51, 255, 51, 0.15);
        pointer-events: none;
        z-index: -1;
      }
    `;
    document.head.appendChild(style);

    // Apply to headers
    document.querySelectorAll('h1, h2, .phosphor-persist').forEach(el => {
      el.setAttribute('data-text', el.textContent);
      el.classList.add('phosphor-persist');
    });
  }

  // ─── Cursor Blink ───
  initCursorBlink() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes cursor-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .cursor-blink::after {
        content: "█";
        animation: cursor-blink 1.2s step-end infinite;
        margin-left: 2px;
        color: var(--p1, #33ff33);
      }
      .cursor-underscore::after {
        content: "_";
        animation: cursor-blink 1.2s step-end infinite;
        margin-left: 2px;
        color: var(--p1, #33ff33);
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Teletype Animation ───
  initTeletypeElements() {
    document.querySelectorAll('[data-teletype]').forEach(el => {
      const text = el.textContent;
      const speed = parseInt(el.dataset.teletype) || 30;
      el.textContent = '';
      el.classList.add('cursor-blink');
      
      let i = 0;
      const type = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        } else {
          el.classList.remove('cursor-blink');
          el.classList.add('cursor-underscore');
        }
      };
      
      // Start with delay
      setTimeout(type, 500 + Math.random() * 1000);
    });
  }

  // ─── Sound Effects (placeholder) ───
  initTypewriterSounds() {
    // Web Audio API beep for terminal sounds
    if (!this.config.soundEnabled) return;
    
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      console.log('Web Audio not supported');
    }
  }

  playBeep(frequency = 800, duration = 50) {
    if (!this.audioCtx || !this.config.soundEnabled) return;
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    
    osc.frequency.value = frequency;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration / 1000);
    
    osc.start(this.audioCtx.currentTime);
    osc.stop(this.audioCtx.currentTime + duration / 1000);
  }

  // ─── Boot Sequence ───
  static bootSequence(container, callback) {
    const lines = [
      'INITIALIZING TERMINAL...',
      'LOADING BIOS v2.1.4...',
      'MEMORY CHECK: 64KB OK',
      'VIDEO ADAPTER: P1 PHOSPHOR CRT',
      'KEYBOARD: TELETYPE MODEL 33',
      'NETWORK: ARPANET NODE 47',
      'LOADING SIGNAL_LOST.EXE...',
      'SECURE CONNECTION ESTABLISHED',
      'READY.'
    ];

    container.innerHTML = '';
    container.style.fontFamily = 'var(--font-mono)';
    container.style.color = 'var(--p1)';
    container.style.fontSize = 'var(--text-sm)';
    container.style.lineHeight = '1.8';

    let lineIndex = 0;
    
    const addLine = () => {
      if (lineIndex < lines.length) {
        const line = document.createElement('div');
        line.textContent = `> ${lines[lineIndex]}`;
        line.style.opacity = '0';
        container.appendChild(line);
        
        // Fade in
        requestAnimationFrame(() => {
          line.style.transition = 'opacity 0.1s';
          line.style.opacity = '1';
        });
        
        lineIndex++;
        setTimeout(addLine, 150 + Math.random() * 200);
      } else {
        // Blinking cursor at end
        const cursor = document.createElement('span');
        cursor.textContent = '█';
        cursor.style.animation = 'cursor-blink 1.2s step-end infinite';
        container.appendChild(cursor);
        
        if (callback) setTimeout(callback, 800);
      }
    };

    addLine();
  }

  // ─── NATO Phonetic Helper ───
  static natoPhonetic(text) {
    const phonetic = {
      'A': 'ALPHA', 'B': 'BRAVO', 'C': 'CHARLIE', 'D': 'DELTA',
      'E': 'ECHO', 'F': 'FOXTROT', 'G': 'GOLF', 'H': 'HOTEL',
      'I': 'INDIA', 'J': 'JULIETT', 'K': 'KILO', 'L': 'LIMA',
      'M': 'MIKE', 'N': 'NOVEMBER', 'O': 'OSCAR', 'P': 'PAPA',
      'Q': 'QUEBEC', 'R': 'ROMEO', 'S': 'SIERRA', 'T': 'TANGO',
      'U': 'UNIFORM', 'V': 'VICTOR', 'W': 'WHISKEY', 'X': 'X-RAY',
      'Y': 'YANKEE', 'Z': 'ZULU', '0': 'ZERO', '1': 'ONE',
      '2': 'TWO', '3': 'THREE', '4': 'FOUR', '5': 'FIVE',
      '6': 'SIX', '7': 'SEVEN', '8': 'EIGHT', '9': 'NINER'
    };
    
    return text.toUpperCase().split('').map(c => phonetic[c] || c).join(' ');
  }

  // ─── Morse Code Helper ───
  static morseCode(text) {
    const morse = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
      'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---',
      'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---',
      'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-',
      'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--',
      'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
      '4': '....-', '5': '.....', '6': '-....', '7': '--...',
      '8': '---..', '9': '----.', '0': '-----'
    };
    
    return text.toUpperCase().split('').map(c => morse[c] || c).join(' ');
  }

  // ─── Random Glitch Effect ───
  static glitchText(element, originalText, duration = 1000) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const iterations = 10;
    let current = 0;
    
    const interval = setInterval(() => {
      element.textContent = originalText
        .split('')
        .map((char, index) => {
          if (index < current) return originalText[index];
          if (char === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');
      
      if (current >= originalText.length) {
        clearInterval(interval);
        element.textContent = originalText;
      }
      
      current += 1 / iterations;
    }, duration / iterations);
  }

  // ─── Clock (1960s military time) ───
  static updateMilitaryClock(element) {
    const update = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      
      element.textContent = `${year}-${month}-${day}  ${hours}:${minutes}:${seconds} ZULU`;
    };
    
    update();
    return setInterval(update, 1000);
  }
}

// ─── Auto-initialize ───
document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.terminal = new Terminal60s({ reducedMotion });
});

// ─── Export ───
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Terminal60s;
}
