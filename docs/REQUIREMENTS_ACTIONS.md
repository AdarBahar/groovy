# Requirements Document: Export & Share Actions

## Overview

This document specifies the requirements for four core actions in Groovy:
1. **Download** - Export patterns to various file formats
2. **Print** - Print patterns as sheet music
3. **Share** - Share patterns via URL or social media
4. **Save** - Save patterns to local storage or cloud

---

## Table of Contents

1. [Download Action](#1-download-action)
2. [Print Action](#2-print-action)
3. [Share Action](#3-share-action)
4. [Save Action](#4-save-action)
5. [UI Components](#5-ui-components)
6. [Wireframes](#6-wireframes)

---

## 1. Download Action

### 1.1 Purpose
Allow users to export their drum patterns to various file formats for use in other applications.

### 1.2 Supported Formats

#### 1.2.1 MIDI (.mid)
- **Use Case**: Import into DAWs (Ableton, Logic, FL Studio, etc.)
- **Data Included**:
  - Note events (kick, snare, hi-hat mapped to GM drum map)
  - Tempo (BPM)
  - Time signature
  - Swing timing (applied to note positions)
  - Velocity values
- **Technical Details**:
  - Format: Standard MIDI File (SMF) Type 0
  - Resolution: 480 PPQ (Pulses Per Quarter Note)
  - Channel: 10 (GM Drum Channel)

#### 1.2.2 JSON (.json)
- **Use Case**: Backup, sharing, or importing into Groovy later
- **Data Included**:
  - Complete GrooveData object
  - Metadata (name, author, created date, modified date)
  - Version information
- **Technical Details**:
  - Format: JSON with schema version
  - Human-readable and editable

#### 1.2.3 Audio (.wav, .mp3)
- **Use Case**: Share as audio file, use in video editing
- **Data Included**:
  - Rendered audio of the pattern (1-4 bars)
  - Applied tempo and swing
- **Technical Details**:
  - WAV: 44.1kHz, 16-bit, stereo
  - MP3: 320kbps, 44.1kHz, stereo
  - Length: User-selectable (1, 2, 4, 8 bars)

#### 1.2.4 PDF (.pdf)
- **Use Case**: Print-ready sheet music
- **Data Included**:
  - Drum notation (standard or simplified)
  - Tempo marking
  - Time signature
  - Pattern name and metadata
- **Technical Details**:
  - Format: PDF/A (archival)
  - Page size: Letter (8.5" x 11") or A4
  - Resolution: 300 DPI

#### 1.2.5 Image (.png, .svg)
- **Use Case**: Share on social media, embed in documents
- **Data Included**:
  - Visual representation of the drum grid
  - Tempo and swing information
  - Pattern name
- **Technical Details**:
  - PNG: 1200x800px, transparent background option
  - SVG: Scalable vector format

### 1.3 User Flow

```
1. User clicks "Download" button
2. Download modal opens
3. User selects format from dropdown
4. Format-specific options appear:
   - MIDI: Velocity curve, drum mapping
   - JSON: Include metadata checkbox
   - Audio: Format (WAV/MP3), length (bars), quality
   - PDF: Notation style, page size
   - Image: Size, background (transparent/white)
5. User clicks "Download"
6. File is generated and downloaded
7. Success notification appears
8. Modal closes (or stays open for multiple downloads)
```

### 1.4 Logic Flow

```typescript
interface DownloadOptions {
  format: 'midi' | 'json' | 'wav' | 'mp3' | 'pdf' | 'png' | 'svg';
  
  // MIDI options
  velocityCurve?: 'linear' | 'exponential' | 'custom';
  drumMapping?: 'gm' | 'custom';
  
  // JSON options
  includeMetadata?: boolean;
  
  // Audio options
  audioFormat?: 'wav' | 'mp3';
  bars?: 1 | 2 | 4 | 8;
  quality?: 'low' | 'medium' | 'high';
  
  // PDF options
  notationStyle?: 'standard' | 'simplified';
  pageSize?: 'letter' | 'a4';
  
  // Image options
  imageSize?: { width: number; height: number };
  background?: 'transparent' | 'white' | 'black';
}

async function downloadPattern(
  groove: GrooveData,
  options: DownloadOptions
): Promise<void> {
  // 1. Validate options
  validateDownloadOptions(options);
  
  // 2. Generate file based on format
  const file = await generateFile(groove, options);
  
  // 3. Trigger browser download
  triggerDownload(file, getFileName(groove, options.format));
  
  // 4. Track analytics
  trackDownload(options.format);
  
  // 5. Show success notification
  showNotification('Download complete!');
}
```

### 1.5 Component Specification

```typescript
interface DownloadModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
}

interface DownloadModalState {
  selectedFormat: DownloadFormat;
  options: DownloadOptions;
  isGenerating: boolean;
  error: string | null;
}
```

---

## 2. Print Action

### 2.1 Purpose
Generate a print-ready version of the drum pattern as sheet music.

### 2.2 Print Formats

#### 2.2.1 Standard Notation
- **Description**: Traditional drum notation on a 5-line staff
- **Elements**:
  - Staff with drum clef
  - Note heads (different shapes for different drums)
  - Tempo marking
  - Time signature
  - Bar lines
  - Repeat signs

#### 2.2.2 Simplified Grid
- **Description**: Visual grid representation (like the UI)
- **Elements**:
  - Drum voice labels
  - Grid cells (filled = hit, empty = rest)
  - Beat numbers
  - Tempo and swing info

#### 2.2.3 Tablature
- **Description**: Drum tablature notation
- **Elements**:
  - Horizontal lines for each drum
  - X marks for hits
  - Numbers for subdivisions

### 2.3 Print Options

- **Page Size**: Letter, A4, Legal
- **Orientation**: Portrait, Landscape
- **Notation Style**: Standard, Simplified, Tablature
- **Include**:
  - Pattern name
  - Tempo and time signature
  - Swing percentage
  - Author name
  - Date created
  - Notes/comments
- **Layout**:
  - Bars per line (1, 2, 4, 8)
  - Repeat count (1x, 2x, 4x, etc.)
  - Page margins

### 2.4 User Flow

```
1. User clicks "Print" button
2. Print preview modal opens
3. User sees live preview of the print layout
4. User adjusts options:
   - Notation style
   - Page size and orientation
   - What to include
   - Layout settings
5. Preview updates in real-time
6. User clicks "Print"
7. Browser print dialog opens
8. User selects printer or "Save as PDF"
9. Print job is sent
10. Success notification appears
```

### 2.5 Logic Flow

```typescript
interface PrintOptions {
  pageSize: 'letter' | 'a4' | 'legal';
  orientation: 'portrait' | 'landscape';
  notationStyle: 'standard' | 'simplified' | 'tablature';
  include: {
    patternName: boolean;
    tempo: boolean;
    swing: boolean;
    author: boolean;
    date: boolean;
    notes: boolean;
  };
  layout: {
    barsPerLine: 1 | 2 | 4 | 8;
    repeatCount: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

async function printPattern(
  groove: GrooveData,
  options: PrintOptions
): Promise<void> {
  // 1. Generate print-ready HTML
  const printHTML = generatePrintHTML(groove, options);
  
  // 2. Open print preview window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printHTML);
  
  // 3. Apply print styles
  applyPrintStyles(printWindow.document);
  
  // 4. Trigger print dialog
  printWindow.print();
  
  // 5. Track analytics
  trackPrint(options.notationStyle);
}
```

### 2.6 Component Specification

```typescript
interface PrintModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
}

interface PrintModalState {
  options: PrintOptions;
  previewHTML: string;
  isGenerating: boolean;
}
```

---

## 3. Share Action

### 3.1 Purpose
Enable users to share their drum patterns with others via various channels.

### 3.2 Share Methods

#### 3.2.1 Share Link
- **Description**: Generate a unique URL that loads the pattern
- **Features**:
  - Short, shareable URL (e.g., `groovy.app/p/abc123`)
  - Pattern loads automatically when visited
  - Optional: Password protection
  - Optional: Expiration date
  - View count tracking
- **Technical Details**:
  - Pattern data stored in database or encoded in URL
  - URL shortening service integration
  - Analytics tracking

#### 3.2.2 Social Media
- **Platforms**:
  - Twitter/X
  - Facebook
  - Reddit
  - Discord
  - WhatsApp
  - Telegram
- **Shared Content**:
  - Pattern preview image
  - Pattern name and description
  - Link to open in Groovy
  - Hashtags (e.g., #drumpattern #groovy)
- **Technical Details**:
  - Open Graph meta tags
  - Twitter Card meta tags
  - Platform-specific share APIs

#### 3.2.3 Embed Code
- **Description**: HTML/iframe code to embed the pattern in websites
- **Features**:
  - Responsive iframe
  - Customizable size
  - Auto-play option
  - Show/hide controls
- **Technical Details**:
  - Generates `<iframe>` tag
  - Hosted player page
  - CORS configuration

#### 3.2.4 QR Code
- **Description**: Generate QR code that links to the pattern
- **Features**:
  - Downloadable QR code image
  - Customizable size
  - Optional logo in center
- **Use Cases**:
  - Print on flyers
  - Display at events
  - Share in person

#### 3.2.5 Email
- **Description**: Send pattern via email
- **Features**:
  - Pre-filled email with pattern link
  - Optional: Attach MIDI or PDF
  - Custom message
- **Technical Details**:
  - `mailto:` link
  - Email template

### 3.3 User Flow

```
1. User clicks "Share" button
2. Share modal opens with tabs:
   - Link
   - Social Media
   - Embed
   - QR Code
   - Email
3. User selects share method

--- Link Tab ---
4a. User sees generated link
5a. User can:
    - Copy link (one-click)
    - Set password (optional)
    - Set expiration (optional)
6a. Link is copied to clipboard
7a. Success notification appears

--- Social Media Tab ---
4b. User sees platform buttons
5b. User clicks platform (e.g., Twitter)
6b. Platform share dialog opens with pre-filled content
7b. User confirms share on platform

--- Embed Tab ---
4c. User sees embed code preview
5c. User customizes:
    - Width and height
    - Auto-play
    - Show controls
6c. User clicks "Copy Code"
7c. Code is copied to clipboard

--- QR Code Tab ---
4d. User sees generated QR code
5d. User can:
    - Download as PNG
    - Customize size
    - Add logo
6d. QR code is downloaded

--- Email Tab ---
4e. User enters recipient email
5e. User adds custom message (optional)
6e. User clicks "Send"
7e. Email client opens with pre-filled content
```

### 3.4 Logic Flow

```typescript
interface ShareOptions {
  method: 'link' | 'social' | 'embed' | 'qr' | 'email';

  // Link options
  password?: string;
  expiresAt?: Date;

  // Social options
  platform?: 'twitter' | 'facebook' | 'reddit' | 'discord' | 'whatsapp' | 'telegram';
  message?: string;
  hashtags?: string[];

  // Embed options
  width?: number;
  height?: number;
  autoPlay?: boolean;
  showControls?: boolean;

  // QR options
  qrSize?: number;
  qrLogo?: string;

  // Email options
  recipient?: string;
  subject?: string;
  body?: string;
  attachments?: ('midi' | 'pdf')[];
}

async function sharePattern(
  groove: GrooveData,
  options: ShareOptions
): Promise<ShareResult> {
  switch (options.method) {
    case 'link':
      return await generateShareLink(groove, options);

    case 'social':
      return await shareToSocial(groove, options);

    case 'embed':
      return generateEmbedCode(groove, options);

    case 'qr':
      return await generateQRCode(groove, options);

    case 'email':
      return await shareViaEmail(groove, options);
  }
}

async function generateShareLink(
  groove: GrooveData,
  options: ShareOptions
): Promise<{ url: string; shortUrl: string }> {
  // 1. Save pattern to database
  const patternId = await savePatternToDatabase(groove, {
    password: options.password,
    expiresAt: options.expiresAt,
  });

  // 2. Generate full URL
  const url = `${BASE_URL}/p/${patternId}`;

  // 3. Shorten URL
  const shortUrl = await shortenURL(url);

  // 4. Track share
  trackShare('link');

  return { url, shortUrl };
}

async function shareToSocial(
  groove: GrooveData,
  options: ShareOptions
): Promise<void> {
  // 1. Generate share link
  const { shortUrl } = await generateShareLink(groove, {});

  // 2. Generate preview image
  const previewImage = await generatePreviewImage(groove);

  // 3. Build share URL for platform
  const shareURL = buildSocialShareURL(
    options.platform!,
    shortUrl,
    options.message,
    options.hashtags
  );

  // 4. Open share dialog
  window.open(shareURL, '_blank', 'width=600,height=400');

  // 5. Track share
  trackShare(options.platform!);
}
```

### 3.5 Component Specification

```typescript
interface ShareModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
}

interface ShareModalState {
  activeTab: 'link' | 'social' | 'embed' | 'qr' | 'email';
  shareLink: string | null;
  embedCode: string | null;
  qrCodeDataURL: string | null;
  isGenerating: boolean;
  error: string | null;
}
```

---

## 4. Save Action

### 4.1 Purpose
Allow users to save their drum patterns for later use or backup.

### 4.2 Save Locations

#### 4.2.1 Browser Local Storage
- **Description**: Save to browser's localStorage
- **Features**:
  - Instant save (no network required)
  - Persists across sessions
  - Limited to ~5-10MB
  - Private to the browser
- **Use Cases**:
  - Quick saves during editing
  - Auto-save functionality
  - Offline work
- **Technical Details**:
  - Key: `groovy_pattern_${id}`
  - Value: JSON-serialized GrooveData
  - Compression: LZ-string for larger patterns

#### 4.2.2 Cloud Storage (User Account)
- **Description**: Save to user's cloud account
- **Features**:
  - Unlimited patterns (within quota)
  - Sync across devices
  - Version history
  - Sharing and collaboration
  - Backup and restore
- **Use Cases**:
  - Professional users
  - Multi-device workflow
  - Team collaboration
- **Technical Details**:
  - Backend: Firebase, Supabase, or custom API
  - Authentication: OAuth (Google, GitHub, etc.)
  - Storage: Database + object storage for audio

#### 4.2.3 File System (Download)
- **Description**: Save as file to user's computer
- **Features**:
  - Full control over file location
  - No account required
  - Can be backed up manually
  - Portable
- **Use Cases**:
  - Backup
  - Sharing via file transfer
  - Archival
- **Technical Details**:
  - Format: .groovy (JSON)
  - File System Access API (Chrome)
  - Fallback: Download as file

### 4.3 Save Features

#### 4.3.1 Auto-Save
- **Description**: Automatically save changes periodically
- **Frequency**: Every 30 seconds (configurable)
- **Location**: Browser localStorage
- **Indicator**: "Saved" / "Saving..." / "Unsaved changes"

#### 4.3.2 Version History
- **Description**: Keep track of previous versions
- **Features**:
  - Timestamp for each version
  - Diff view (what changed)
  - Restore previous version
  - Delete old versions
- **Limit**: Last 10 versions (configurable)

#### 4.3.3 Pattern Library
- **Description**: Organize saved patterns
- **Features**:
  - Folders/tags
  - Search and filter
  - Sort by date, name, tempo
  - Bulk operations (delete, export)
  - Favorites/starred

### 4.4 User Flow

```
--- Quick Save (Ctrl+S) ---
1. User presses Ctrl+S or clicks "Save"
2. If pattern has no name:
   - Prompt for name
3. Save to localStorage
4. Show "Saved" indicator
5. Update last modified timestamp

--- Save to Cloud ---
1. User clicks "Save to Cloud"
2. If not logged in:
   - Show login modal
   - User logs in
3. If pattern is new:
   - Prompt for name and folder
4. Save to cloud
5. Show success notification
6. Update sync status

--- Save As ---
1. User clicks "Save As"
2. Modal opens with options:
   - Name
   - Location (localStorage, cloud, file)
   - Folder (if cloud)
3. User fills in details
4. User clicks "Save"
5. Pattern is saved
6. Success notification appears

--- Pattern Library ---
1. User clicks "My Patterns"
2. Library modal opens
3. User sees list of saved patterns
4. User can:
   - Search/filter
   - Open pattern
   - Rename
   - Delete
   - Export
   - Duplicate
5. User selects action
6. Action is performed
```

### 4.5 Logic Flow

```typescript
interface SaveOptions {
  location: 'localStorage' | 'cloud' | 'file';
  name?: string;
  folder?: string;
  overwrite?: boolean;
}

interface SavedPattern {
  id: string;
  name: string;
  groove: GrooveData;
  createdAt: Date;
  modifiedAt: Date;
  version: number;
  folder?: string;
  tags?: string[];
}

async function savePattern(
  groove: GrooveData,
  options: SaveOptions
): Promise<SavedPattern> {
  // 1. Validate pattern
  validateGrooveData(groove);

  // 2. Generate or use existing ID
  const id = groove.id || generateId();

  // 3. Create saved pattern object
  const savedPattern: SavedPattern = {
    id,
    name: options.name || `Untitled ${Date.now()}`,
    groove,
    createdAt: groove.createdAt || new Date(),
    modifiedAt: new Date(),
    version: (groove.version || 0) + 1,
    folder: options.folder,
  };

  // 4. Save based on location
  switch (options.location) {
    case 'localStorage':
      await saveToLocalStorage(savedPattern);
      break;

    case 'cloud':
      await saveToCloud(savedPattern);
      break;

    case 'file':
      await saveToFile(savedPattern);
      break;
  }

  // 5. Update auto-save timestamp
  updateAutoSaveTimestamp();

  // 6. Track save
  trackSave(options.location);

  return savedPattern;
}

async function saveToLocalStorage(pattern: SavedPattern): Promise<void> {
  const key = `groovy_pattern_${pattern.id}`;
  const value = JSON.stringify(pattern);

  // Compress if large
  const compressed = value.length > 1000
    ? LZString.compress(value)
    : value;

  localStorage.setItem(key, compressed);

  // Update pattern list
  updatePatternList(pattern);
}

async function saveToCloud(pattern: SavedPattern): Promise<void> {
  // 1. Check authentication
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // 2. Save to database
  await db.collection('patterns').doc(pattern.id).set({
    ...pattern,
    userId: user.id,
  });

  // 3. Update sync status
  updateSyncStatus('synced');
}

async function saveToFile(pattern: SavedPattern): Promise<void> {
  const filename = `${pattern.name}.groovy`;
  const content = JSON.stringify(pattern, null, 2);
  const blob = new Blob([content], { type: 'application/json' });

  // Use File System Access API if available
  if ('showSaveFilePicker' in window) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: 'Groovy Pattern',
        accept: { 'application/json': ['.groovy'] },
      }],
    });

    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } else {
    // Fallback: trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Auto-save functionality
let autoSaveTimer: NodeJS.Timeout | null = null;

function enableAutoSave(groove: GrooveData, interval: number = 30000) {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }

  autoSaveTimer = setInterval(async () => {
    if (hasUnsavedChanges()) {
      await savePattern(groove, { location: 'localStorage' });
      showNotification('Auto-saved', { duration: 2000 });
    }
  }, interval);
}

function disableAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
}
```

### 4.6 Component Specification

```typescript
interface SaveModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'saveAs';
}

interface SaveModalState {
  name: string;
  location: 'localStorage' | 'cloud' | 'file';
  folder: string;
  isSaving: boolean;
  error: string | null;
}

interface PatternLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPattern: (pattern: SavedPattern) => void;
}

interface PatternLibraryState {
  patterns: SavedPattern[];
  searchQuery: string;
  sortBy: 'name' | 'date' | 'tempo';
  filterFolder: string | null;
  selectedPatterns: string[];
  isLoading: boolean;
}
```

---

## 5. UI Components

### 5.1 Action Bar Component

The main action bar that contains all four action buttons.

```typescript
interface ActionBarProps {
  groove: GrooveData;
  hasUnsavedChanges: boolean;
  onDownload: () => void;
  onPrint: () => void;
  onShare: () => void;
  onSave: () => void;
}
```

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  [💾 Save]  [⬇️ Download]  [🖨️ Print]  [🔗 Share]      │
└─────────────────────────────────────────────────────────┘
```

**States**:
- **Normal**: All buttons enabled
- **Unsaved Changes**: Save button highlighted with indicator
- **Saving**: Save button shows spinner
- **No Pattern**: All buttons disabled except Save

### 5.2 Download Modal Component

```typescript
interface DownloadModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
}
```

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Download Pattern                                    [×] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Format:  [MIDI ▼]                                       │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ MIDI Options                                     │   │
│  │                                                   │   │
│  │ Velocity Curve:  [Linear ▼]                     │   │
│  │ Drum Mapping:    [General MIDI ▼]               │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Preview:                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📄 my-pattern.mid                                │   │
│  │ Size: 2.4 KB                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│                          [Cancel]  [Download]            │
└─────────────────────────────────────────────────────────┘
```

**Format-Specific Options**:

**MIDI**:
- Velocity curve dropdown
- Drum mapping dropdown
- Include tempo checkbox

**JSON**:
- Include metadata checkbox
- Pretty print checkbox

**Audio (WAV/MP3)**:
- Format toggle (WAV/MP3)
- Length slider (1-8 bars)
- Quality dropdown (Low/Medium/High)

**PDF**:
- Notation style (Standard/Simplified/Tablature)
- Page size (Letter/A4)
- Include metadata checkboxes

**Image (PNG/SVG)**:
- Size presets (Social/HD/4K/Custom)
- Background color picker
- Transparent background checkbox

### 5.3 Print Modal Component

```typescript
interface PrintModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
}
```

**Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Print Pattern                                               [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Options         │  │ Preview                             │  │
│  │                 │  │                                     │  │
│  │ Notation:       │  │  ┌───────────────────────────────┐ │  │
│  │ [Standard ▼]    │  │  │ 🎵 My Drum Pattern            │ │  │
│  │                 │  │  │ Tempo: 120 BPM  4/4           │ │  │
│  │ Page Size:      │  │  │                               │ │  │
│  │ [Letter ▼]      │  │  │ ♩ = 120                       │ │  │
│  │                 │  │  │ ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐ │ │  │
│  │ Orientation:    │  │  │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │  │
│  │ ○ Portrait      │  │  │ └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘ │ │  │
│  │ ● Landscape     │  │  │                               │ │  │
│  │                 │  │  └───────────────────────────────┘ │  │
│  │ Include:        │  │                                     │  │
│  │ ☑ Pattern name  │  │  [Zoom: 100% ▼]                    │  │
│  │ ☑ Tempo         │  │                                     │  │
│  │ ☑ Time sig      │  └─────────────────────────────────────┘  │
│  │ ☐ Author        │                                           │
│  │ ☐ Date          │                                           │
│  │                 │                                           │
│  │ Bars per line:  │                                           │
│  │ [4 ▼]           │                                           │
│  │                 │                                           │
│  └─────────────────┘                                           │
│                                                                   │
│                                    [Cancel]  [Print]             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Share Modal Component

```typescript
interface ShareModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
}
```

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Share Pattern                                       [×] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  [Link] [Social] [Embed] [QR Code] [Email]              │
│  ─────                                                    │
│                                                           │
│  Share Link                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ https://groovy.app/p/abc123                  [📋] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Options:                                                │
│  ☐ Password protect                                      │
│  ☐ Set expiration date                                   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👁️ 0 views                                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│                                    [Close]  [Copy Link]  │
└─────────────────────────────────────────────────────────┘
```

**Social Tab**:
```
┌─────────────────────────────────────────────────────────┐
│  Share on Social Media                                   │
│                                                           │
│  [🐦 Twitter]  [📘 Facebook]  [🔴 Reddit]               │
│  [💬 Discord]  [💚 WhatsApp]  [✈️ Telegram]             │
│                                                           │
│  Preview:                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🥁 Check out my drum pattern!                    │   │
│  │                                                   │   │
│  │ [Pattern Preview Image]                          │   │
│  │                                                   │   │
│  │ Tempo: 120 BPM | Swing: 50%                      │   │
│  │ https://groovy.app/p/abc123                      │   │
│  │                                                   │   │
│  │ #drumpattern #groovy #drums                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Embed Tab**:
```
┌─────────────────────────────────────────────────────────┐
│  Embed Code                                              │
│                                                           │
│  Size:  Width: [600] px  Height: [400] px               │
│                                                           │
│  ☑ Auto-play                                             │
│  ☑ Show controls                                         │
│  ☐ Loop                                                  │
│                                                           │
│  Code:                                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ <iframe src="https://groovy.app/embed/abc123"   │   │
│  │   width="600" height="400"                       │   │
│  │   frameborder="0" allowfullscreen>              │   │
│  │ </iframe>                                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Preview:                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Embedded Player Preview]                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│                                         [Copy Code]      │
└─────────────────────────────────────────────────────────┘
```

**QR Code Tab**:
```
┌─────────────────────────────────────────────────────────┐
│  QR Code                                                 │
│                                                           │
│  Size:  [Medium ▼]  (Small/Medium/Large/Custom)         │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                   │   │
│  │         ▄▄▄▄▄▄▄  ▄  ▄▄  ▄▄▄▄▄▄▄                 │   │
│  │         █ ▄▄▄ █ ▄█▀ ▀▄ █ ▄▄▄ █                 │   │
│  │         █ ███ █ ▀▄█▀▄█ █ ███ █                 │   │
│  │         █▄▄▄▄▄█ ▄ █ ▄ █ █▄▄▄▄▄█                 │   │
│  │         ▄▄▄▄  ▄ ▄▀▄█▀▄▄  ▄▄▄ ▄▄                 │   │
│  │         [QR Code Image]                          │   │
│  │                                                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Scan to open pattern in Groovy                         │
│                                                           │
│                                    [Download PNG]        │
└─────────────────────────────────────────────────────────┘
```

### 5.5 Save Modal Component

```typescript
interface SaveModalProps {
  groove: GrooveData;
  isOpen: boolean;
  onClose: () => void;
  mode: 'save' | 'saveAs';
}
```

**Layout (Save As)**:
```
┌─────────────────────────────────────────────────────────┐
│  Save Pattern As                                     [×] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Pattern Name:                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ My Awesome Drum Pattern                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Save to:                                                │
│  ● Browser (Local Storage)                              │
│  ○ Cloud (Sync across devices) [Sign In Required]       │
│  ○ File (Download to computer)                          │
│                                                           │
│  Folder:  [Uncategorized ▼]                             │
│                                                           │
│  Tags:                                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ rock, basic, 4/4                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ☑ Create version history                               │
│                                                           │
│                                    [Cancel]  [Save]      │
└─────────────────────────────────────────────────────────┘
```

### 5.6 Pattern Library Component

```typescript
interface PatternLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPattern: (pattern: SavedPattern) => void;
}
```

**Layout**:
```
┌───────────────────────────────────────────────────────────────────┐
│  My Patterns                                                   [×] │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [🔍 Search patterns...]                    [+ New]  [⚙️ Settings] │
│                                                                     │
│  ┌─────────────┐  ┌───────────────────────────────────────────┐  │
│  │ Folders     │  │ Sort by: [Date ▼]  View: [Grid] [List]   │  │
│  │             │  ├───────────────────────────────────────────┤  │
│  │ 📁 All (12) │  │                                           │  │
│  │ 📁 Rock (5) │  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │  │
│  │ 📁 Jazz (3) │  │ │ 🥁   │ │ 🥁   │ │ 🥁   │ │ 🥁   │     │  │
│  │ 📁 Funk (4) │  │ │Basic │ │Disco │ │Funk  │ │Jazz  │     │  │
│  │ ⭐ Starred  │  │ │Rock  │ │Beat  │ │Groove│ │Swing │     │  │
│  │             │  │ │      │ │      │ │      │ │      │     │  │
│  │ [+ New]     │  │ │120BPM│ │128BPM│ │110BPM│ │140BPM│     │  │
│  │             │  │ │4/4   │ │4/4   │ │4/4   │ │4/4   │     │  │
│  └─────────────┘  │ │2d ago│ │1w ago│ │3d ago│ │5d ago│     │  │
│                    │ └──────┘ └──────┘ └──────┘ └──────┘     │  │
│                    │                                           │  │
│                    │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │  │
│                    │ │ 🥁   │ │ 🥁   │ │ 🥁   │ │ 🥁   │     │  │
│                    │ │...   │ │...   │ │...   │ │...   │     │  │
│                    │ └──────┘ └──────┘ └──────┘ └──────┘     │  │
│                    │                                           │  │
│                    └───────────────────────────────────────────┘  │
│                                                                     │
│  12 patterns • 2.4 MB used                                         │
└───────────────────────────────────────────────────────────────────┘
```

**Pattern Card (Hover State)**:
```
┌──────────────┐
│ 🥁           │
│ Basic Rock   │
│              │
│ 120 BPM      │
│ 4/4          │
│ 2 days ago   │
│              │
│ [▶️] [✏️] [⋮] │  ← Actions appear on hover
└──────────────┘
```

**Pattern Context Menu** (on ⋮ click):
```
┌─────────────────┐
│ ▶️ Open         │
│ ✏️ Rename       │
│ 📋 Duplicate    │
│ ⬇️ Download     │
│ 🔗 Share        │
│ ⭐ Add to Starred│
│ 🗑️ Delete       │
└─────────────────┘
```

---

## 6. Wireframes

### 6.1 Main Application with Action Bar

```
┌─────────────────────────────────────────────────────────────────┐
│  Groovy 🥁                                    [💾] [⬇️] [🖨️] [🔗] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Pattern: My Drum Pattern                    [My Patterns ▼]    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Tempo: 120 BPM    Swing: 50%    Time: 4/4              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  [Drum Grid Component]                                   │   │
│  │                                                           │   │
│  │  HH  │█│ │█│ │█│ │█│ │█│ │█│ │█│ │█│                   │   │
│  │  SN  │ │ │ │ │█│ │ │ │ │ │ │ │█│ │ │                   │   │
│  │  KK  │█│ │ │ │ │ │ │ │█│ │ │ │ │ │ │                   │   │
│  │                                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  [◀️ Prev]  [▶️ Play]  [⏸️ Pause]  [⏹️ Stop]  [▶️▶️ Next]        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Download Flow Wireframe

```
Step 1: Click Download
┌─────────────────┐
│ [⬇️ Download]   │ ← User clicks
└─────────────────┘

Step 2: Modal Opens
┌─────────────────────────────────────┐
│  Download Pattern                [×]│
│                                     │
│  Format: [MIDI ▼]                  │
│                                     │
│  [Format-specific options]         │
│                                     │
│  [Cancel]  [Download]              │
└─────────────────────────────────────┘

Step 3: Select Format
┌─────────────────────────────────────┐
│  Format: [MIDI ▼]                  │
│          ├─ MIDI (.mid)            │
│          ├─ JSON (.json)           │
│          ├─ Audio (WAV/MP3)        │
│          ├─ PDF (.pdf)             │
│          └─ Image (PNG/SVG)        │
└─────────────────────────────────────┘

Step 4: Configure Options
┌─────────────────────────────────────┐
│  MIDI Options                       │
│  Velocity: [Linear ▼]              │
│  Mapping:  [GM ▼]                  │
└─────────────────────────────────────┘

Step 5: Download
┌─────────────────────────────────────┐
│  [Download] ← User clicks           │
└─────────────────────────────────────┘

Step 6: Success
┌─────────────────────────────────────┐
│  ✅ Downloaded: my-pattern.mid      │
└─────────────────────────────────────┘
```

### 6.3 Share Flow Wireframe

```
Step 1: Click Share
┌─────────────────┐
│ [🔗 Share]      │ ← User clicks
└─────────────────┘

Step 2: Modal Opens (Link Tab)
┌─────────────────────────────────────────┐
│  Share Pattern                       [×]│
│  [Link] [Social] [Embed] [QR] [Email]  │
│  ─────                                  │
│                                         │
│  ┌───────────────────────────────┐    │
│  │ https://groovy.app/p/abc123 📋│    │
│  └───────────────────────────────┘    │
│                                         │
│  ☐ Password  ☐ Expiration              │
│                                         │
│  [Copy Link]                            │
└─────────────────────────────────────────┘

Step 3: Switch to Social Tab
┌─────────────────────────────────────────┐
│  [Link] [Social] [Embed] [QR] [Email]  │
│         ───────                         │
│                                         │
│  [🐦] [📘] [🔴] [💬] [💚] [✈️]         │
│                                         │
│  Preview:                               │
│  ┌───────────────────────────────┐    │
│  │ 🥁 Check out my pattern!      │    │
│  │ [Image]                        │    │
│  │ https://groovy.app/p/abc123   │    │
│  └───────────────────────────────┘    │
└─────────────────────────────────────────┘

Step 4: Click Platform
┌─────────────────┐
│ [🐦 Twitter]    │ ← User clicks
└─────────────────┘

Step 5: Platform Share Dialog Opens
┌─────────────────────────────────────────┐
│  Share on Twitter                       │
│                                         │
│  🥁 Check out my drum pattern!         │
│                                         │
│  [Pattern Preview Image]                │
│                                         │
│  Tempo: 120 BPM | Swing: 50%           │
│  https://groovy.app/p/abc123           │
│                                         │
│  #drumpattern #groovy #drums           │
│                                         │
│  [Cancel]  [Tweet]                     │
└─────────────────────────────────────────┘
```

### 6.4 Save Flow Wireframe

```
Step 1: Make Changes
┌─────────────────────────────────────┐
│  Pattern: My Pattern  ⚠️ Unsaved    │
│  [💾 Save*]                         │ ← Indicator
└─────────────────────────────────────┘

Step 2: Click Save (First Time)
┌─────────────────────────────────────┐
│  Save Pattern As                 [×]│
│                                     │
│  Name: [My Awesome Pattern]        │
│                                     │
│  Save to:                           │
│  ● Browser                          │
│  ○ Cloud                            │
│  ○ File                             │
│                                     │
│  [Cancel]  [Save]                  │
└─────────────────────────────────────┘

Step 3: Save Success
┌─────────────────────────────────────┐
│  ✅ Saved to Browser                │
└─────────────────────────────────────┘

Step 4: Subsequent Saves (Ctrl+S)
┌─────────────────────────────────────┐
│  Pattern: My Pattern  ✅ Saved      │
└─────────────────────────────────────┘

Step 5: Access Pattern Library
┌─────────────────┐
│ [My Patterns ▼] │ ← User clicks
└─────────────────┘

Step 6: Library Opens
┌───────────────────────────────────────┐
│  My Patterns                       [×]│
│                                       │
│  [🔍 Search...]        [+ New]       │
│                                       │
│  ┌──────┐ ┌──────┐ ┌──────┐         │
│  │ 🥁   │ │ 🥁   │ │ 🥁   │         │
│  │Basic │ │Disco │ │Funk  │         │
│  │Rock  │ │Beat  │ │Groove│         │
│  └──────┘ └──────┘ └──────┘         │
│                                       │
│  12 patterns                          │
└───────────────────────────────────────┘
```

### 6.5 Print Flow Wireframe

```
Step 1: Click Print
┌─────────────────┐
│ [🖨️ Print]      │ ← User clicks
└─────────────────┘

Step 2: Print Modal Opens
┌─────────────────────────────────────────────────┐
│  Print Pattern                               [×]│
│                                                 │
│  ┌─────────┐  ┌─────────────────────────────┐ │
│  │Options  │  │ Preview                     │ │
│  │         │  │ ┌─────────────────────────┐ │ │
│  │Style:   │  │ │ 🎵 My Pattern           │ │ │
│  │[Std ▼]  │  │ │ ♩ = 120  4/4            │ │ │
│  │         │  │ │ ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐ │ │ │
│  │Page:    │  │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │
│  │[A4 ▼]   │  │ │ └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘ │ │ │
│  │         │  │ └─────────────────────────┘ │ │
│  │Include: │  │                             │ │
│  │☑ Name   │  │ [Zoom: 100% ▼]             │ │
│  │☑ Tempo  │  └─────────────────────────────┘ │
│  └─────────┘                                   │
│                                                 │
│                          [Cancel]  [Print]     │
└─────────────────────────────────────────────────┘

Step 3: Adjust Options
┌─────────────┐
│ Style:      │
│ [Standard ▼]│
│ ├─ Standard │ ← User selects
│ ├─ Simplified│
│ └─ Tablature│
└─────────────┘

Step 4: Preview Updates
┌─────────────────────────────┐
│ Preview                     │
│ ┌─────────────────────────┐ │
│ │ [Updated Preview]       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘

Step 5: Click Print
┌─────────────┐
│ [Print]     │ ← User clicks
└─────────────┘

Step 6: Browser Print Dialog
┌─────────────────────────────────────┐
│  Print                              │
│                                     │
│  Destination: [Printer ▼]          │
│  Pages: ● All  ○ Custom            │
│  Copies: [1]                        │
│                                     │
│  [Cancel]  [Print]                 │
└─────────────────────────────────────┘
```

---

## 7. Technical Implementation Notes

### 7.1 File Generation Libraries

- **MIDI**: `@tonejs/midi` or `jsmidgen`
- **PDF**: `jsPDF` or `pdfmake`
- **Audio**: Web Audio API + `lamejs` (for MP3)
- **Image**: HTML Canvas API or `html2canvas`
- **QR Code**: `qrcode` or `qrcode.react`

### 7.2 Share Link Implementation

**Option 1: Database Storage**
- Store pattern in database with unique ID
- Generate short URL
- Pros: Full control, analytics, password protection
- Cons: Requires backend, storage costs

**Option 2: URL Encoding**
- Encode pattern data in URL hash
- Use LZ-string compression
- Pros: No backend needed, instant
- Cons: Long URLs, no analytics

**Recommended**: Hybrid approach
- Small patterns: URL encoding
- Large patterns: Database storage
- Fallback to URL encoding if database unavailable

### 7.3 Cloud Storage Options

- **Firebase**: Easy setup, real-time sync
- **Supabase**: Open-source, PostgreSQL
- **Custom API**: Full control, more work

### 7.4 Auto-Save Strategy

```typescript
// Debounced auto-save
const debouncedSave = debounce(async (groove: GrooveData) => {
  await savePattern(groove, { location: 'localStorage' });
}, 30000); // 30 seconds

// Call on every change
function handleGrooveChange(groove: GrooveData) {
  setHasUnsavedChanges(true);
  debouncedSave(groove);
}
```

---

## 8. Success Metrics

### 8.1 Download Action
- Number of downloads per format
- Most popular format
- Download completion rate
- Error rate

### 8.2 Print Action
- Number of prints
- Most popular notation style
- Print completion rate

### 8.3 Share Action
- Number of shares per method
- Most popular platform
- Share link click-through rate
- Pattern views from shares

### 8.4 Save Action
- Number of saves per location
- Auto-save success rate
- Cloud sync success rate
- Pattern library usage

---

## 9. Future Enhancements

### 9.1 Download
- Export to more formats (MusicXML, Guitar Pro)
- Batch export multiple patterns
- Export with custom drum samples

### 9.2 Print
- Multi-page layouts
- Custom headers/footers
- Watermarks

### 9.3 Share
- Collaborative editing
- Pattern remixing
- Social features (likes, comments)
- Pattern marketplace

### 9.4 Save
- Cloud backup automation
- Pattern versioning with diff view
- Import from other apps
- Sync with DAWs

---

**End of Requirements Document**


