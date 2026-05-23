const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "mobile.html");
let html = fs.readFileSync(filePath, "utf8");

// Replace fake hijackDrone with real one
const oldHijack = `    function hijackDrone() {
      if (!player || !match) { logChat('🔴 No drone in range', 'me'); return; }
      logChat('🔴 Initiating drone hijack... 3s channel', 'me');
      
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% success rate
        if (success) {
          logChat('✅ DRONE HIJACKED — Now friendly patrol!', 'me');
          if (squad) squad.addScore(50, 'drone_hijacked');
          document.getElementById('hijackLog').innerHTML = '<span style="color: var(--success);">Last hijack: SUCCESS</span>';
        } else {
          logChat('❌ Hijack failed — Drone self-destructed', 'them');
          document.getElementById('hijackLog').innerHTML = '<span style="color: var(--pink);">Last hijack: FAILED</span>';
        }
      }, 3000);
    }`;

const newHijack = `    function hijackDrone() {
      if (!player || !match) { logChat('🔴 No drone in range', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — cannot hack', 'me'); return; }
      
      const pos = player.position || (maps.mc ? maps.mc.getCenter() : [59.9139, 10.7522]);
      const nearest = threatManager ? threatManager.findNearestDrone(pos, 50) : null;
      
      if (!nearest) {
        logChat('🔴 No drone within 50m — move closer', 'me');
        document.getElementById('hijackLog').innerHTML = '<span style="color: var(--pink);">No drone in range</span>';
        return;
      }
      
      logChat('🔴 Hijacking ' + nearest.drone.id + ' — ' + nearest.distance + 'm away — 3s channel...', 'me');
      document.getElementById('hijackLog').innerHTML = '<span style="color: var(--warning);">Channeling... 3s</span>';
      
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% success
        if (success) {
          threatManager.hijackDrone(nearest.drone.id);
          logChat('✅ ' + nearest.drone.id + ' HIJACKED — friendly patrol!', 'me');
          if (squad) squad.addScore(50, 'drone_hijacked');
          document.getElementById('hijackLog').innerHTML = '<span style="color: var(--success);">Last hijack: SUCCESS</span>';
        } else {
          logChat('❌ Hijack failed — ' + nearest.drone.id + ' self-destructed!', 'them');
          document.getElementById('hijackLog').innerHTML = '<span style="color: var(--pink);">Last hijack: FAILED</span>';
        }
      }, 3000);
    }`;

html = html.replace(oldHijack, newHijack);

// Replace fake disarmTrap with real one
const oldDisarm = `    function disarmTrap() {
      if (!player || !match) { logChat('🛡️ No traps detected nearby', 'me'); return; }
      logChat('🛡️ Scanning for traps...', 'me');
      
      setTimeout(() => {
        const found = Math.random() > 0.5;
        if (found) {
          logChat('✅ TRAP DISARMED — Mine neutralized', 'me');
          if (squad) squad.addScore(25, 'trap_disarmed');
          document.getElementById('disarmLog').innerHTML = '<span style="color: var(--success);">Last scan: TRAP FOUND & DISARMED</span>';
        } else {
          logChat('✅ Area clear — No traps detected', 'me');
          document.getElementById('disarmLog').innerHTML = '<span style="color: var(--muted);">Last scan: Area clear</span>';
        }
      }, 2000);
    }`;

const newDisarm = `    function disarmTrap() {
      if (!player || !match) { logChat('🛡️ No traps detected nearby', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — tools offline', 'me'); return; }
      
      const pos = player.position || (maps.mc ? maps.mc.getCenter() : [59.9139, 10.7522]);
      const nearest = threatManager && threatManager.traps ? threatManager.traps.findNearestMine(pos, 10) : null;
      
      if (!nearest) {
        logChat('🛡️ No armed mines within 10m', 'me');
        document.getElementById('disarmLog').innerHTML = '<span style="color: var(--muted);">No mines in range</span>';
        return;
      }
      
      logChat('🛡️ Disarming mine — ' + nearest.distance + 'm away...', 'me');
      
      setTimeout(() => {
        const success = threatManager.traps.disarmMine(pos, 'alpha');
        if (success) {
          logChat('✅ MINE DISARMED at ' + nearest.distance + 'm — +25 pts', 'me');
          if (squad) squad.addScore(25, 'trap_disarmed');
          document.getElementById('disarmLog').innerHTML = '<span style="color: var(--success);">DISARMED — +' + nearest.distance + 'm</span>';
        } else {
          logChat('❌ Disarm failed — mine already triggered?', 'them');
          document.getElementById('disarmLog').innerHTML = '<span style="color: var(--pink);">DISARM FAILED</span>';
        }
      }, 2000);
    }`;

html = html.replace(oldDisarm, newDisarm);

// Replace fake scoutMines with real one
const oldScout = `    function scoutMines() {
      if (!player || !match) { logChat('⚠️ Mine scan unavailable', 'me'); return; }
      logChat('⚠️ Scanning 50m radius for mines...', 'me');
      
      setTimeout(() => {
        const minesFound = Math.floor(Math.random() * 3); // 0-2 mines
        if (minesFound > 0) {
          logChat('🚨 ' + minesFound + ' MINE(S) DETECTED within 50m!', 'them');
          document.getElementById('scoutLog').innerHTML = '<span style="color: var(--pink);">ALERT: ' + minesFound + ' mine(s) detected!</span>';
        } else {
          logChat('✅ No mines detected in 50m radius', 'me');
          document.getElementById('scoutLog').innerHTML = '<span style="color: var(--success);">Scan complete: No mines</span>';
        }
      }, 1500);
    }`;

const newScout = `    function scoutMines() {
      if (!player || !match) { logChat('⚠️ Mine scan unavailable', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — scanner offline', 'me'); return; }
      
      const pos = player.position || (maps.mc ? maps.mc.getCenter() : [59.9139, 10.7522]);
      logChat('⚠️ Scanning 50m radius for mines...', 'me');
      
      setTimeout(() => {
        if (!threatManager || !threatManager.traps) {
          logChat('✅ No minefield data — area clear', 'me');
          document.getElementById('scoutLog').innerHTML = '<span style="color: var(--success);">Scan complete: No mines</span>';
          return;
        }
        
        const result = threatManager.traps.scanMines(pos, 50);
        if (result.count > 0) {
          const distances = result.mines.map(m => m.distance + 'm').join(', ');
          logChat('🚨 ' + result.count + ' MINE(S) DETECTED — ' + distances, 'them');
          document.getElementById('scoutLog').innerHTML = '<span style="color: var(--pink);">ALERT: ' + result.count + ' mine(s) at ' + distances + '</span>';
        } else {
          logChat('✅ No mines detected in 50m radius', 'me');
          document.getElementById('scoutLog').innerHTML = '<span style="color: var(--success);">Scan complete: No mines</span>';
        }
      }, 1500);
    }`;

html = html.replace(oldScout, newScout);

// Bump ai-threats cache-bust to force reload
html = html.replace('ai-threats.js?v=', 'ai-threats.js?v=');
// Find the current version and bump it
const cacheMatch = html.match(/ai-threats\.js\?v=(\d+)/);
if (cacheMatch) {
  const oldV = parseInt(cacheMatch[1]);
  const newV = oldV + 1;
  html = html.replace('ai-threats.js?v=' + oldV, 'ai-threats.js?v=' + newV);
  console.log('Bumped ai-threats.js cache-bust: v=' + oldV + ' -> v=' + newV);
}

fs.writeFileSync(filePath, html);
console.log('mobile.html updated with real role abilities');
