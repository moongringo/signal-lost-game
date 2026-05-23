#!/usr/bin/env node
/**
 * Signal Lost — Game Simulation & QA Runner
 * Tests all HTML components for bugs, errors, and design-system compliance
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = '/root/.openclaw/workspace/signal-lost-tasks';
const REPORT_FILE = path.join(PROJECT_DIR, 'QA-REPORT.md');

// Files that must exist and be tested
const REQUIRED_FILES = [
  'design-system.css',
  'design-system.js',
  'R&D-INDEX.html',
  'login.html',
  'server-browser.html',
  'map-selection.html',
  'role-selection.html',
  'career-stats.html',
  'kill-cam.html',
  'store.html',
  'friends.html',
  'patch-notes.html',
  'post-match-report.html',
  'settings.html',
  'emote-wheel.html',
  'clan-wars.html',
  'death-recap.html',
  'matchmaking.html',
  'player-profile.html',
  'match-result.html',
  'spectator-mode.html',
  'replay-viewer.html',
  'tournament-bracket.html',
  'token-dashboard.html',
  'daily-challenges.html',
  'inventory.html',
  'loadout-builder.html',
  'battle-pass.html',
  'loot-crate.html',
  'squad.html',
  'action-center.html',
  'admin-dashboard.html',
  'leaderboard.html',
  'ai-battle-arena.html',
  'mobile-ui-kit.html',
  'mobile-radar.html',
  'gps-tracker.html',
  'minimap.html',
  'design-flow-setup.html',
  'design-flow-roles.html',
  'design-flow-control.html',
  'design-lab.html',
  'shader-library.html',
  'scroll-animations.html',
  'page-transitions.html',
  'loading-screen.html',
  'notification-system.html',
  'modal-system.html',
  'audio-controller.html',
  'settings-panel.html',
  'tooltip-system.html',
  'chat-system.html',
];

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  fixes: [],
};

function log(level, message, file = null) {
  const prefix = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
  const context = file ? `[${file}] ` : '';
  const line = `${prefix} ${context}${message}`;
  
  if (level === 'ERROR') {
    results.failed++;
    results.errors.push({ file, message });
  } else if (level === 'WARN') {
    results.warnings++;
  } else {
    results.passed++;
  }
  
  console.log(line);
  return line;
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

function checkFileExists(filename) {
  const filePath = path.join(PROJECT_DIR, filename);
  const exists = fs.existsSync(filePath);
  if (!exists) {
    log('ERROR', `File missing: ${filename}`, filename);
  } else {
    log('PASS', `File exists`, filename);
  }
  return exists;
}

function validateHTML(filename) {
  const content = readFile(path.join(PROJECT_DIR, filename));
  if (!content) return;

  // Check DOCTYPE
  if (!content.includes('<!DOCTYPE html>')) {
    log('WARN', 'Missing DOCTYPE', filename);
  }

  // Check basic structure
  if (!content.includes('<html') || !content.includes('</html>')) {
    log('ERROR', 'Missing html tags', filename);
  }
  if (!content.includes('<head>') || !content.includes('</head>')) {
    log('ERROR', 'Missing head tags', filename);
  }
  if (!content.includes('<body') || !content.includes('</body>')) {
    log('ERROR', 'Missing body tags', filename);
  }

  // Check meta viewport
  if (!content.includes('viewport')) {
    log('WARN', 'Missing viewport meta tag', filename);
  }

  // Check charset
  if (!content.includes('charset="UTF-8"') && !content.includes("charset='UTF-8'")) {
    log('WARN', 'Missing or incorrect charset', filename);
  }
}

function validateDesignSystem(filename) {
  const content = readFile(path.join(PROJECT_DIR, filename));
  if (!content) return;

  // Must link design-system.css
  if (!content.includes('design-system.css')) {
    log('ERROR', 'Missing design-system.css link', filename);
  } else {
    log('PASS', 'Links design-system.css', filename);
  }

  // Must link design-system.js
  if (!content.includes('design-system.js')) {
    log('ERROR', 'Missing design-system.js script', filename);
  } else {
    log('PASS', 'Links design-system.js', filename);
  }

  // Must have cursor-spotlight div
  if (!content.includes('cursor-spotlight')) {
    log('ERROR', 'Missing cursor-spotlight div', filename);
  } else {
    log('PASS', 'Has cursor-spotlight', filename);
  }

  // Should have Google Fonts
  const hasFonts = content.includes('fonts.googleapis.com') || content.includes('fonts.gstatic.com');
  if (!hasFonts) {
    log('WARN', 'Missing Google Fonts preconnect/link', filename);
  } else {
    log('PASS', 'Has Google Fonts', filename);
  }

  // Should initialize SignalLostDesign
  if (!content.includes('SignalLostDesign')) {
    log('WARN', 'Missing SignalLostDesign initialization', filename);
  } else {
    log('PASS', 'Initializes SignalLostDesign', filename);
  }
}

function validateCSS(filename) {
  const content = readFile(path.join(PROJECT_DIR, filename));
  if (!content) return;

  // Check for CSS custom properties (design tokens)
  const hasCustomProps = content.includes('--ink:') && content.includes('--cream:');
  if (!hasCustomProps && filename !== 'design-system.css') {
    // Only warn, not all files need to redefine them
  }

  // Check for unclosed braces
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  if (openBraces !== closeBraces) {
    log('ERROR', `CSS brace mismatch: ${openBraces} open, ${closeBraces} close`, filename);
  }

  // Check for common CSS errors
  if (content.includes(';;')) {
    log('WARN', 'Double semicolon in CSS', filename);
  }

  // Check for missing semicolons before closing brace
  const badEndings = content.match(/[^;\s]}\s*\n/g);
  if (badEndings && badEndings.length > 0) {
    log('WARN', `Possible missing semicolons (${badEndings.length} instances)`, filename);
  }
}

function validateJS(filename) {
  const content = readFile(path.join(PROJECT_DIR, filename));
  if (!content) return;

  // Extract inline scripts
  const scriptMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
  
  for (const script of scriptMatches) {
    const scriptContent = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
    
    // Check for basic JS syntax issues
    if (scriptContent.includes('=&gt;')) {
      log('WARN', 'HTML-encoded arrow function (=&gt;) found, may cause JS error', filename);
    }
    
    // Check for unbalanced brackets in inline JS
    const openParens = (scriptContent.match(/\(/g) || []).length;
    const closeParens = (scriptContent.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      log('ERROR', `Parenthesis mismatch in inline JS (${openParens} open, ${closeParens} close)`, filename);
    }

    const openBraces = (scriptContent.match(/{/g) || []).length;
    const closeBraces = (scriptContent.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      log('ERROR', `Brace mismatch in inline JS (${openBraces} open, ${closeBraces} close)`, filename);
    }
  }
}

function validateLinks(filename) {
  const content = readFile(path.join(PROJECT_DIR, filename));
  if (!content) return;

  // Find all href links
  const hrefMatches = content.match(/href="([^"]+)"/g) || [];
  
  for (const match of hrefMatches) {
    const href = match.replace('href="', '').replace('"', '');
    
    // Skip external links and anchors
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue;
    
    // Strip query strings for file existence check
    const cleanHref = href.split('?')[0].split('#')[0];
    
    // Check relative links
    if (cleanHref.includes('./')) {
      const targetFile = cleanHref.replace('./', '');
      const targetPath = path.join(PROJECT_DIR, targetFile);
      if (!fs.existsSync(targetPath)) {
        log('ERROR', `Broken link: ${href} → file not found`, filename);
      }
    }
  }
}

function validateAll() {
  console.log('\n🔬 Signal Lost — Game Simulation & QA Runner');
  console.log('='.repeat(60));
  console.log(`Project: ${PROJECT_DIR}`);
  console.log(`Files to test: ${REQUIRED_FILES.length}`);
  console.log('='.repeat(60) + '\n');

  // Phase 1: File existence
  console.log('📁 PHASE 1: File Existence\n');
  for (const file of REQUIRED_FILES) {
    checkFileExists(file);
  }

  // Phase 2: HTML validation
  console.log('\n📄 PHASE 2: HTML Structure\n');
  for (const file of REQUIRED_FILES.filter(f => f.endsWith('.html'))) {
    validateHTML(file);
  }

  // Phase 3: Design system compliance
  console.log('\n🎨 PHASE 3: Design System Compliance\n');
  for (const file of REQUIRED_FILES.filter(f => f.endsWith('.html'))) {
    validateDesignSystem(file);
  }

  // Phase 4: CSS validation
  console.log('\n🎨 PHASE 4: CSS Validation\n');
  validateCSS('design-system.css');
  for (const file of REQUIRED_FILES.filter(f => f.endsWith('.html'))) {
    // Extract and validate inline styles
    const content = readFile(path.join(PROJECT_DIR, file));
    if (content && content.includes('<style>')) {
      validateCSS(file);
    }
  }

  // Phase 5: JS validation
  console.log('\n⚡ PHASE 5: JavaScript Validation\n');
  validateJS('design-system.js');
  for (const file of REQUIRED_FILES.filter(f => f.endsWith('.html'))) {
    validateJS(file);
  }

  // Phase 6: Link validation
  console.log('\n🔗 PHASE 6: Link Validation\n');
  for (const file of REQUIRED_FILES.filter(f => f.endsWith('.html'))) {
    validateLinks(file);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 QA SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`❌ Errors:  ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed + results.warnings)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  // Write report
  const report = `# Signal Lost — QA Report

**Date:** 2026-05-04
**Project:** Signal Lost Game UI
**Files Tested:** ${REQUIRED_FILES.length}

## Summary

| Metric | Count |
|--------|-------|
| ✅ Passed | ${results.passed} |
| ⚠️ Warnings | ${results.warnings} |
| ❌ Errors | ${results.failed} |
| **Success Rate** | **${((results.passed / (results.passed + results.failed + results.warnings)) * 100).toFixed(1)}%** |

## Errors Found

${results.errors.length === 0 ? 'No critical errors found.' : results.errors.map(e => `- **[${e.file}]** ${e.message}`).join('\n')}

## Test Coverage

- File existence
- HTML structure (DOCTYPE, html/head/body tags)
- Meta tags (viewport, charset)
- Design system compliance (design-system.css, design-system.js, cursor-spotlight, Google Fonts, SignalLostDesign init)
- CSS validation (brace balance, syntax)
- JavaScript validation (parenthesis/brace balance, encoded arrows)
- Link validation (broken relative links)

---
*Generated by Signal Lost QA Runner*
`;

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\n📝 Report saved to: ${REPORT_FILE}`);

  return results.failed === 0;
}

// Auto-fix common issues
function autoFix() {
  console.log('\n🔧 PHASE 7: Auto-Fix\n');
  
  for (const file of REQUIRED_FILES.filter(f => f.endsWith('.html'))) {
    const filePath = path.join(PROJECT_DIR, file);
    let content = readFile(filePath);
    if (!content) continue;

    let modified = false;

    // Fix HTML-encoded arrow functions
    if (content.includes('=&gt;')) {
      content = content.replace(/=&gt;/g, '=>');
      log('FIX', 'Fixed HTML-encoded arrow functions (=&gt; => =>)', file);
      modified = true;
    }

    // Fix double semicolons in CSS
    if (content.includes(';;')) {
      content = content.replace(/;;+/g, ';');
      log('FIX', 'Fixed double semicolons', file);
      modified = true;
    }

    // Ensure cursor-spotlight exists right after body
    if (!content.includes('cursor-spotlight')) {
      content = content.replace('<body>', '<body>\n<div class="cursor-spotlight"></div>');
      log('FIX', 'Added missing cursor-spotlight div', file);
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      results.fixes.push(file);
    }
  }

  console.log(`\n🔧 Auto-fixed ${results.fixes.length} files: ${results.fixes.join(', ')}`);
}

// Run
const allPassed = validateAll();
autoFix();

// Re-validate after fixes
if (results.fixes.length > 0) {
  console.log('\n🔄 Re-validating after fixes...\n');
  results.passed = 0;
  results.failed = 0;
  results.warnings = 0;
  results.errors = [];
  validateAll();
}

process.exit(allPassed ? 0 : 1);
