# Groovy - User Guide

Welcome to Groovy, a modern drum notation editor! This guide will help you understand all the features and how to use them effectively.

---

## 🎵 Basic Concepts

### The Grid
The drum grid shows your drum pattern with:
- **Rows:** Each row represents a drum instrument (Hi-Hat, Snare, Kick, Toms)
- **Columns:** Each column represents a time position in the measure
- **Cells:** Click cells to add/remove drum hits

### Time Divisions
- **8th notes:** 8 positions per measure (1 & 2 & 3 & 4 &)
- **16th notes:** 16 positions per measure (1 e & a 2 e & a...)
- **32nd notes:** 32 positions per measure
- **Triplets:** 12 positions per measure (1 & a 2 & a...)

---

## 🎯 Creating Notes

### Simple Mode (Default)

**Left-Click:** Toggle note on/off
- Click an empty cell to add a note with the default articulation
- Click an active cell to remove the note

**Right-Click:** Open articulation menu
- Shows all available variations for that drum
- Use keyboard shortcuts (1-8) to quickly select
- Hover over options to preview the sound

**Example:**
1. Left-click a Hi-Hat cell → Adds closed hi-hat
2. Right-click the same cell → Menu shows: Closed, Open, Accent, Foot
3. Press `2` or click "Open" → Changes to open hi-hat

---

### Advanced Mode

**Toggle:** Press `E` key or click the "Advanced Edit Mode" toggle

In Advanced Mode:
- **Left-Click:** Opens articulation menu (same as right-click)
- **Right-Click:** Still opens articulation menu
- Useful when you're frequently changing articulations

**When to use:**
- ✅ When creating complex patterns with many articulation changes
- ✅ When you want faster access to the articulation menu
- ❌ When quickly toggling notes on/off (use Simple Mode instead)

---

## 🖌️ Drag-to-Paint

Create notes quickly by dragging across multiple cells!

### Paint Mode
**How:** Hold `Ctrl` (or `⌘` on Mac) + Drag across cells
**What it does:** Adds notes with default articulation to all cells you drag over
**Visual:** Cursor changes to crosshair (➕)

**Example:**
1. Hold Ctrl
2. Click and drag across 4 hi-hat cells
3. Release → All 4 cells now have closed hi-hat notes

### Erase Mode
**How:** Hold `Alt` + Drag across cells
**What it does:** Removes all notes from cells you drag over
**Visual:** Cursor changes to "not-allowed" (🚫)

**Example:**
1. Hold Alt
2. Click and drag across active cells
3. Release → All notes in those cells are removed

### Tips
- ✅ Works across measure boundaries
- ✅ Works in both Simple and Advanced modes
- ✅ Great for creating repetitive patterns quickly
- ⚠️ Drag-to-paint always uses the default articulation (use context menu to change after)

---

## 🎼 Bulk Operations

Apply patterns to an entire measure at once!

### How to Use
1. **Click a voice label** (e.g., "Hi-Hat", "Snare", "Kick")
2. A dialog opens showing available patterns
3. Click a pattern to apply it to the entire measure
4. Press `Esc` or click outside to close

### Available Patterns

**Hi-Hat Patterns:**
- **All On:** Every position gets a closed hi-hat
- **Upbeats Only:** Only "e", "&", "a" positions (16th note upbeats)
- **Downbeats Only:** Only "1", "2", "3", "4" positions
- **Eighth Notes:** Standard 8th note pattern (1 & 2 & 3 & 4 &)
- **Clear All:** Remove all hi-hat notes

**Snare Patterns:**
- **All On (Normal):** Every position gets a normal snare hit
- **Backbeat:** Classic 2 & 4 pattern
- **All Ghost Notes:** Every position gets a ghost note
- **All Accents:** Every position gets an accented snare
- **Clear All:** Remove all snare notes

**Kick Patterns:**
- **All On:** Every position gets a kick
- **Four on the Floor:** Kick on beats 1, 2, 3, 4
- **Foot on Beats:** Same as Four on the Floor
- **Foot on "&"s:** Kick on all "&" positions
- **Clear All:** Remove all kick notes

### Tips
- ✅ Great for starting a new pattern quickly
- ✅ Combine with drag-to-paint for variations
- ✅ Right-click voice labels to preview the sound
- ⚠️ Bulk operations replace ALL notes in that row for that measure

---

## 🎨 Visual Indicators

### Icons
Each articulation has a unique icon:
- **Hi-Hat Closed:** ➕ (plus sign)
- **Hi-Hat Open:** ○ (circle)
- **Crash:** ✱ (asterisk)
- **Snare Accent:** › (chevron)
- **Cross-Stick:** × (X)
- And many more!

### Cell States
- **Active:** Blue/purple icon visible
- **Current Position:** Pulsing animation (follows playback)
- **Downbeat:** Slightly darker background
- **Non-Default Articulation:** Small asterisk (*) indicator

### Colors
- **Blue/Purple:** Active notes
- **Gray:** Empty cells
- **Darker:** Downbeats (beats 1, 2, 3, 4)

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `E` | Toggle Advanced Edit Mode |
| `Space` | Play/Pause |
| `1-8` | Select articulation in context menu |
| `Esc` | Close dialogs/menus |
| `Ctrl+Drag` | Paint notes |
| `Alt+Drag` | Erase notes |

---

## 💡 Tips & Tricks

### Creating a Basic Rock Beat
1. Use bulk operations: Click "Kick" → "Four on the Floor"
2. Click "Snare" → "Backbeat"
3. Click "Hi-Hat" → "Eighth Notes"
4. Press Space to play!

### Adding Variations
1. Right-click a hi-hat note on beat 4
2. Select "Open" to create a classic open hi-hat on 4

### Quick Pattern Entry
1. Enable Advanced Mode (`E` key)
2. Click cells to quickly open articulation menus
3. Use number keys to select variations
4. Disable Advanced Mode when done

### Fixing Mistakes
- Single note: Click to remove
- Multiple notes: Alt+Drag to erase
- Entire row: Use bulk "Clear All" pattern

---

## 🎵 Next Steps

Now that you understand the basics:
1. Experiment with different time signatures
2. Try different divisions (8th, 16th, triplets)
3. Create your own grooves!
4. Export your patterns (coming soon!)

Happy drumming! 🥁

