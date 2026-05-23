const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "mobile.html");
let html = fs.readFileSync(filePath, "utf8");

// 1. Add Smoke Grenade button to Hacker panel (after hijackDrone)
html = html.replace(
  `<button class="mobile-btn danger" onclick="hijackDrone()">🔴 Hijack Enemy Drone</button>`,
  `<button class="mobile-btn danger" onclick="hijackDrone()">🔴 Hijack Enemy Drone</button>\n        <button class="mobile-btn" onclick="throwSmoke()">💨 Smoke Grenade</button>\n        <button class="mobile-btn warn" onclick="radioJam()">📡 Radio Jam</button>`
);

// 2. Add Field Surgery + Stim Pack to Medic panel (after reviveTeammate)
html = html.replace(
  `<button class="mobile-btn warn" onclick="reviveTeammate()" style="margin-top:8px;">✅ Revive Teammate</button>`,
  `<button class="mobile-btn warn" onclick="reviveTeammate()" style="margin-top:8px;">✅ Revive Teammate</button>\n        <button class="mobile-btn primary" onclick="fieldSurgery()" style="margin-top:8px;">🏥 Field Surgery</button>\n        <button class="mobile-btn" onclick="useStimPack()" style="margin-top:8px;">💉 Stim Pack</button>`
);

// 3. Add Trophy System + Ammo Resupply to Mechanic panel (after disarmTrap)
html = html.replace(
  `<button class="mobile-btn warn" onclick="disarmTrap()">🛡️ Disarm Nearby Trap</button>`,
  `<button class="mobile-btn warn" onclick="disarmTrap()">🛡️ Disarm Nearby Trap</button>\n        <button class="mobile-btn" onclick="deployTrophy()">🛡️ Trophy System</button>\n        <button class="mobile-btn primary" onclick="resupplyAmmo()" style="margin-top:8px;">🎒 Ammo Resupply</button>`
);

// 4. Add Decoy to Courier panel (after speedBoost)
html = html.replace(
  `<button class="mobile-btn primary" onclick="speedBoost()">⚡ Speed Boost</button>`,
  `<button class="mobile-btn primary" onclick="speedBoost()">⚡ Speed Boost</button>\n        <button class="mobile-btn" onclick="deployDecoy()">📡 Deploy Decoy</button>`
);

// 5. Replace fake dronePhoto() with real photo intel
const oldDronePhoto = `    function dronePhoto() { logChat('Drone: Photo captured', 'me'); }`;
const newDronePhoto = `    function dronePhoto() {
      if (!player || !match) { logChat('📸 No drone deployed', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — drone offline', 'me'); return; }
      
      const pos = player.position || (maps.drone ? maps.drone.getCenter() : [59.9139, 10.7522]);
      logChat('📸 Drone photo intel — scanning 80m radius...', 'me');
      
      if (!threatManager) {
        logChat('❌ No threats in area', 'me');
        return;
      }
      
      const intel = threatManager.photoIntel(pos, 80);
      const totalFound = intel.mines.length + intel.drones.length + intel.snipers.length + intel.loot.length;
      
      if (totalFound > 0) {
        let details = [];
        if (intel.mines.length) details.push(intel.mines.length + ' mine(s)');
        if (intel.drones.length) details.push(intel.drones.length + ' drone(s)');
        if (intel.snipers.length) details.push(intel.snipers.length + ' sniper(s)');
        if (intel.loot.length) details.push(intel.loot.length + ' loot drop(s)');
        logChat('📸 INTEL: ' + details.join(', ') + ' — blips on map for 10s', 'them');
        if (squad) squad.addScore(15, 'intel_gathered');
      } else {
        logChat('📸 Area clear — no threats detected', 'me');
      }
    }`;
html = html.replace(oldDronePhoto, newDronePhoto);

// 6. Add new ability functions before logChat
const abilitiesBlock = `
    // ============ ADVANCED ABILITIES ============

    function throwSmoke() {
      if (!player || !match) { logChat('💨 Cannot deploy smoke', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — grenade fuses offline', 'me'); return; }
      if (player.inventory.smokeGrenades <= 0) { logChat('❌ No smoke grenades', 'sys'); return; }
      
      player.inventory.smokeGrenades--;
      updateInventoryDisplay();
      
      const pos = player.position || (maps.mc ? maps.mc.getCenter() : [59.9139, 10.7522]);
      threatManager.throwSmoke(pos, 40, 15000);
      logChat('💨 SMOKE GRENADE deployed — concealment for 15s', 'me');
      if (squad) squad.addScore(10, 'smoke_deployed');
    }

    function fieldSurgery() {
      if (!player || !match) { logChat('🏥 Cannot perform surgery', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — medical tools offline', 'me'); return; }
      if (player.status === 'dead') { logChat('❌ You are dead', 'sys'); return; }
      if (player.status !== 'downed' && player.status !== 'injured') { logChat('🚫 Surgery only when injured/downed', 'sys'); return; }
      if (player._fieldSurgeryUsed) { logChat('❌ Field surgery already used this match', 'sys'); return; }
      
      logChat('🏥 Field Surgery — 8s channel... DO NOT MOVE', 'me');
      
      setTimeout(() => {
        const success = threatManager.fieldSurgery(player);
        if (success) {
          logChat('🏥 FIELD SURGERY complete — FULL RESTORE to 100 HP', 'sys');
          if (squad) squad.addScore(75, 'field_surgery');
          updateVitals();
        } else {
          logChat('❌ Surgery interrupted — conditions not met', 'sys');
        }
      }, 8000);
    }

    function radioJam() {
      if (!player || !match) { logChat('📡 Cannot jam', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — jammer offline', 'me'); return; }
      if (player.inventory.empGrenades <= 0) { logChat('❌ No EMP grenades for jamming', 'sys'); return; }
      
      player.inventory.empGrenades--;
      updateInventoryDisplay();
      
      const pos = player.position || (maps.mc ? maps.mc.getCenter() : [59.9139, 10.7522]);
      const result = threatManager.radioJam(pos, 100, 20000);
      logChat('📡 RADIO JAM deployed — ' + result.jammedCount + ' drone(s) disabled for 20s', 'me');
      if (squad && result.jammedCount > 0) squad.addScore(25 * result.jammedCount, 'radio_jam');
    }

    function deployDecoy() {
      if (!player || !match) { logChat('📡 Cannot deploy decoy', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — decoy offline', 'me'); return; }
      if (player.inventory.decoys <= 0) { logChat('❌ No decoys remaining', 'sys'); return; }
      
      player.inventory.decoys--;
      updateInventoryDisplay();
      
      const pos = player.position || (maps.mc ? maps.mc.getCenter() : [59.9139, 10.7522]);
      const offset = [pos[0] + (Math.random() - 0.5) * 0.001, pos[1] + (Math.random() - 0.5) * 0.001];
      threatManager.deployDecoy(offset, 30000);
      logChat('📡 DECOY BEACON deployed — AI will investigate fake signal', 'me');
      if (squad) squad.addScore(15, 'decoy_deployed');
    }

    function deployTrophy() {
      if (!player || !match) { logChat('🛡️ Cannot deploy trophy', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — trophy offline', 'me'); return; }
      
      const pos = player.position || (maps.mc ? maps.mc.getCenter() : [59.9139, 10.7522]);
      threatManager.deployTrophy(pos, 30000);
      logChat('🛡️ TROPHY SYSTEM deployed — 3 charges, intercepts projectiles', 'me');
      if (squad) squad.addScore(20, 'trophy_deployed');
    }

    function useStimPack() {
      if (!player || !match) { logChat('💉 Cannot use stim', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — stim offline', 'me'); return; }
      if (player.status === 'dead') { logChat('❌ You are dead', 'sys'); return; }
      if (player._stimActive) { logChat('⚡ Stim already active', 'sys'); return; }
      
      const result = threatManager.useStimPack(player);
      logChat('💉 STIM PACK — +' + result.healed + ' HP, speed + resistance for 15s', 'me');
      if (squad) squad.addScore(15, 'stim_used');
      updateVitals();
    }

    function resupplyAmmo() {
      if (!player || !match || !squad) { logChat('🎒 Cannot resupply', 'me'); return; }
      if (player._empDisabled) { logChat('❌ EMP interference — resupply offline', 'me'); return; }
      
      const result = threatManager.resupplyAmmo(player, squad);
      logChat('🎒 RESUPPLY complete — ' + result.totalAdded + ' rounds distributed to ' + result.playersResupplied + ' squadmate(s)', 'me');
      if (result.totalAdded > 0 && squad) squad.addScore(20, 'resupply');
      updateInventoryDisplay();
    }

    // ============ END ADVANCED ABILITIES ============
`;

// Insert before logChat function
html = html.replace('    function logChat(msg, who) {', abilitiesBlock + '\n    function logChat(msg, who) {');

// 7. Add smoke grenades to inventory display
html = html.replace(
  `{ id: 'invDecoys', count: inv.decoys, label: 'Decoys' }`,
  `{ id: 'invDecoys', count: inv.decoys, label: 'Decoys' },\n        { id: 'invSmoke', count: inv.smokeGrenades || 0, label: 'Smoke' }`
);

// 8. Add smoke grenades to inventory HTML
html = html.replace(
  `<div class="inv-item" id="invDecoys"><span class="count">1</span>Decoys</div>`,
  `<div class="inv-item" id="invDecoys"><span class="count">1</span>Decoys</div>\n          <div class="inv-item" id="invSmoke"><span class="count">2</span>Smoke</div>`
);

// 9. Add smoke to default inventory in game engine init
html = html.replace(
  `hasReconDrone: true`,
  `hasReconDrone: true, smokeGrenades: 2`
);

// 10. Bump cache-bust
html = html.replace('ai-threats.js?v=', 'ai-threats.js?v=');
const cacheMatch = html.match(/ai-threats\.js\?v=(\d+)/);
if (cacheMatch) {
  const oldV = parseInt(cacheMatch[1]);
  const newV = oldV + 1;
  html = html.replace('ai-threats.js?v=' + oldV, 'ai-threats.js?v=' + newV);
  console.log('Bumped ai-threats.js cache-bust: v=' + oldV + ' -> v=' + newV);
}

fs.writeFileSync(filePath, html);
console.log('mobile.html updated with 7 new abilities');
