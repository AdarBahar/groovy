# Dual-Page Setup: POC Testing + Production UI

## 🎯 Overview

The project now has a dual-page structure that allows you to:
1. **Test and validate core logic** on the POC page (`/poc`)
2. **Build the production UI** on the main page (`/`)

This setup keeps the lightweight POC interface available for testing while you develop the polished production interface.

---

## 📁 Project Structure

```
groovy/
├── src/
│   ├── core/                      # ✅ Framework-agnostic core
│   │   ├── GrooveEngine.ts
│   │   ├── DrumSynth.ts
│   │   └── index.ts
│   │
│   ├── hooks/                     # ✅ React adapters
│   │   └── useGrooveEngine.ts
│   │
│   ├── poc/                       # ✅ POC testing page
│   │   ├── PocApp.tsx
│   │   ├── PocApp.css
│   │   └── components/
│   │       ├── DrumGrid.tsx
│   │       ├── PlaybackControls.tsx
│   │       ├── TempoControl.tsx
│   │       ├── PresetSelector.tsx
│   │       └── SyncControl.tsx
│   │
│   ├── pages/                     # ✅ Route pages
│   │   ├── PocPage.tsx           # /poc route
│   │   ├── ProductionPage.tsx    # / route
│   │   └── ProductionPage.css
│   │
│   ├── components/                # ✅ Shared components
│   │   ├── Navigation.tsx
│   │   └── Navigation.css
│   │
│   ├── types.ts                   # ✅ Shared types
│   ├── App.tsx                    # ✅ Router setup
│   └── main.tsx
│
├── public/
│   └── sounds/                    # ✅ Drum samples (30 files)
│       ├── Kick.mp3
│       ├── Snare Normal.mp3
│       ├── Hi Hat Normal.mp3
│       └── ... (27 more)
│
└── package.json                   # ✅ react-router-dom added
```

---

## 🚀 How to Use

### 1. **Development Server**
```bash
npm run dev
```
- **Production UI**: http://localhost:5174/
- **POC Testing**: http://localhost:5174/poc

### 2. **Navigation**
- Click the navigation button in the top-right corner to switch between pages
- Or use the browser's address bar to navigate directly

### 3. **Testing Workflow**
1. Make changes to core logic (`src/core/`)
2. Test on POC page (`/poc`) to verify functionality
3. Once validated, implement in production UI (`/`)

---

## 📄 Pages

### **Production Page** (`/`)
- **Purpose**: Main user-facing interface
- **Status**: Placeholder (ready for development)
- **File**: `src/pages/ProductionPage.tsx`
- **Features**: Coming soon message with link to POC

### **POC Testing Page** (`/poc`)
- **Purpose**: Test core logic and validate changes
- **Status**: Fully functional
- **File**: `src/pages/PocPage.tsx` → `src/poc/PocApp.tsx`
- **Features**:
  - Interactive drum grid
  - Playback controls
  - Tempo and swing controls
  - Pattern presets
  - Sync mode selection
  - Real-time position indicator

---

## 🎨 Building the Production UI

### Step 1: Create Components
Create new components in `src/components/` for the production UI:
```bash
touch src/components/ProductionDrumGrid.tsx
touch src/components/ProductionControls.tsx
# etc.
```

### Step 2: Use the Hook
Import and use the `useGrooveEngine` hook:
```typescript
import { useGrooveEngine } from '../hooks/useGrooveEngine';

function ProductionDrumGrid() {
  const { isPlaying, currentPosition, togglePlayback } = useGrooveEngine();
  // ... your UI code
}
```

### Step 3: Test on POC
- Make changes to core logic
- Test on `/poc` page first
- Verify timing, sound, and behavior
- Then implement in production UI

---

## 🔄 Workflow Example

### Scenario: Add a new feature to the core engine

1. **Edit Core Logic**
   ```bash
   # Edit src/core/GrooveEngine.ts
   # Add new method or feature
   ```

2. **Test on POC**
   ```bash
   # Navigate to http://localhost:5174/poc
   # Test the new feature with the POC UI
   # Verify it works correctly
   ```

3. **Implement in Production**
   ```bash
   # Edit src/pages/ProductionPage.tsx
   # Or create new components in src/components/
   # Use the validated core logic
   ```

4. **Verify**
   ```bash
   # Navigate to http://localhost:5174/
   # Test the production UI
   ```

---

## ✅ What's Working

### Core Engine
- ✅ `GrooveEngine` - Playback, timing, scheduling
- ✅ `DrumSynth` - Audio sample loading and playback
- ✅ Event-based API (no React dependencies)

### POC Page (`/poc`)
- ✅ Full drum grid interface
- ✅ Playback controls (play/stop)
- ✅ Tempo control (40-240 BPM)
- ✅ Swing control (0-100%)
- ✅ Pattern presets (Basic Rock, Disco, Funk, etc.)
- ✅ Sync mode selection (start/middle/end)
- ✅ Real-time position indicator
- ✅ Sound preview on voice labels
- ✅ All 30 drum samples loaded

### Production Page (`/`)
- ✅ Placeholder with navigation
- ✅ Ready for development

---

## 🎯 Next Steps

1. **Design Production UI**
   - Sketch out the interface
   - Decide on layout and components
   - Plan user interactions

2. **Build Components**
   - Create production components in `src/components/`
   - Use the `useGrooveEngine` hook
   - Style with modern CSS

3. **Test Continuously**
   - Use POC page to validate core changes
   - Ensure production UI stays in sync

4. **Iterate**
   - Add features incrementally
   - Test on POC first
   - Implement in production

---

## 📚 Key Files

- **`src/App.tsx`** - Router setup
- **`src/pages/PocPage.tsx`** - POC route wrapper
- **`src/pages/ProductionPage.tsx`** - Production route
- **`src/poc/PocApp.tsx`** - POC application
- **`src/hooks/useGrooveEngine.ts`** - React adapter for core
- **`src/components/Navigation.tsx`** - Page navigation

---

## 🎉 Benefits

1. **Separation of Concerns**
   - POC for testing
   - Production for users
   - Core logic shared between both

2. **Rapid Testing**
   - Test changes immediately on POC
   - No need to rebuild production UI

3. **Clean Development**
   - Build production UI at your own pace
   - POC always available for validation

4. **No Conflicts**
   - POC and production are completely separate
   - Changes to one don't affect the other

---

**Ready to build!** 🚀

Start by navigating to http://localhost:5174/poc to see the POC in action, then build your production UI at http://localhost:5174/

