#!/usr/bin/env node
/**
 * Smart brace counter - ignores braces inside strings and comments
 */
const fs = require('fs');
const file = process.argv[2] || 'action-center.html';
const content = fs.readFileSync(file, 'utf8');

function countBracesSmart(text, type) {
  let inString = false;
  let stringChar = null;
  let inComment = false;
  let inRegex = false;
  let open = 0;
  let close = 0;
  let escape = false;
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1] || '';
    
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    
    if (inString) {
      if (ch === stringChar) inString = false;
      continue;
    }
    
    if (inComment) {
      if (type === 'css' && ch === '*' && next === '/') {
        inComment = false;
        i++;
      } else if (type === 'js' && ch === '\n') {
        inComment = false;
      } else if (type === 'js' && ch === '*' && next === '/') {
        inComment = false;
        i++;
      }
      continue;
    }
    
    if (ch === '/' && next === '/' && type === 'js') {
      inComment = true;
      i++;
      continue;
    }
    if (ch === '/' && next === '*' && (type === 'css' || type === 'js')) {
      inComment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }
    
    if (ch === '{') open++;
    if (ch === '}') close++;
  }
  
  return { open, close };
}

// Extract CSS sections
const styleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [];
let cssOpen = 0, cssClose = 0;
for (const match of styleMatches) {
  const css = match.replace(/<style[^>]*>/, '').replace(/<\/style>/, '');
  const r = countBracesSmart(css, 'css');
  cssOpen += r.open;
  cssClose += r.close;
}

// Extract JS sections
const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
let jsOpen = 0, jsClose = 0;
for (const match of scriptMatches) {
  const js = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
  if (match.includes('src=')) continue; // skip external scripts
  const r = countBracesSmart(js, 'js');
  jsOpen += r.open;
  jsClose += r.close;
}

console.log(`File: ${file}`);
console.log(`CSS braces: ${cssOpen} open, ${cssClose} close → ${cssOpen === cssClose ? '✅ balanced' : '❌ mismatch: ' + (cssOpen - cssClose)}`);
console.log(`JS braces:  ${jsOpen} open, ${jsClose} close → ${jsOpen === jsClose ? '✅ balanced' : '❌ mismatch: ' + (jsOpen - jsClose)}`);
