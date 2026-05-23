const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "mobile.html");
let html = fs.readFileSync(filePath, "utf8");

// Match healSelf function
const oldHeal = /function healSelf\(\) \{\s*if \(!player\) return;\s*if \(player\.inventory\.medkits <= 0\) \{\s*logChat\(['"]❌ No medkits remaining['"], ['"]me['"]\);\s*return;\s*\}\s*const amount = player\.useItem\(['"]medkits['"]\);\s*if \(amount\) \{\s*logChat\([`'][💊] Medkit used — Health: \$\{Math\.round\(player\.health\)\}\/100['`], ['"]me['"]\);\s*updateVitals\(\);\s*\}\s*\}/;

const newHeal = `function healSelf() {
      if (!player) return;
      if (player.status === 'dead') { logChat('❌ You are dead', 'sys'); return; }
      if (player.inventory.medkits <= 0) { logChat('❌ No medkits remaining', 'me'); return; }
      player.inventory.medkits--;
      const healed = player.heal(50);
      logChat('💊 Medkit used — +' + healed + ' HP — Health: ' + Math.round(player.health) + '/100', 'me');
      updateVitals();
    }`;

if (oldHeal.test(html)) {
  html = html.replace(oldHeal, newHeal);
  fs.writeFileSync(filePath, html);
  console.log("SUCCESS: healSelf patched");
} else {
  console.log("ERROR: Could not find healSelf pattern");
  // Show what we have
  const match = html.match(/function healSelf[\s\S]{0,500}/);
  if (match) {
    console.log("Found function:");
    console.log(match[0].substring(0, 400));
  }
}
