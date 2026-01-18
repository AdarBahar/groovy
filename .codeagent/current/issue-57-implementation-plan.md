# Implementation Plan: Mobile & Adaptive View (Issue #57)

**Issue**: https://github.com/AdarBahar/groovy/issues/57
**Title**: [UI] Support Mobile/Adaptive View
**Date**: 2026-01-15
**Status**: Planning
**Complexity**: HIGH (Estimated 26-37 hours)

---

## 1. Executive Summary

Issue #57 is a comprehensive mobile and responsive design overhaul for the Groovy drum notation application. The requirements document specifies:

- **Mobile-First Design** (320px+)
- **Progressive Enhancement** for tablet (768px+) and desktop (1024px+)
- **Touch-Optimized** (44px minimum touch targets)
- **60fps Animations** on mobile devices
- **WCAG 2.1 AA Accessibility** compliance

This is a **major feature** requiring modifications to nearly all UI components.

---

## 2. Current State Analysis

### Technology Stack
- **CSS Framework**: Tailwind CSS 4.x with custom theme variables
- **Component Library**: Radix UI (Dialog, Slider, Collapsible, Tooltip)
- **Build Tool**: Vite with @tailwindcss/vite plugin
- **Icons**: Lucide React

### Current Layout (Desktop-Optimized)
```
┌────────────────────────────────────────────────────────┐
│                    Header (Fixed)                       │
│ Logo | Metronome | Save | Library | Count-in | Theme   │
├────┬───────────────────────────────────────────────────┤
│    │  PlaybackControls (Horizontal)                    │
│ S  │  MetadataFields (3-column grid)                   │
│ i  │  SheetMusicDisplay                                │
│ d  │  DrumGridDark (7 rows x N columns)                │
│ e  │  KeyboardShortcuts                                │
│ b  ├───────────────────────────────────────────────────┤
│ a  │  BottomToolbar (Download, Print, Share, Save)     │
│ r  │                                                   │
└────┴───────────────────────────────────────────────────┘
```

### Key Responsive Challenges

| Component | Current | Challenge |
|-----------|---------|-----------|
| Header | 12+ horizontal elements | Must collapse to mobile menu |
| Sidebar | Fixed 80px, always visible | Must become slide-out drawer |
| PlaybackControls | Horizontal layout | Needs vertical stacking |
| DrumGridDark | 7 rows × 16+ columns | Horizontal scroll, touch targets |
| MetadataFields | 3-column grid | Single column on mobile |
| Modals | Desktop-sized | Need full-screen/bottom-sheet |

---

## 3. Implementation Phases

### Phase 1: Foundation & Infrastructure
**Complexity**: Medium | **Time**: 2-3 hours

#### 1.1 Create useMediaQuery Hook
**File**: `src/hooks/useMediaQuery.ts` (NEW)

```typescript
// Provides consistent breakpoint detection
- isMobile: < 768px
- isTablet: 768px - 1023px
- isDesktop: ≥ 1024px
- isTouchDevice: (hover: none) and (pointer: coarse)
```

#### 1.2 Verify Tailwind Breakpoints
**File**: `src/styles/tailwind.css`

Confirm breakpoints:
- `sm:` 640px
- `md:` 768px (PRIMARY - tablet)
- `lg:` 1024px (PRIMARY - desktop)
- `xl:` 1280px

#### 1.3 Add Viewport Meta Tags
**File**: `index.html`

```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="theme-color" content="#1e293b">
<meta name="apple-mobile-web-app-capable" content="yes">
```

---

### Phase 2: Mobile Layout Architecture
**Complexity**: High | **Time**: 4-6 hours

#### 2.1 Mobile Sidebar Toggle System
**Files**:
- `src/pages/ProductionPage.tsx`
- `src/components/production/Sidebar.tsx`

**Changes**:
1. Add `isSidebarOpen` state to ProductionPage
2. Add hamburger menu button (visible on mobile only)
3. Transform sidebar to slide-out drawer on mobile:
   - `fixed` position with `translate-x` animation
   - Backdrop overlay with click-to-close
   - Auto-close on selection
4. Keep sidebar always visible on desktop (`md:relative md:translate-x-0`)

**Requirements Covered**: REQ-APP-001 through REQ-APP-007

#### 2.2 Responsive Header Refactor
**File**: `src/components/production/Header.tsx`

**Mobile Layout** (<768px):
```
[☰] [G] Groovy                    [⋮]
     └── Hamburger menu       └── More menu
```

**Tablet Layout** (768px-1023px):
```
[G] Groovy | [Count] [Speed] [?] [☀]
```

**Desktop Layout** (≥1024px):
```
[G] Groovy | [Metro: OFF 4th 8th 16th] | [Save] [Groovies] [Library] [Count] [Speed] [?] [☀]
```

**Implementation**:
- `md:hidden` hamburger button (triggers sidebar)
- `md:hidden` more menu button (triggers dropdown)
- `hidden md:flex` for desktop navigation
- `hidden lg:flex` for metronome controls

**Requirements Covered**: REQ-HEADER-001 through REQ-HEADER-011

---

### Phase 3: Component-Level Responsive Updates
**Complexity**: High | **Time**: 4-6 hours

#### 3.1 PlaybackControls
**File**: `src/components/production/PlaybackControls.tsx`

**Mobile**:
```
   [▶] [▶+]
     0:00

[Tempo: 120 BPM ═══════]
[Swing: 50% ═══════════]
```

**Desktop**: Keep current horizontal layout

**Key Changes**:
- `flex-col lg:flex-row`
- Sliders `w-full lg:max-w-md`
- Play buttons `w-12 h-12 lg:w-14 lg:h-14`

**Requirements Covered**: REQ-PLAYBACK-001 through REQ-PLAYBACK-010

#### 3.2 MetadataFields
**File**: `src/components/production/MetadataFields.tsx`

**Changes**:
- Grid `grid-cols-1 md:grid-cols-3`
- Edit button icon-only on mobile
- Input fields 16px font (prevents iOS zoom)

**Requirements Covered**: REQ-METADATA-001 through REQ-METADATA-008

#### 3.3 BottomToolbar
**File**: `src/components/production/BottomToolbar.tsx`

**Mobile**:
```
     © Groovy 2026
[DL] [Print] [Share] [SAVE]
```

**Changes**:
- `flex-col md:flex-row`
- Icon sizes `w-4 h-4 md:w-5 md:h-5`
- Hide copyright on very small screens (`hidden sm:block`)

**Requirements Covered**: REQ-TOOLBAR-001 through REQ-TOOLBAR-008

#### 3.4 KeyboardShortcuts
**File**: `src/components/production/KeyboardShortcuts.tsx`

**Decision**: Hide on mobile (`hidden md:flex`)
- Keyboard shortcuts not relevant for touch devices
- Saves vertical space

**Requirements Covered**: REQ-SHORTCUTS-001 through REQ-SHORTCUTS-005

---

### Phase 4: DrumGrid Mobile Optimization
**Complexity**: Very High | **Time**: 6-8 hours

This is the most complex and critical phase.

#### 4.1 Horizontal Scroll Container
**File**: `src/components/production/DrumGridDark.tsx`

**Changes**:
1. Wrap measure grid in scrollable container:
   ```tsx
   <div className="overflow-x-auto">
     <div className="min-w-max">
       {/* Grid content */}
     </div>
   </div>
   ```
2. Add `-webkit-overflow-scrolling: touch` for iOS momentum scroll
3. Consider scroll snap for measure boundaries

#### 4.2 Touch-Optimized Cell Sizes
**Current**: `w-12 h-10` (48×40px)
**Mobile**: `w-11 h-11` (44×44px minimum)

**Changes**:
- Cell: `w-10 md:w-12 h-10 md:h-10` with min-height 44px on touch
- Voice label: `w-20 md:w-24`
- Beat labels: Same `text-xs`

#### 4.3 Measure Header Actions
**Current**: `w-8 h-8` (32px) - TOO SMALL

**Changes**:
- Buttons: `p-1.5 md:p-2`
- Icons: `w-3.5 h-3.5 md:w-4 md:h-4`
- Ensure 44px touch area via padding

#### 4.4 Context Menu Mobile Adaptation
**Current**: Right-click context menu

**Mobile**: Long-press (500ms) triggers menu
- Already implemented in DrumGridDark.tsx
- Verify touch targets adequate
- Consider bottom-sheet style for variation menu

**Requirements Covered**: REQ-DRUMEDITOR-001 through REQ-MEASURE-013

---

### Phase 5: Sequencer & Sheet Music
**Complexity**: Medium | **Time**: 2-3 hours

#### 5.1 SheetMusicDisplay
**File**: `src/components/SheetMusicDisplay.tsx`

**Changes**:
- Container: `overflow-x-auto`
- Set `min-w-[600px]` to ensure readability
- Desktop: Remove min-width constraint
- Adjust staffWidth dynamically based on viewport

#### 5.2 Sequencer Container
**File**: `src/pages/ProductionPage.tsx`

**Changes**:
- Padding: `p-3 md:p-6`
- Border radius: `rounded-xl`

**Requirements Covered**: REQ-SEQUENCER-001 through REQ-SEQUENCER-005

---

### Phase 6: Modal & Dialog Updates
**Complexity**: Medium | **Time**: 3-4 hours

#### 6.1 Base Dialog Component
**File**: `src/components/ui/dialog.tsx`

**Mobile Treatment**:
- Full width: `w-full sm:max-w-md`
- Bottom sheet style: `rounded-t-lg` on mobile
- Max height: `max-h-[90vh]` with overflow scroll

#### 6.2 Individual Modals
**Files**:
- `ShareModal.tsx` - Tab bar horizontal scroll or icons-only
- `DownloadModal.tsx` - Single column grid on mobile
- `MetronomeOptionsMenu.tsx` - Bottom sheet positioning
- `AutoSpeedUpModal.tsx` - Stack inputs vertically
- `AboutModal.tsx` - Full width on mobile
- `PrintPreviewModal.tsx` - Full screen on mobile

---

### Phase 7: Touch Interactions & Gestures
**Complexity**: Medium | **Time**: 3-4 hours

#### 7.1 Touch Event Optimization
**File**: `src/components/production/DrumGridDark.tsx`

**Already Implemented**:
- Touch start/move/end handlers
- Long-press for context menu
- Drag-to-paint functionality

**Improvements Needed**:
- Passive event listeners for scroll
- Debounce touch move (already has some)
- Use CSS transforms for animations

#### 7.2 Sidebar Swipe Gesture
**File**: `src/pages/ProductionPage.tsx`

**Optional Enhancement**:
- Swipe from left edge to open sidebar
- Swipe left on sidebar to close
- Can be implemented with touch event listeners

**Requirements Covered**: REQ-GESTURE-001 through REQ-GESTURE-004, REQ-TAP-001 through REQ-TAP-003

---

### Phase 8: Accessibility Compliance
**Complexity**: Medium | **Time**: 2-3 hours

#### 8.1 Touch Target Audit
Verify all interactive elements meet 44×44px minimum:
- Header buttons
- Sidebar buttons
- DrumGrid cells
- Modal close buttons
- Slider thumbs

#### 8.2 Focus Management
- Focus trap in modals/drawers
- Visible focus indicators (`:focus-visible`)
- Proper tab order

#### 8.3 ARIA Labels
- Icon-only buttons need `aria-label`
- DrumGrid cells need state announcements
- Modal announcements on open

#### 8.4 iOS Safe Area Insets
**File**: `src/index.css` or component styles

```css
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

**Requirements Covered**: All Section 7 requirements, REQ-IOS-001 through REQ-ANDROID-002

---

## 4. Files to Modify (Summary)

### Core Layout Files
| File | Changes |
|------|---------|
| `src/pages/ProductionPage.tsx` | Sidebar toggle, responsive flex |
| `src/components/production/Header.tsx` | Mobile menu, breakpoint visibility |
| `src/components/production/Sidebar.tsx` | Slide-out drawer animation |

### Component Files
| File | Changes |
|------|---------|
| `src/components/production/PlaybackControls.tsx` | Vertical stack, slider widths |
| `src/components/production/DrumGridDark.tsx` | Horizontal scroll, touch targets |
| `src/components/production/MetadataFields.tsx` | Grid columns, edit button |
| `src/components/production/BottomToolbar.tsx` | Vertical stack, icon sizes |
| `src/components/production/KeyboardShortcuts.tsx` | Hide on mobile |
| `src/components/SheetMusicDisplay.tsx` | Scroll container, min-width |

### Modal Files
| File | Changes |
|------|---------|
| `src/components/ui/dialog.tsx` | Full-width mobile, bottom sheet |
| `src/components/production/ShareModal.tsx` | Tab bar mobile |
| `src/components/production/DownloadModal.tsx` | Single column |
| `src/components/production/MetronomeOptionsMenu.tsx` | Positioning |
| All other modals | Width/padding adjustments |

### New Files
| File | Purpose |
|------|---------|
| `src/hooks/useMediaQuery.ts` | Breakpoint detection hook |

### Config/Style Files
| File | Changes |
|------|---------|
| `index.html` | Viewport meta tags |
| `src/index.css` | Safe area insets, touch styles |

---

## 5. Implementation Order

**Recommended Execution Order**:

```
Week 1: Foundation + Layout (Phases 1-2)
├── Day 1: useMediaQuery hook, viewport meta tags
├── Day 2: Sidebar slide-out drawer
└── Day 3: Header responsive refactor

Week 2: Components (Phases 3-4)
├── Day 4: PlaybackControls, MetadataFields
├── Day 5: BottomToolbar, KeyboardShortcuts
├── Day 6-7: DrumGridDark (most complex)

Week 3: Polish + Testing (Phases 5-8)
├── Day 8: SheetMusicDisplay, Sequencer
├── Day 9: Modals refactor
├── Day 10: Touch interactions, accessibility
└── Day 11: Cross-browser/device testing
```

---

## 6. Testing Requirements

### Device Testing Matrix

| Category | Device | Screen Size | Browser |
|----------|--------|-------------|---------|
| Mobile | iPhone SE | 375×667 | Safari 14+ |
| Mobile | iPhone 12/13 | 390×844 | Safari 15+ |
| Mobile | Samsung Galaxy S21 | 360×800 | Chrome 90+ |
| Tablet | iPad (9th gen) | 810×1080 | Safari 15+ |
| Tablet | iPad Pro | 1024×1366 | Safari 15+ |
| Desktop | Any | 1920×1080 | Chrome/Firefox/Edge |

### Key Test Cases

**Mobile (<768px)**:
- [ ] Hamburger menu opens/closes sidebar
- [ ] Sidebar slides smoothly (300ms)
- [ ] Backdrop closes sidebar on click
- [ ] Mobile menu (⋮) opens dropdown
- [ ] DrumGrid scrolls horizontally
- [ ] All buttons ≥44px touch target
- [ ] Playback controls stacked vertically
- [ ] Modals open properly

**Tablet (768px-1023px)**:
- [ ] Sidebar always visible
- [ ] Header shows condensed buttons
- [ ] DrumGrid measures wrap

**Desktop (≥1024px)**:
- [ ] Full header with metronome
- [ ] All controls visible
- [ ] No horizontal scroll (except intentional)

---

## 7. Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| DrumGrid performance | 60fps degradation | Profile on real devices, optimize |
| Touch gesture conflicts | Scroll vs paint | Clear gesture zones, test extensively |
| Breaking desktop | Regression | Test desktop after each change |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS Safari quirks | Layout issues | Test on real iOS devices |
| Android keyboard resize | Layout shifts | Use visualViewport API |
| Modal focus traps | Accessibility | Test with screen readers |

---

## 8. Success Metrics

**Performance**:
- Lighthouse Mobile Score: > 90
- Animation FPS: 60fps on iPhone 8 / Samsung A series
- Time to Interactive: < 5 seconds on 3G

**Usability**:
- All touch targets: ≥ 44×44px
- Sidebar animation: 300ms smooth
- DrumGrid horizontal scroll: Natural momentum

**Compatibility**:
- iOS Safari 14+
- Chrome Mobile 90+
- Firefox 88+
- Samsung Internet 14+

---

## 9. Decisions (Resolved)

| Question | Decision |
|----------|----------|
| **Metronome on Mobile** | Mobile menu (header dropdown) |
| **DrumGrid Touch Mode** | Yes - add toggle to switch between scroll and paint modes |
| **PWA Preparation** | Yes - include in implementation |
| **Landscape Priority** | Low priority - focus on portrait mobile first |

---

## 10. Additional Phase: PWA Support

### Phase 9: Progressive Web App
**Complexity**: Medium | **Time**: 3-4 hours

**Requirements**:
- Service worker for offline caching
- Web app manifest (`manifest.json`)
- Install prompt handling
- Offline fallback page
- Cache audio samples for offline playback

**Files to Create**:
| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest with icons, name, colors |
| `src/hooks/usePWA.ts` | Install prompt handling hook |

**Implementation Options**:
1. **Vite PWA Plugin** (recommended) - `vite-plugin-pwa`
2. **Manual Service Worker** - More control, more code

**Manifest Example**:
```json
{
  "name": "Groovy - Drum Notation Editor",
  "short_name": "Groovy",
  "description": "Create, edit, and play drum patterns",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1e293b",
  "theme_color": "#1e293b",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 11. DrumGrid Touch Mode Toggle (New Requirement)

**Purpose**: Differentiate between scroll and paint modes on touch devices

**UI Location**: Above drum grid or in a floating action button

**Implementation**:
```tsx
// DrumGridDark.tsx
const [touchMode, setTouchMode] = useState<'scroll' | 'paint'>('scroll');

// Toggle button
<button onClick={() => setTouchMode(m => m === 'scroll' ? 'paint' : 'scroll')}>
  {touchMode === 'scroll' ? <Move /> : <Pencil />}
  {touchMode === 'scroll' ? 'Scroll Mode' : 'Paint Mode'}
</button>

// Touch handler
const handleTouch = (e: TouchEvent) => {
  if (touchMode === 'scroll') {
    // Allow native scroll
    return;
  }
  e.preventDefault();
  // Paint note
};
```

**Visual Indicators**:
- Scroll mode: Grid border normal
- Paint mode: Grid border purple + "Editing" badge

---

## 12. Updated Implementation Order

```
Week 1: Foundation + Layout (Phases 1-2)
├── Day 1: useMediaQuery hook, viewport meta tags
├── Day 2: Sidebar slide-out drawer
└── Day 3: Header responsive refactor (metronome in mobile menu)

Week 2: Components (Phases 3-4)
├── Day 4: PlaybackControls, MetadataFields
├── Day 5: BottomToolbar, KeyboardShortcuts
├── Day 6-7: DrumGridDark + Touch Mode Toggle (most complex)

Week 3: Polish + PWA (Phases 5-9)
├── Day 8: SheetMusicDisplay, Sequencer
├── Day 9: Modals refactor
├── Day 10: Touch interactions, accessibility
├── Day 11: PWA setup (manifest, service worker)
└── Day 12: Cross-browser/device testing
```

---

## 13. Next Steps

1. ✅ Plan created and documented
2. ✅ Open questions resolved
3. ⏳ Begin Phase 1 implementation
4. ⏳ Test on physical devices after each phase
5. ⏳ Document changes following project conventions

---

**Plan Status**: Approved - Ready for Implementation
**Estimated Total Time**: 29-41 hours (with PWA)
**Recommended Approach**: Phased implementation over 2-3 weeks
