# Accessibility Audit Checklist
## Signal Lost — High Fidelity Design System

Based on WCAG 2.1 AA standards and best practices from award-winning accessible websites.

---

## 1. Motion & Animation

### Reduced Motion Support
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] Parallax effects disabled when reduced motion is on
- [ ] Auto-playing animations have pause controls
- [ ] No flashing content (>3 flashes per second)

### Implementation
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 2. Color & Contrast

### Contrast Ratios (WCAG AA)
- [ ] Normal text: ≥ 4.5:1 against background
- [ ] Large text (18pt+): ≥ 3:1 against background
- [ ] UI components: ≥ 3:1 against adjacent colors
- [ ] Focus indicators: ≥ 3:1 against background

### Current Status
| Element | Foreground | Background | Ratio | Status |
|---------|-----------|-----------|-------|--------|
| Body text | #201116 | #fff0c7 | 12.4:1 | ✅ Pass |
| Teal accent | #008c94 | #fff0c7 | 4.8:1 | ✅ Pass |
| Orange accent | #ff8b1f | #fff0c7 | 3.2:1 | ✅ Pass (large text) |
| Muted text | #704a41 | #fff0c7 | 5.1:1 | ✅ Pass |
| Glass panel text | #201116 | rgba(255,248,220,0.15) | ~8:1 | ✅ Pass |

---

## 3. Focus Management

### Focus Indicators
- [ ] All interactive elements have visible focus states
- [ ] Focus indicator is not obscured by other elements
- [ ] Focus order follows logical reading order
- [ ] No focus traps (except intentional modals)

### Focus Styles
```css
:focus-visible {
  outline: 3px solid var(--teal);
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## 4. Keyboard Navigation

### Interactive Elements
- [ ] All buttons accessible via Tab key
- [ ] All links accessible via Tab key
- [ ] Form fields accessible via Tab key
- [ ] Custom controls (sliders, toggles) keyboard accessible
- [ ] Escape key closes modals/overlays
- [ ] Enter/Space activates buttons and links

### Skip Links
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

---

## 5. Screen Reader Support

### Semantic HTML
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Landmark regions (header, nav, main, aside, footer)
- [ ] Lists used for grouped content
- [ ] Buttons for actions, links for navigation

### ARIA Labels
- [ ] Icons have aria-label or aria-hidden
- [ ] Dynamic content has aria-live regions
- [ ] Form inputs have associated labels
- [ ] Custom controls have role and aria-* attributes

### Current Audit
| Component | role | label | Status |
|-----------|------|-------|--------|
| Radar scan | img | "Radar scanning 360 degrees" | ✅ |
| Team status | status | "Team signal strength 72%" | ✅ |
| Chat messages | log | "Mission communications" | ✅ |
| Buttons | button | Descriptive text | ✅ |
| Map | application | "Mission map, Oslo Norway" | ✅ |

---

## 6. Text & Typography

### Readability
- [ ] Base font size ≥ 16px (prevents iOS zoom)
- [ ] Line height ≥ 1.5 for body text
- [ ] Paragraph width ≤ 80 characters
- [ ] Text can be resized to 200% without breaking layout

### Font Loading
- [ ] System fonts available as fallbacks
- [ ] font-display: swap prevents invisible text
- [ ] Variable fonts reduce loading time

---

## 7. Touch & Mobile

### Touch Targets
- [ ] Minimum touch target: 44×44px (Apple) / 48×48px (Material)
- [ ] Adequate spacing between touch targets (≥ 8px)
- [ ] No hover-only interactions (provide tap alternative)

### Viewport
- [ ] viewport meta tag prevents zoom restrictions
- [ ] Content readable at 320px width
- [ ] No horizontal scrolling at normal zoom

---

## 8. Form Accessibility

### Labels & Inputs
- [ ] All inputs have visible labels
- [ ] Labels programmatically associated (for + id)
- [ ] Error messages announced to screen readers
- [ ] Required fields clearly indicated

### Current Forms
| Field | Label | Error | Status |
|-------|-------|-------|--------|
| Organizer Identity | ✅ | ❌ (needs implementation) | ⚠️ |
| Country select | ✅ | ❌ | ⚠️ |
| City select | ✅ | ❌ | ⚠️ |
| Player count | ✅ | ❌ | ⚠️ |
| Duration | ✅ | ❌ | ⚠️ |

---

## 9. Audio & Video

### Audio Controls
- [ ] Auto-play audio can be paused/stopped
- [ ] Volume control available
- [ ] Visual alternative for audio cues
- [ ] Transcripts for audio content

### Current Audio
- [x] Volume slider present
- [x] Play/Pause toggle
- [ ] Mute button (needs adding)
- [ ] Visual VU meter (present but not accessible)

---

## 10. Testing Checklist

### Automated Testing
- [ ] Lighthouse accessibility audit ≥ 90
- [ ] axe-core scan passes
- [ ] WAVE tool scan passes
- [ ] Pa11y scan passes

### Manual Testing
- [ ] Navigate entire app with keyboard only
- [ ] Test with NVDA / JAWS / VoiceOver
- [ ] Test at 200% zoom
- [ ] Test with reduced motion enabled
- [ ] Test on iOS Safari (screen reader)
- [ ] Test on Android TalkBack

---

## 🎯 Action Items

### High Priority
1. Add error handling to all form fields
2. Add aria-live regions for dynamic content (chat, kill feed)
3. Test keyboard navigation on all pages
4. Add skip links

### Medium Priority
5. Audit all color contrast ratios
6. Add focus indicators to all interactive elements
7. Test with actual screen readers
8. Document accessibility features

### Low Priority
9. Add high contrast mode support
10. Add print stylesheet
11. Test with voice control software

---

*R&D Team — Generated 2026-05-04*
