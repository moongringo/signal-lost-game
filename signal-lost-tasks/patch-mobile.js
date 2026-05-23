const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "mobile.html");
let html = fs.readFileSync(filePath, "utf8");

// 1. Cache-bust: v=3 → v=7
html = html.replace(/\?v=3/g, "?v=7");

// 2. Add bleedout timer div in vitals panel
html = html.replace(
  `<div id="statusBadge" style="margin-top: 8px; text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--success);">🟢 HEALTHY</div>\n    </div>`,
  `<div id="statusBadge" style="margin-top: 8px; text-align: center; font-weight: 700; font-size: 0.85rem; color: var(--success);">🟢 HEALTHY</div>\n      <div id="bleedoutTimer" style="display:none; margin-top:8px; text-align:center; font-weight:700; font-size:1rem; color:var(--pink); animation:pulse 1s infinite;">⏱️ BLEEDOUT: 120s</div>\n    </div>`
);

// 3. Replace old AI threat listeners section with clean consolidated version
const oldAI = `    // AI Threat damage integration
    document.addEventListener('droneAlert', (e) => {
      if (player && player.status === 'healthy') {
        const dist = calculateDistanceToDrone(e.detail.position);
        if (dist < 100) {
          player.takeDamage(15, { type: 'drone' });
          logChat('💥 Drone gunfire! Taking damage!', 'them');
          updateVitals();
        }
      }
    });
    
    document.addEventListener('mineTriggered', (e) => {
      if (player && player.status === 'healthy') {
        const dist = GameEngine.calculateDistance(player.position, e.detail.position);
        if (dist < 30) {
          const result = player.takeDamage(60, { type: 'mine' });
          logChat('💥 MINE BLAST! Health: ' + player.health, 'them');
          updateVitals();
        }
      }
    });
    
    function calculateDistanceToDrone(dronePos) {
      if (!player || !player.position) return Infinity;
      // Approximate: 1 degree lat ~= 111km
      const latDiff = Math.abs(player.position[0] - dronePos.lat);
      const lngDiff = Math.abs(player.position[1] - dronePos.lng);
      return Math.sqrt(latDiff*latDiff + lngDiff*lngDiff) * 111000;
    }
    function toggleMenu() {`;

const newAI = `    // AI Threat damage integration — consolidated, no duplicates
    function _distToThreat(pos) {
      const p = player && player.position ? player.position : (userPosition || [59.9139, 10.7522]);
      const t = pos.lat !== undefined ? [pos.lat, pos.lng] : pos;
      return GameEngine.calculateDistance(p, t);
    }

    document.addEventListener('droneAlert', (e) => {
      if (player && player.status !== 'dead') {
        const dist = _distToThreat(e.detail.position);
        if (dist < 100) {
          player.takeDamage(15, { type: 'drone' });
          logChat('💥 Drone gunfire! -15 HP', 'them');
          updateVitals();
        }
      }
      logChat('⚠️ Drone ' + e.detail.droneId + ' spotted movement!', 'them');
    });

    document.addEventListener('mineTriggered', (e) => {
      if (player && player.status !== 'dead') {
        const dist = _distToThreat(e.detail.position);
        if (dist < 30) {
          player.takeDamage(60, { type: 'mine' });
          logChat('💥 MINE BLAST! -60 HP', 'them');
          updateVitals();
        }
      }
      logChat('💥 MINE DETONATED — check casualties!', 'them');
    });

    document.addEventListener('gasTick', (e) => {
      if (player && player.status !== 'dead') {
        const dist = _distToThreat(e.detail.position);
        if (dist < (e.detail.radius || 80) && !player.inventory.hasGasMask) {
          const dmg = e.detail.damage || 5;
          player.takeDamage(dmg, { type: 'gas' });
          logChat('☠️ Gas exposure! -' + dmg + ' HP', 'them');
          updateVitals();
        }
      }
    });

    document.addEventListener('empPulse', (e) => {
      if (player && player.status !== 'dead') {
        const dist = _distToThreat(e.detail.position);
        if (dist < (e.detail.radius || 120)) {
          logChat('⚡ EMP FIELD — abilities disabled 10s!', 'them');
          player._empDisabled = true;
          setTimeout(() => { player._empDisabled = false; logChat('⚡ EMP effect faded', 'me'); }, 10000);
        }
      }
    });

    function toggleMenu() {`;

html = html.replace(oldAI, newAI);

// 4. Fix healSelf()
const oldHeal = `    function healSelf() {
      if (!player) return;
      if (player.inventory.medkits <= 0) {
        logChat('❌ No medkits remaining', 'me');
        return;
      }

      const amount = player.useItem('medkits');
      if (amount) {
        logChat('💊 Medkit used — Health: ' + Math.round(player.health) + '/100', 'me');
        updateVitals();
      }
    }`;

const newHeal = `    function healSelf() {
      if (!player) return;
      if (player.status === 'dead') { logChat('❌ You are dead', 'sys'); return; }
      if (player.inventory.medkits <= 0) { logChat('❌ No medkits remaining', 'me'); return; }
      player.inventory.medkits--;
      const healed = player.heal(50);
      logChat('💊 Medkit used — +' + healed + ' HP — Health: ' + Math.round(player.health) + '/100', 'me');
      updateVitals();
    }`;

html = html.replace(oldHeal, newHeal);

// 5. Fix updateVitals() with bleedout countdown
const oldVitals = `    function updateVitals() {
      if (!player) return;
      const hp = document.getElementById('healthBar');
      const st = document.getElementById('staminaBar');
      const status = document.getElementById('statusBadge');
      if (!hp || !st || !status) return;
      
      hp.style.width = player.health + '%';
      hp.className = 'bar-fill health-fill';
      if (player.health < 30) hp.classList.add('critical');
      else if (player.health < 60) hp.classList.add('low');
      
      if (st) st.style.width = player.stamina + '%';
      
      const statusBadge = document.getElementById('statusBadge');
      if (statusBadge) {
        const statusMap = {
          healthy: '🟢 HEALTHY',
          injured: '🟡 INJURED',
          downed: '🔴 DOWNED — BLEEDING OUT',
          dead: '⚫ KIA',
          extracted: '🏁 EXTRACTED'
        };
        statusBadge.textContent = statusMap[player.status] || player.status;
        statusBadge.style.color = player.status === 'healthy' ? 'var(--success)' : 
                                 player.status === 'downed' ? 'var(--pink)' : 'var(--warning)';
      }
      
      updateInventoryDisplay();
      updateCasualtyDisplay();
    }`;

const newVitals = `    function updateVitals() {
      if (!player) return;
      const hp = document.getElementById('healthBar');
      const st = document.getElementById('staminaBar');
      const statusBadge = document.getElementById('statusBadge');
      const bleedoutEl = document.getElementById('bleedoutTimer');
      if (!hp || !st || !statusBadge) return;

      hp.style.width = player.health + '%';
      hp.className = 'bar-fill health-fill';
      if (player.health < 30) hp.classList.add('critical');
      else if (player.health < 60) hp.classList.add('low');

      st.style.width = player.stamina + '%';

      const statusMap = {
        healthy: '🟢 HEALTHY',
        injured: '🟡 INJURED',
        downed: '🔴 DOWNED — BLEEDING OUT',
        dead: '⚫ KIA',
        extracted: '🏁 EXTRACTED'
      };
      statusBadge.textContent = statusMap[player.status] || player.status;
      statusBadge.style.color = player.status === 'healthy' ? 'var(--success)' :
                                 player.status === 'downed' ? 'var(--pink)' : 'var(--warning)';

      // Bleedout countdown
      if (bleedoutEl) {
        if (player.status === 'downed' && player.bleedoutTimer > 0) {
          bleedoutEl.style.display = 'block';
          bleedoutEl.textContent = '⏱️ BLEEDOUT: ' + Math.ceil(player.bleedoutTimer / 1000) + 's';
        } else {
          bleedoutEl.style.display = 'none';
        }
      }

      updateInventoryDisplay();
      updateCasualtyDisplay();
    }`;

html = html.replace(oldVitals, newVitals);

// 6. Remove duplicate AI listeners at end of file
const dupes = `    // Event listeners for AI events
    document.addEventListener('droneAlert', (e) => {
      if (player && player.status === 'healthy') {
        const dist = calculateDistanceToDrone(e.detail.position);
        if (dist < 100) {
          player.takeDamage(15, { type: 'drone' });
          logChat('💥 Drone gunfire! Taking damage!', 'them');
          updateVitals();
        }
      }
      logChat('⚠️ Drone ' + e.detail.droneId + ' spotted enemy!', 'them');
    });
    document.addEventListener('mineTriggered', (e) => {
      if (player && player.status === 'healthy') {
        const dist = GameEngine.calculateDistance(player.position, e.detail.position);
        if (dist < 30) {
          const result = player.takeDamage(60, { type: 'mine' });
          logChat('💥 MINE BLAST! Health: ' + Math.round(player.health), 'them');
          updateVitals();
        }
      }
      logChat('💥 MINE DETONATED — check casualties!', 'them');
    });`;

html = html.replace(dupes, '');

fs.writeFileSync(filePath, html);
console.log("mobile.html patched successfully");
console.log("Changes: cache-bust v=7, bleedout timer, gas/EMP listeners, healSelf fix, duplicate removal");