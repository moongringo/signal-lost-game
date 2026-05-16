# Mobile Polish Plan — Signal Lost v2

## Problem Summary

The game works on desktop but has UX issues on phones (375-480px width):

## Issues Found

### 1. HUD Overflow — CRITICAL
7 icon buttons in .hud-right need ~224px but only ~100px available at 375px.
**Fix:** Collapse secondary buttons into an overflow menu on mobile. Keep only essential ones visible: GPS focus, toggle panels. Move the rest (voice, stealth, radar, fullscreen radar, end mission) under a "..." overflow button.

### 2. Radar + Compass Overlap
At 480px, radar/compass sit bottom-left (80px), panels drawer opens from bottom taking 60vh. When open, the drawer covers the radar.
**Fix:** When panels are open on mobile, hide the radar/compass overlays. User can still tap the radar button in HUD for fullscreen radar.

### 3. Touch Targets Too Small
- `.panel-tab` padding is 8px 4px — hard to tap accurately on phone
- GPS manual input fields are 8px padding with 13px font — tiny for thumbs
- `.compact-button` at 8px 10px is small on a 375px screen
**Fix:** Ensure all interactive elements are minimum 44x44px touch target. Increase padding on tab buttons and GPS inputs.

### 4. GPS Tab Needs Mobile Love
Manual lat/lng inputs are side-by-side on desktop, but on 375px they're crammed. The "Apply Manual" button is compact-sized.
**Fix:** Stack inputs vertically on mobile. Make the button full-width and taller.

### 5. Panel Drawer UX
The drawer opens on tap of the panels button, but there's no visual cue that it's swipable. The drawer handle is subtle.
**Fix:** After opening, briefly animate a "pull up" hint. Make the drawer handle more visible. Consider adding a snap-point (40% / 80% height) via touch drag.

### 6. Map Controls on Mobile
Leaflet zoom buttons are position: bottomright. On mobile with the drawer open, they're behind the drawer.
**Fix:** Move zoom controls to the left side on mobile, or position them above the drawer.

### 7. Roles Screen on Mobile
2-column role grid at 375px is tight — each card gets ~165px. The text inside is 10-11px.
**Fix:** Consider 1-column layout for very small screens or increase card padding.

## Implementation Priority

1. HUD overflow menu (fixes #1 — most impactful)
2. Hide radar when drawer is open (fixes #2)
3. Bigger touch targets across the board (fixes #3, #4)
4. Drawer glanceable hint (fixes #5)
5. Map control repositioning (fixes #6)
6. Roles screen polish (fixes #7)
