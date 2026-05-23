// shared-game-hud.js — Auto-initializes Signal Lost game features on any page
// Drop this script anywhere: <script src="./shared-game-hud.js?v=1"></script>

(function() {
  'use strict';

  // Prevent double-init
  if (window._signalLostHUD) return;
  window._signalLostHUD = true;

  // ============ CONFIG ============
  const CONFIG = {
    mapId: 'sharedMap',
    mapCenter: [59.9139, 10.7522],
    mapZoom: 15,
    vitalsUpdateMs: 500,
    chatMaxLines: 100
  };

  // ============ STATE ============
  let player = null;
  let squad = null;
  let match = null;
  let threatManager = null;
  let maps = {};
  let chatLog = [];
  let vitalsInterval = null;

  // ============ INIT ============
  function init() {
    if (!window.GameEngine) {
      console.warn('[SignalLostHUD] GameEngine not loaded yet, retrying...');
      setTimeout(init, 500);
      return;
    }
    if (!window.AIThreats) {
      console.warn('[SignalLostHUD] AIThreats not loaded yet, retrying...');
      setTimeout(init, 500);
      return;
    }

    initGameEngine();
    injectHUD();
    initMap();
    initEventListeners();
    startVitalsLoop();
    
    console.log('[SignalLostHUD] Initialized on', document.title);
  }

  // ============ GAME ENGINE ============
  function initGameEngine() {
    player = new GameEngine.Player('p1', 'Alpha-1', 'navigator', 'alpha');
    player.inventory = {
      medkits: 3, ammo: 120, empGrenades: 2, decoys: 1,
      gasMask: 1, hasReconDrone: true, smokeGrenades: 2
    };
    
    squad = new GameEngine.Squad('alpha', 'Alpha Squad', 'alpha');
    squad.addPlayer(player);
    
    match = new GameEngine.Match('m1', 'Operation Signal Lost', 30);
    match.addSquad(squad);
    match.status = 'active';
    
    window._slPlayer = player;
    window._slSquad = squad;
    window._slMatch = match;
    window._slThreatManager = threatManager;
  }

  // ============ HUD INJECTION ============
  function injectHUD() {
    const hud = document.createElement('div');
    hud.id = 'sl-game-hud';
    hud.innerHTML = `
      <style>
        #sl-game-hud { position: fixed; top: 12px; right: 12px; z-index: 9999; 
          font-family: 'Inter', system-ui, sans-serif; font-size: 0.8rem; }
        .sl-hud-panel { background: rgba(14,25,37,0.92); border: 2px solid var(--gold, #ffb84d); 
          border-radius: 14px; padding: 10px 14px; margin-bottom: 8px; 
          box-shadow: 0 8px 32px rgba(0,0,0,0.3); color: #fff; min-width: 220px; }
        .sl-hud-panel h4 { margin: 0 0 8px; font-size: 0.75rem; text-transform: uppercase; 
          letter-spacing: 0.08em; color: var(--gold, #ffb84d); }
        .sl-vital-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; }
        .sl-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.15); 
          border-radius: 3px; overflow: hidden; }
        .sl-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
        .sl-bar-fill.health { background: linear-gradient(90deg, #00e676, #00c853); }
        .sl-bar-fill.health.warn { background: linear-gradient(90deg, #ffeb3b, #ff9800); }
        .sl-bar-fill.health.danger { background: linear-gradient(90deg, #ff5252, #df1f2d); }
        .sl-bar-fill.stamina { background: linear-gradient(90deg, #00a9c7, #0288d1); }
        .sl-pill { background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 999px; 
          font-size: 0.7rem; font-weight: 700; min-width: 28px; text-align: center; }
        .sl-status { display: inline-block; padding: 2px 10px; border-radius: 999px; 
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .sl-status.healthy { background: #00e676; color: #000; }
        .sl-status.injured { background: #ffeb3b; color: #000; }
        .sl-status.downed { background: #ff5252; color: #fff; animation: sl-pulse 1s infinite; }
        .sl-status.dead { background: #333; color: #999; }
        @keyframes sl-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .sl-score-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
        .sl-score { font-size: 1.1rem; font-weight: 700; color: var(--gold, #ffb84d); }
        .sl-timer { font-family: monospace; font-size: 1rem; color: #fff; }
        .sl-threats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: 6px; }
        .sl-threats button { padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); 
          background: rgba(255,255,255,0.08); color: #fff; font-size: 0.7rem; cursor: pointer; 
          transition: all 0.15s; }
        .sl-threats button:hover { background: rgba(255,255,255,0.2); transform: translateY(-1px); }
        .sl-threats button.danger { border-color: #ff5252; color: #ff5252; }
        .sl-threats button.danger:hover { background: rgba(255,82,82,0.2); }
        .sl-chat { max-height: 120px; overflow-y: auto; font-size: 0.7rem; }
        .sl-chat .msg { padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sl-chat .msg.me { color: #00a9c7; }
        .sl-chat .msg.them { color: #ffeb3b; }
        .sl-chat .msg.sys { color: #888; }
        .sl-chat-input { display: flex; gap: 4px; margin-top: 4px; }
        .sl-chat-input input { flex: 1; padding: 4px 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); 
          background: rgba(0,0,0,0.3); color: #fff; font-size: 0.7rem; }
        .sl-chat-input button { padding: 4px 10px; border-radius: 8px; border: none; 
          background: var(--accent, #00a9c7); color: #fff; font-size: 0.7rem; cursor: pointer; }
        .sl-inventory { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 6px; }
        .sl-inv-item { text-align: center; padding: 4px; border-radius: 8px; 
          background: rgba(0,0,0,0.2); font-size: 0.65rem; }
        .sl-inv-item .count { font-size: 0.9rem; font-weight: 700; display: block; }
        .sl-toggle { position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; 
          border-radius: 50%; background: var(--pink, #ff5252); color: #fff; border: none; 
          cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; }
        .sl-hud-collapsed .sl-hud-panel { display: none; }
        .sl-hud-collapsed .sl-hud-panel:first-child { display: block; }
      </style>
      
      <button class="sl-toggle" onclick="this.parentElement.classList.toggle('sl-hud-collapsed')" title="Toggle HUD">🔻</button>
      
      <div class="sl-hud-panel">
        <h4>⚡ Signal Lost — Live</h4>
        <div class="sl-vital-row">
          <span style="width:40px">HP</span>
          <div class="sl-bar"><div class="sl-bar-fill health" id="sl-hp-bar" style="width:100%"></div></div>
          <span class="sl-pill" id="sl-hp-text">100</span>
        </div>
        <div class="sl-vital-row">
          <span style="width:40px">STA</span>
          <div class="sl-bar"><div class="sl-bar-fill stamina" id="sl-sta-bar" style="width:100%"></div></div>
          <span class="sl-pill" id="sl-sta-text">100</span>
        </div>
        <div class="sl-score-row">
          <span class="sl-status healthy" id="sl-status">HEALTHY</span>
          <span class="sl-score" id="sl-score">0 pts</span>
          <span class="sl-timer" id="sl-timer">30:00</span>
        </div>
      </div>
      
      <div class="sl-hud-panel">
        <h4>🎒 Inventory</h4>
        <div class="sl-inventory" id="sl-inventory">
          <div class="sl-inv-item"><span class="count" id="sl-inv-med">3</span>Medkits</div>
          <div class="sl-inv-item"><span class="count" id="sl-inv-ammo">120</span>Ammo</div>
          <div class="sl-inv-item"><span class="count" id="sl-inv-emp">2</span>EMP</div>
          <div class="sl-inv-item"><span class="count" id="sl-inv-dec">1</span>Decoys</div>
          <div class="sl-inv-item"><span class="count" id="sl-inv-smoke">2</span>Smoke</div>
          <div class="sl-inv-item"><span class="count" id="sl-inv-mask">1</span>Mask</div>
        </div>
      </div>
      
      <div class="sl-hud-panel">
        <h4>🎯 Threat Control</h4>
        <div class="sl-threats">
          <button onclick="_slSpawn('drone')">🛸 Drone</button>
          <button onclick="_slSpawn('sniper')">🔴 Sniper</button>
          <button onclick="_slSpawn('mine')">💣 Mine</button>
          <button onclick="_slSpawn('gas')">☠️ Gas</button>
          <button onclick="_slSpawn('emp')">⚡ EMP</button>
          <button onclick="_slSpawn('loot')">🎒 Loot</button>
          <button class="danger" onclick="_slSimHit()">💥 Hit -35</button>
          <button class="danger" onclick="_slClearAll()">🧹 Clear</button>
        </div>
      </div>
      
      <div class="sl-hud-panel">
        <h4>💬 Squad Chat</h4>
        <div class="sl-chat" id="sl-chat"></div>
        <div class="sl-chat-input">
          <input type="text" id="sl-chat-input" placeholder="Message squad..." onkeydown="if(event.key==='Enter')_slSendChat()">
          <button onclick="_slSendChat()">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(hud);
  }

  // ============ MAP ============
  function initMap() {
    // Look for existing map or create one
    let mapContainer = document.getElementById(CONFIG.mapId);
    if (!mapContainer) {
      // Create map panel in HUD
      const mapPanel = document.createElement('div');
      mapPanel.className = 'sl-hud-panel';
      mapPanel.innerHTML = `<h4>🗺️ Threat Map</h4><div id="${CONFIG.mapId}" style="height:180px;border-radius:10px;overflow:hidden;"></div>`;
      document.getElementById('sl-game-hud').appendChild(mapPanel);
      mapContainer = document.getElementById(CONFIG.mapId);
    }
    
    if (typeof L !== 'undefined' && mapContainer) {
      maps.shared = L.map(CONFIG.mapId, { zoomControl: false }).setView(CONFIG.mapCenter, CONFIG.mapZoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(maps.shared);
      
      threatManager = new window.AIThreats.AIThreatManager(maps.shared);
      window._slThreatManager = threatManager;
    }
  }

  // ============ EVENT LISTENERS ============
  function initEventListeners() {
    document.addEventListener('droneAlert', (e) => {
      if (player && player.status !== 'dead') {
        const dist = GameEngine.calculateDistance(
          player.position || CONFIG.mapCenter, e.detail.position
        );
        if (dist < 100) {
          player.takeDamage(15, { type: 'drone' });
          _slLog('💥 Drone gunfire! -15 HP', 'them');
        }
      }
    });
    
    document.addEventListener('mineTriggered', (e) => {
      if (player && player.status !== 'dead') {
        const dist = GameEngine.calculateDistance(
          player.position || CONFIG.mapCenter, e.detail.position
        );
        if (dist < 30) {
          player.takeDamage(60, { type: 'mine' });
          _slLog('💥 MINE BLAST! -60 HP', 'them');
        }
      }
    });
    
    document.addEventListener('gasTick', (e) => {
      if (player && player.status !== 'dead') {
        const dist = GameEngine.calculateDistance(
          player.position || CONFIG.mapCenter, e.detail.position
        );
        if (dist < e.detail.radius && !player.inventory.hasGasMask) {
          player.takeDamage(e.detail.damage || 5, { type: 'gas' });
          _slLog('☠️ Gas! -' + (e.detail.damage || 5) + ' HP', 'them');
        }
      }
    });
    
    document.addEventListener('empPulse', (e) => {
      if (player && player.status !== 'dead') {
        const dist = GameEngine.calculateDistance(
          player.position || CONFIG.mapCenter, e.detail.position
        );
        if (dist < e.detail.radius) {
          _slLog('⚡ EMP FIELD — abilities disabled 10s', 'them');
          player._empDisabled = true;
          setTimeout(() => { player._empDisabled = false; }, 10000);
        }
      }
    });
  }

  // ============ VITALS LOOP ============
  function startVitalsLoop() {
    if (vitalsInterval) clearInterval(vitalsInterval);
    vitalsInterval = setInterval(() => {
      if (!player) return;
      
      const hpPct = Math.max(0, player.health);
      const staPct = Math.max(0, player.stamina);
      const hpBar = document.getElementById('sl-hp-bar');
      const hpText = document.getElementById('sl-hp-text');
      const staBar = document.getElementById('sl-sta-bar');
      const staText = document.getElementById('sl-sta-text');
      const statusEl = document.getElementById('sl-status');
      const scoreEl = document.getElementById('sl-score');
      const timerEl = document.getElementById('sl-timer');
      
      if (hpBar) { hpBar.style.width = hpPct + '%'; hpBar.className = 'sl-bar-fill health' + (hpPct < 30 ? ' danger' : hpPct < 60 ? ' warn' : ''); }
      if (hpText) hpText.textContent = Math.round(hpPct);
      if (staBar) staBar.style.width = staPct + '%';
      if (staText) staText.textContent = Math.round(staPct);
      if (statusEl) {
        statusEl.textContent = (player.status || 'healthy').toUpperCase();
        statusEl.className = 'sl-status ' + (player.status || 'healthy');
      }
      if (scoreEl) scoreEl.textContent = (squad ? squad.score : 0) + ' pts';
      if (timerEl && match) {
        let remaining = 1800;
        if (match.startTime) {
          remaining = Math.max(0, match.duration * 60 - (Date.now() - match.startTime) / 1000);
        }
        const mins = Math.floor(remaining / 60);
        const secs = Math.floor(remaining % 60);
        timerEl.textContent = mins + ':' + String(secs).padStart(2, '0');
      }
      
      // Inventory
      if (player.inventory) {
        const inv = player.inventory;
        const setInv = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setInv('sl-inv-med', inv.medkits || 0);
        setInv('sl-inv-ammo', inv.ammo || 0);
        setInv('sl-inv-emp', inv.empGrenades || 0);
        setInv('sl-inv-dec', inv.decoys || 0);
        setInv('sl-inv-smoke', inv.smokeGrenades || 0);
        setInv('sl-inv-mask', inv.hasGasMask ? 1 : 0);
      }
    }, CONFIG.vitalsUpdateMs);
  }

  // ============ CHAT ============
  window._slLog = function(msg, type='sys') {
    chatLog.push({ msg, type, time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) });
    if (chatLog.length > CONFIG.chatMaxLines) chatLog.shift();
    
    const chatEl = document.getElementById('sl-chat');
    if (chatEl) {
      chatEl.innerHTML = chatLog.map(m => `<div class="msg ${m.type}">${m.time} · ${m.msg}</div>`).join('');
      chatEl.scrollTop = chatEl.scrollHeight;
    }
  };

  window._slSendChat = function() {
    const input = document.getElementById('sl-chat-input');
    if (!input || !input.value.trim()) return;
    _slLog(input.value.trim(), 'me');
    input.value = '';
  };

  // ============ THREAT SPAWNING ============
  window._slSpawn = function(type) {
    if (!threatManager || !maps.shared) {
      _slLog('❌ Map not ready', 'sys');
      return;
    }
    const center = maps.shared.getCenter();
    
    switch(type) {
      case 'drone':
        threatManager.spawnDrone([
          [center.lat+0.0002, center.lng+0.0002],
          [center.lat+0.0002, center.lng-0.0002],
          [center.lat-0.0002, center.lng-0.0002],
          [center.lat-0.0002, center.lng+0.0002]
        ]);
        _slLog('🛸 Patrol drone deployed', 'sys');
        break;
      case 'sniper':
        threatManager.spawnSniper([center.lat-0.0003, center.lng-0.0003]);
        _slLog('🔴 Sniper nest deployed', 'sys');
        break;
      case 'mine':
        threatManager.traps.placeMine([center.lat+0.0002, center.lng+0.0002], 'bravo');
        _slLog('💣 Proximity mine placed', 'sys');
        break;
      case 'gas':
        threatManager.spawnGas(center, 50, 300);
        _slLog('☠️ Gas zone deployed', 'sys');
        break;
      case 'emp':
        threatManager.spawnEMP(center, 100, 60);
        _slLog('⚡ EMP field active', 'sys');
        break;
      case 'loot':
        threatManager.loot.spawnDrop([center.lat+0.0002, center.lng-0.0002], ['Medkit', 'Ammo']);
        _slLog('🎒 Supply drop incoming', 'sys');
        break;
    }
  };

  window._slSimHit = function() {
    if (!player) return;
    player.takeDamage(35, { type: 'gunshot' });
    _slLog('💥 Hit! -35 HP — HP: ' + Math.round(player.health), 'them');
  };

  window._slClearAll = function() {
    if (!threatManager) return;
    threatManager.clearAll();
    _slLog('🧹 All threats cleared', 'sys');
  };

  // ============ START ============
  // Wait for DOM + scripts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
  } else {
    setTimeout(init, 300);
  }

})();
