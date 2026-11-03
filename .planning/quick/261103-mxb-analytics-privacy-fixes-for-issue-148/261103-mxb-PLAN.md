---
phase: quick-261103-mxb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/analytics.ts
  - src/utils/analytics.test.ts
  - src/pages/ProductionPage.tsx
  - src/components/production/MIDISettingsModal.tsx
  - src/hooks/useMIDIInput.ts
  - src/hooks/useMIDIInput.test.tsx
  - src/App.tsx
  - src/components/ErrorBoundary.tsx
  - src/components/production/AboutModal.tsx
  - src/components/production/ShareModal.tsx
  - src/components/production/ShareModal.test.tsx
autonomous: true
requirements: [ISSUE-148]

must_haves:
  truths:
    - "Saved, loaded and deleted groove events send has_name (boolean) and never the user groove name"
    - "MIDI device connected/disconnected/selected events send device_name only, never device_id"
    - "The 'Groovy Share Link Clicked' event sends only source and embed (no document.referrer)"
    - "ErrorBoundary reports errors through analytics.ts, honours isAnalyticsEnabled(), and sends error.name, not error.message"
    - "Analytics is enabled only when hostname equals the domain or ends with '.' + domain"
    - "A user can turn off 'Share anonymous usage statistics' in the About modal; events stop at once without reload, and the choice persists in localStorage 'groovy-analytics-disabled'"
    - "ShareModal tells the user that Shorten URL sends the link to go.bahar.co.il"
  artifacts:
    - path: "src/utils/analytics.ts"
      provides: "isAnalyticsHost, isAnalyticsOptedOut, setAnalyticsOptOut, trackError exports; privacy-safe payloads"
      exports: ["isAnalyticsHost", "isAnalyticsOptedOut", "setAnalyticsOptOut", "trackError"]
    - path: "src/utils/analytics.test.ts"
      provides: "Vitest coverage for host helper, opt-out, payload privacy"
    - path: "src/components/production/AboutModal.tsx"
      provides: "Usage statistics opt-out toggle"
      contains: "Share anonymous usage statistics"
  key_links:
    - from: "src/components/production/AboutModal.tsx"
      to: "setAnalyticsOptOut"
      via: "checkbox onChange"
      pattern: "setAnalyticsOptOut\\("
    - from: "src/components/ErrorBoundary.tsx"
      to: "trackError in analytics.ts"
      via: "import from ../utils/analytics"
      pattern: "trackError\\("
    - from: "isAnalyticsEnabled / loadAnalyticsScript"
      to: "isAnalyticsOptedOut"
      via: "early return"
      pattern: "isAnalyticsOptedOut\\(\\)"
---

<objective>
Fix the analytics privacy problems in GitHub issue #148 (AdarBahar/groovy). Remove personal data from event payloads. Make the domain check strict. Add a persistent user opt-out with a UI toggle. Add a disclosure for the URL shortener. Add unit tests.

Purpose: Analytics must not send user-typed names, device IDs, referrer URLs or error messages. Users must be able to turn analytics off.
Output: Updated analytics.ts and callers, new analytics.test.ts, About modal toggle, ShareModal disclosure line.

The scope is fixed by the user. Do not revisit it. Out of scope: Amplitude Session Replay. Do not touch public/.htaccess.
</objective>

<execution_context>
@/Users/adar/Code/groovy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adar/Code/groovy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@src/utils/analytics.ts
@src/utils/safeStorage.ts

Optional background: run `gh issue view 148 --comments` for the issue text and review comment.

<interfaces>
From src/utils/safeStorage.ts (use these, do not call localStorage directly):
- export function safeGetItem(key: string): string | null
- export function safeSetItem(key: string, value: string): StorageResult
- export function safeRemoveItem(key: string): StorageResult
(safeStorage.ts imports only ./logger, so analytics.ts stays React-free.)

Current analytics.ts facts:
- const ANALYTICS_DOMAIN = import.meta.env.VITE_ANALYTICS_DOMAIN || 'bahar.co.il' (read at module load)
- private isAnalyticsEnabled() uses hostname.endsWith(ANALYTICS_DOMAIN) (bug: matches notbahar.co.il)
- loadAnalyticsScript() runs at module import
- private `analytics` object has track / trackButtonClick / trackError, each gated by isAnalyticsEnabled()
- window.BaharAnalytics.trackError(errorType: string, errorMessage: string, location?: string)

Current callers to change:
- src/pages/ProductionPage.tsx:339 analytics.trackGrooveSave(name, !!existingId)
- src/pages/ProductionPage.tsx:344 analytics.trackGrooveLoad(saved.name)
- src/pages/ProductionPage.tsx:352 if (groove) analytics.trackGrooveDelete(groove.name)
- src/components/production/MIDISettingsModal.tsx:58 trackMIDIDeviceConnected(selectedDevice.name, selectedDevice.id)
- src/components/production/MIDISettingsModal.tsx:92 trackMIDIDeviceSelected(selectedDevice.name, selectedDevice.id)
- src/hooks/useMIDIInput.ts:140 trackMIDIDeviceDisconnected(disconnectedDevice.name, disconnectedDevice.id)
- src/hooks/useMIDIInput.test.tsx:65 mock `trackMIDIDeviceDisconnected: vi.fn()` (signature-agnostic; change only if a test asserts the id argument)
- src/App.tsx:61-65 track('Groovy Share Link Clicked', { source, referrer, embed })
- src/components/ErrorBoundary.tsx:51-57 direct window.BaharAnalytics.trackError(..., error.message, componentStack)
- src/components/production/AboutModal.tsx: debug toggle on "Adar Bahar" button in the footer block
- src/components/production/ShareModal.tsx:267-279 "Shorten URL" button (handleShortenURL)

Test environment: vitest.config.ts uses jsdom, globals, setup file src/test/setup.ts (stubs localStorage). jsdom hostname is 'localhost'.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Harden analytics.ts (host check, opt-out, payloads, trackError) and add analytics.test.ts</name>
  <files>src/utils/analytics.ts, src/utils/analytics.test.ts</files>
  <behavior>
    - isAnalyticsHost('bahar.co.il', 'bahar.co.il') is true; isAnalyticsHost('www.bahar.co.il', 'bahar.co.il') is true
    - isAnalyticsHost('notbahar.co.il', 'bahar.co.il'), isAnalyticsHost('bahar.co.il.evil.com', 'bahar.co.il'), isAnalyticsHost('localhost', 'bahar.co.il') are false
    - setAnalyticsOptOut(true) writes 'true' to key 'groovy-analytics-disabled'; isAnalyticsOptedOut() then returns true; setAnalyticsOptOut(false) removes the key and isAnalyticsOptedOut() returns false
    - When opted out, trackPlay / trackGrooveSave / trackError do not call any window.BaharAnalytics method
    - trackGrooveSave(true, false) calls BaharAnalytics.track('Groovy Groove Saved', { has_name: true, is_overwrite: false }); the payload has no groove_name key
    - trackMIDIDeviceConnected('TD-17') calls track with { device_name: 'TD-17' } and no device_id key
    - trackError('React Error Boundary', 'TypeError', 'stack') calls BaharAnalytics.trackError with those three values when enabled
  </behavior>
  <action>
In src/utils/analytics.ts:
1. Per scope item 6, add and export a pure function isAnalyticsHost(hostname: string, domain: string): boolean. It returns true when hostname === domain or hostname.endsWith('.' + domain). Make it case-insensitive by lowercasing both sides. Rewrite private isAnalyticsEnabled() to return false when window is undefined, false when isAnalyticsOptedOut() is true, else isAnalyticsHost(window.location.hostname, ANALYTICS_DOMAIN). Read opt-out on every call (no caching), so the toggle works without reload.
2. Per scope item 7, add const ANALYTICS_OPT_OUT_KEY = 'groovy-analytics-disabled'. Export isAnalyticsOptedOut(): boolean, which returns safeGetItem(ANALYTICS_OPT_OUT_KEY) === 'true'. Export setAnalyticsOptOut(disabled: boolean): void, which calls safeSetItem(key, 'true') when disabled and safeRemoveItem(key) when enabled. Import these from './safeStorage'. loadAnalyticsScript() already returns early through isAnalyticsEnabled(), so it honours opt-out too; keep that early return. Do not remove an already-loaded script.
3. Per scope item 1, change signatures to trackGrooveSave(hasName: boolean, isOverwrite: boolean), trackGrooveLoad(hasName: boolean), trackGrooveDelete(hasName: boolean). Payloads become { has_name, is_overwrite } and { has_name }. Leave trackLibraryGrooveLoad / trackLibraryGrooveSave / trackLibraryStyleSelect unchanged (built-in library names).
4. Per scope item 2, change trackMIDIDeviceConnected / Disconnected / Selected to take only (deviceName: string) and send only { device_name }.
5. Per scope item 3, delete trackMIDIHit and trackMIDITimingSessionEnd. First run grep -rn "trackMIDIHit\|trackMIDITimingSessionEnd" src and confirm that only analytics.ts contains them.
6. Per scope item 5, export trackError(errorType: string, errorName: string, location: string): void that calls the private analytics.trackError wrapper (which is gated by isAnalyticsEnabled()).
7. Update the file header comment so it states the strict host rule and the opt-out key. Add explicit return types (: void) to every exported function that lacks one. Write all comments in ASD-STE100 style (short, active, no contractions). Do not import React.

Create src/utils/analytics.test.ts (header comment "/** Tests for analytics */"). ANALYTICS_DOMAIN is read at module load and jsdom hostname is 'localhost'. So for enabled-path tests: call vi.resetModules(), vi.stubEnv('VITE_ANALYTICS_DOMAIN', 'localhost'), then await import('./analytics'). Stub window.BaharAnalytics with an object of vi.fn() for track, trackButtonClick, trackError (and the other interface members). In beforeEach clear localStorage key 'groovy-analytics-disabled'; in afterEach call vi.unstubAllEnvs() and delete window.BaharAnalytics. Use a plain static import or the default env for the pure isAnalyticsHost tests. Cover every case in the behavior block. Also assert one negative case: with the default domain (no env stub) on 'localhost', trackPlay makes no call.
  </action>
  <verify>
    <automated>cd /Users/adar/Code/groovy && npx vitest run src/utils/analytics.test.ts && grep -c "trackMIDIHit\|trackMIDITimingSessionEnd\|device_id\|groove_name: grooveName, is_overwrite" src/utils/analytics.ts | grep -x 0</automated>
  </verify>
  <done>analytics.test.ts passes. analytics.ts exports isAnalyticsHost, isAnalyticsOptedOut, setAnalyticsOptOut, trackError. No device_id, no user groove_name, no trackMIDIHit or trackMIDITimingSessionEnd remain in analytics.ts.</done>
</task>

<task type="auto">
  <name>Task 2: Update callers (ProductionPage, MIDI, App referrer, ErrorBoundary)</name>
  <files>src/pages/ProductionPage.tsx, src/components/production/MIDISettingsModal.tsx, src/hooks/useMIDIInput.ts, src/hooks/useMIDIInput.test.tsx, src/App.tsx, src/components/ErrorBoundary.tsx</files>
  <action>
1. Per scope item 1, in src/pages/ProductionPage.tsx: line ~339 becomes analytics.trackGrooveSave(name.trim().length > 0, !!existingId). Line ~344 becomes analytics.trackGrooveLoad(saved.name.trim().length > 0). Line ~352 becomes if (groove) analytics.trackGrooveDelete(groove.name.trim().length > 0). Check the type of each name variable first; if one can be null or undefined, use a null-safe form such as Boolean(x && x.trim()).
2. Per scope item 2, in src/components/production/MIDISettingsModal.tsx lines ~58 and ~92 pass only selectedDevice.name. In src/hooks/useMIDIInput.ts line ~140 pass only disconnectedDevice.name. In src/hooks/useMIDIInput.test.tsx change the mock only if an assertion checks the id argument (grep for trackMIDIDeviceDisconnected).
3. Per scope item 4, in src/App.tsx: keep the local referrer variable for the source classification, but remove the referrer property from the 'Groovy Share Link Clicked' payload. The payload is only { source: referrerSource, embed: ... }.
4. Per scope item 5, in src/components/ErrorBoundary.tsx: remove the direct window.BaharAnalytics block. Import trackError from '../utils/analytics' and call trackError('React Error Boundary', error.name || 'Error', errorInfo.componentStack ?? 'unknown'). The component stack holds only component names and source locations, so it stays. Do not send error.message. Update the comment above the call in ASD-STE100 style.
5. Run grep -rn "BaharAnalytics" src and confirm only src/utils/analytics.ts (and analytics.test.ts) reference it.
  </action>
  <verify>
    <automated>cd /Users/adar/Code/groovy && npx tsc -b && grep -rln "BaharAnalytics" src | grep -v "src/utils/analytics" | wc -l | grep -x " *0" && ! grep -n "referrer: referrer" src/App.tsx</automated>
  </verify>
  <done>tsc -b passes. No file outside src/utils/analytics*.ts references BaharAnalytics. App.tsx share-link payload has no referrer key. ErrorBoundary sends error.name through the gated wrapper.</done>
</task>

<task type="auto">
  <name>Task 3: Opt-out toggle in AboutModal and shortener disclosure in ShareModal</name>
  <files>src/components/production/AboutModal.tsx, src/components/production/ShareModal.tsx, src/components/production/ShareModal.test.tsx</files>
  <action>
1. Per scope item 7, in src/components/production/AboutModal.tsx: import isAnalyticsOptedOut and setAnalyticsOptOut from '../../utils/analytics'. Add state shareUsage initialised from !isAnalyticsOptedOut(). Add a handler that flips the value, calls setAnalyticsOptOut(!next), and sets state. Render a small labelled checkbox "Share anonymous usage statistics" inside the footer block (the bordered div with the version line), above the copyright line. Use a native input type="checkbox" with a matching htmlFor/id label, text-sm, and the same isDark purple accent style as the debug button (for example accent-purple-600). No reload is needed, because isAnalyticsEnabled() reads the key on every event.
2. Per scope item 8, in src/components/production/ShareModal.tsx: directly below the "Shorten URL" button (around lines 267-279), add one short muted text line (text-xs, slate color matching nearby helper text): "Shortening sends this link to an external service (go.bahar.co.il)." Render it with the button, so it shows only where the button shows.
3. Run npx vitest run src/components/production/ShareModal.test.tsx. Edit ShareModal.test.tsx only if an existing assertion breaks (for example a getByText that now matches two elements). Do not add new ShareModal tests.
  </action>
  <verify>
    <automated>cd /Users/adar/Code/groovy && npx vitest run && npx tsc -b && npm run lint</automated>
  </verify>
  <done>About modal shows a working "Share anonymous usage statistics" checkbox that persists the opt-out. ShareModal shows the go.bahar.co.il disclosure next to Shorten URL. Full test suite, tsc -b, and lint pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser -> third-party analytics (BaharAnalytics / Amplitude) | Event payloads leave the user's device |
| browser -> go.bahar.co.il shortener | The full groove URL leaves the device on user action |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-148-01 | I | trackGrooveSave/Load/Delete | mitigate | Send has_name boolean, not the user-typed name |
| T-148-02 | I | trackMIDIDevice* | mitigate | Remove device_id (stable hardware identifier) |
| T-148-03 | I | App.tsx share-link event | mitigate | Drop document.referrer; send only classified source |
| T-148-04 | I | ErrorBoundary | mitigate | Send error.name through gated trackError, not error.message |
| T-148-05 | S | isAnalyticsEnabled host check | mitigate | Exact match or '.'+domain suffix via isAnalyticsHost, unit tested |
| T-148-06 | I | All tracking | mitigate | User opt-out key 'groovy-analytics-disabled' checked on every event |
| T-148-07 | I | URL shortener | mitigate | Visible disclosure line next to Shorten URL |
| T-148-08 | I | Amplitude Session Replay | accept | Out of scope; configured outside this repo |
</threat_model>

<verification>
- npx vitest run passes (includes new src/utils/analytics.test.ts)
- npx tsc -b passes
- npm run lint passes
- grep -rn "trackMIDIHit\|trackMIDITimingSessionEnd\|device_id" src returns nothing
- grep -rn "BaharAnalytics" src returns only src/utils/analytics.ts and src/utils/analytics.test.ts
</verification>

<success_criteria>
All nine scope items from the user are implemented. No user-typed groove names, device IDs, referrer URLs or error messages go to analytics. The domain check is strict and tested. Users can opt out from the About modal and the opt-out takes effect without reload. The shortener disclosure is visible.
</success_criteria>

<output>
After completion, create `.planning/quick/261103-mxb-analytics-privacy-fixes-for-issue-148/261103-mxb-SUMMARY.md`
</output>
