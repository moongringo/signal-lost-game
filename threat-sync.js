// threat-sync.js — Cross-page threat radar synchronization
// Uses BroadcastChannel API to sync AI threats across all Signal Lost pages
// Drop on every page: <script src="./threat-sync.js?v=1"></script>

(function() {
  'use strict';

  // Prevent double-init
  if (window._threatSync) return;
  window._threatSync = true;

  const CHANNEL_NAME = 'signal-lost-threats';
  let bc = null;
  let threatManager = null;
  let localMap = null;
  let isMobile = false;

  // ============ DETECT PAGE & MAP ============
  function detectPage() {
    const path = window.location.pathname;
    if (path.includes('mobile')) { isMobile = true; return 'mobile'; }
    if (path.includes('control')) return 'control';
    if (path.includes('leaderboard')) return 'leaderboard';
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('roles')) return 'roles';
    return 'index';
  }

  function findExistingMap() {
    // Check for global map variables that pages create
    if (typeof setupMap !== 'undefined' && setupMap) return setupMap;
    if (typeof controlMap !== 'undefined' && controlMap) return controlMap;
    if (typeof lbMap !== 'undefined' && lbMap) return lbMap;
    if (typeof leaderboardMap !== 'undefined' && leaderboardMap) return leaderboardMap;
    if (typeof maps !== 'undefined' && maps.mc) return maps.mc;
    
    // Check for DOM elements
    const mapIds = ['setupMap', 'controlMap', 'leaderboardMap', 'mcMap', 'map'];
    for (const id of mapIds) {
      const el = document.getElementById(id);
      if (el) {
        // Check if Leaflet already initialized this element
        if (el._leaflet_id) {
          // Find the map instance
          for (const key in window) {
            const val = window[key];
            if (val && typeof val.getContainer === 'function' && val.getContainer() === el) {
              return val;
            }
          }
        }
      }
    }
    return null;
  }

  // ============ INIT BROADCAST CHANNEL ============
  function initChannel() {
    try {
      bc = new BroadcastChannel(CHANNEL_NAME);
      bc.onmessage = handleMessage;
      console.log('[ThreatSync] Connected to', CHANNEL_NAME);
    } catch (e) {
      console.warn('[ThreatSync] BroadcastChannel not supported:', e);
    }
  }

  // ============ INIT THREAT MANAGER ============
  function initThreatManager() {
    if (!window.AIThreats || !window.AIThreats.AIThreatManager) {
      setTimeout(initThreatManager, 500);
      return;
    }

    const page = detectPage();
    
    // Try to find existing map
    localMap = findExistingMap();
    
    if (!localMap) {
      // Map not ready yet, retry
      setTimeout(initThreatManager, 500);
      return;
    }

    // Create threat manager for this page's map
    threatManager = new window.AIThreats.AIThreatManager(localMap);
    window._syncThreatManager = threatManager;
    
    console.log('[ThreatSync] ThreatManager ready on', page, 'map');

    // If mobile page, wrap spawn functions to broadcast
    if (isMobile) {
      wrapMobileSpawns();
    }
  }

  // ============ BROADCAST HELPERS ============
  function broadcast(type, data) {
    if (!bc) return;
    bc.postMessage({
      type: 'spawn',
      threatType: type,
      data: data,
      timestamp: Date.now(),
      page: detectPage()
    });
  }

  function broadcastClear() {
    if (!bc) return;
    bc.postMessage({ type: 'clear', timestamp: Date.now(), page: detectPage() });
  }

  // ============ WRAP MOBILE SPAWNS ============
  function wrapMobileSpawns() {
    // Use property interceptor to catch when window.threatManager is assigned
    let _rawTM = window.threatManager;
    Object.defineProperty(window, 'threatManager', {
      get() { return _rawTM; },
      set(val) {
        _rawTM = val;
        if (val && typeof val === 'object') {
          wrapThreatManager(val);
        }
      },
      configurable: true
    });
    // If already set, wrap immediately
    if (_rawTM && typeof _rawTM === 'object') {
      wrapThreatManager(_rawTM);
    }
  }

  function wrapThreatManager(tm) {
    if (tm._syncWrapped) return;
    tm._syncWrapped = true;
    
    const origSpawnDrone = tm.spawnDrone.bind(tm);
    const origSpawnSniper = tm.spawnSniper.bind(tm);
    const origSpawnGas = tm.spawnGas ? tm.spawnGas.bind(tm) : null;
    const origSpawnEMP = tm.spawnEMP ? tm.spawnEMP.bind(tm) : null;
    const origClearAll = tm.clearAll.bind(tm);
    
    tm.spawnDrone = function(path) {
      const result = origSpawnDrone(path);
      broadcast('drone', { path: path });
      return result;
    };
    
    tm.spawnSniper = function(pos) {
      const result = origSpawnSniper(pos);
      broadcast('sniper', { position: pos });
      return result;
    };
    
    if (origSpawnGas) {
      tm.spawnGas = function(pos, radius, duration) {
        const result = origSpawnGas(pos, radius, duration);
        broadcast('gas', { position: pos, radius, duration });
        return result;
      };
    }
    
    if (origSpawnEMP) {
      tm.spawnEMP = function(pos, radius, duration) {
        const result = origSpawnEMP(pos, radius, duration);
        broadcast('emp', { position: pos, radius, duration });
        return result;
      };
    }
    
    // Wrap traps
    if (tm.traps && tm.traps.placeMine) {
      const origPlaceMine = tm.traps.placeMine.bind(tm.traps);
      tm.traps.placeMine = function(pos, team) {
        const result = origPlaceMine(pos, team);
        broadcast('mine', { position: pos, team });
        return result;
      };
    }
    
    // Wrap loot
    if (tm.loot && tm.loot.spawnDrop) {
      const origSpawnDrop = tm.loot.spawnDrop.bind(tm.loot);
      tm.loot.spawnDrop = function(pos, items) {
        const result = origSpawnDrop(pos, items);
        broadcast('loot', { position: pos, items });
        return result;
      };
    }
    
    // Wrap clear
    tm.clearAll = function() {
      const result = origClearAll();
      broadcastClear();
      return result;
    };
    
    console.log('[ThreatSync] Mobile spawn functions wrapped for broadcast');
  }

  // ============ HANDLE INCOMING MESSAGES ============
  function handleMessage(event) {
    const msg = event.data;
    if (!msg || !threatManager) return;
    
    // Don't re-broadcast our own messages
    if (msg.page === detectPage()) return;

    switch (msg.type) {
      case 'spawn':
        handleSpawn(msg.threatType, msg.data);
        break;
      case 'clear':
        threatManager.clearAll();
        console.log('[ThreatSync] All threats cleared from', msg.page);
        break;
    }
  }

  function handleSpawn(type, data) {
    if (!data || !localMap) return;
    
    const center = localMap.getCenter();
    const pos = data.position || data.path?.[0] || [center.lat, center.lng];
    
    switch (type) {
      case 'drone':
        if (data.path) {
          threatManager.spawnDrone(data.path);
        } else {
          threatManager.spawnDrone([
            [pos[0]+0.0002, pos[1]+0.0002],
            [pos[0]+0.0002, pos[1]-0.0002],
            [pos[0]-0.0002, pos[1]-0.0002],
            [pos[0]-0.0002, pos[1]+0.0002]
          ]);
        }
        console.log('[ThreatSync] Drone spawned from remote');
        break;
        
      case 'sniper':
        threatManager.spawnSniper(pos);
        console.log('[ThreatSync] Sniper spawned from remote');
        break;
        
      case 'mine':
        threatManager.traps.placeMine(pos, data.team || 'bravo');
        console.log('[ThreatSync] Mine placed from remote');
        break;
        
      case 'gas':
        threatManager.spawnGas(pos, data.radius || 50, data.duration || 300);
        console.log('[ThreatSync] Gas zone from remote');
        break;
        
      case 'emp':
        threatManager.spawnEMP(pos, data.radius || 100, data.duration || 60);
        console.log('[ThreatSync] EMP field from remote');
        break;
        
      case 'loot':
        threatManager.loot.spawnDrop(pos, data.items || ['Medkit']);
        console.log('[ThreatSync] Loot drop from remote');
        break;
    }
  }

  // ============ START ============
  initChannel();
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initThreatManager, 1000));
  } else {
    setTimeout(initThreatManager, 1000);
  }

})();
