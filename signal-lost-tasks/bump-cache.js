const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "mobile.html");
let html = fs.readFileSync(filePath, "utf8");

// Bump ai-threats.js cache-bust only
html = html.replace('ai-threats.js?v=10', 'ai-threats.js?v=11');

fs.writeFileSync(filePath, html);
console.log("Bumped ai-threats.js cache-bust to v=11");
