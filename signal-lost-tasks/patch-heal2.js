const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "mobile.html");
let html = fs.readFileSync(filePath, "utf8");

const oldHeal = `    function healSelf() {
      if (!player) return;
      if (player.inventory.medkits <= 0) {
        logChat('❌ No medkits remaining', 'me');
        return;
      }

      const amount = player.useItem('medkits');
      if (amount) {
        logChat(\`💊 Medkit used — Health: \${Math.round(player.health)}/100\`, 'me');
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

if (html.includes(oldHeal)) {
  html = html.replace(oldHeal, newHeal);
  fs.writeFileSync(filePath, html);
  console.log("SUCCESS: healSelf patched");
} else {
  console.log("ERROR: oldHeal not found");
  console.log("Looking for:", oldHeal.substring(0, 100));
}
