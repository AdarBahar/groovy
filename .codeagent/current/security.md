# Security

Security considerations, authentication, permissions, secrets handling, and threat notes.

---

## Current Security Posture

**Status**: Static client-side application with no backend or authentication. Hardened with CSP headers, safe DOM manipulation, and defensive coding practices.

**Risk Level**: Low (no sensitive data, no user accounts, no backend)

**Last Security Audit**: 2026-01-14 (comprehensive review completed)

**Security Improvements (2026-01-14)**:
- ✅ All CVE vulnerabilities patched (React Router 7.12.0)
- ✅ XSS vectors eliminated (no unsafe innerHTML)
- ✅ CSP headers implemented
- ✅ Rate limiting on audio playback
- ✅ localStorage quota handling
- ✅ Error boundary for crash prevention

**Security Improvements (2026-01-17)**:
- ✅ SVG sanitization with DOMPurify (Issue #60)
- ✅ URL parameter validation with Zod schemas (Issue #61)

---

## Authentication & Authorization

### Current (None)
- No user accounts
- No authentication required
- No authorization checks
- Fully public application

### Future Considerations (If User Accounts Added)
- **Recommended**: Firebase Authentication or Auth0
- **MFA**: Enable multi-factor authentication
- **Session Management**: Use secure, httpOnly cookies
- **Password Policy**: Enforce strong passwords (if using email/password)

---

## Data Storage

### Current
- **localStorage**: Used for saved grooves, debug mode, theme preference
- **Safe Storage**: Quota handling with auto-cleanup (src/utils/safeStorage.ts)
- **No cookies**: Session data stored in memory only
- **No sensitive data**: Only drum patterns and preferences

### Future Considerations (If Saving Patterns)
- **Client-Side Storage**: Use localStorage for non-sensitive data only
- **Cloud Storage**: Use Firebase Firestore or similar
- **Encryption**: Encrypt sensitive data at rest
- **Data Retention**: Define clear retention policies

---

## API Security (Future)

### If Backend API Added
- **HTTPS Only**: Enforce TLS 1.2+ for all connections
- **CORS**: Configure strict CORS policies
- **Rate Limiting**: Prevent abuse (e.g., 100 requests/minute per IP)
- **Input Validation**: Sanitize all user inputs
- **Output Encoding**: Prevent XSS attacks
- **Authentication**: Use JWT or session tokens
- **Authorization**: Implement role-based access control (RBAC)

---

## Secrets Management

### Current
- **Environment Variables**: `.env.example` template provided
  - `VITE_ANALYTICS_DOMAIN` - Analytics domain (default: bahar.co.il)
  - `VITE_ANALYTICS_SCRIPT_URL` - Analytics script URL
  - All use `VITE_` prefix for client-side exposure
- **No sensitive secrets**: Only public configuration values
- **.gitignore**: Includes `.env.local` and `.env*.local`

### Future Considerations
- **Backend Secrets**: Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- **API Keys**: Rotate regularly, use least-privilege access

---

## Content Security Policy (CSP)

### Current (Implemented 2026-01-14)

**Location**: `.htaccess` file

**Policy**:
```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.bahar.co.il; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self'; connect-src 'self' https://www.bahar.co.il https://bahar.co.il https://api.amplitude.com https://api.eu.amplitude.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self';"
```

**Directives**:
- `default-src 'self'` - Only allow resources from same origin
- `script-src 'self' 'unsafe-inline' https://www.bahar.co.il` - Scripts from self and analytics
- `style-src 'self' 'unsafe-inline'` - Styles with inline support for Tailwind
- `img-src 'self' data: blob:` - Images including data URIs and blobs
- `media-src 'self'` - Audio/video from same origin
- `connect-src 'self' https://...` - API connections to analytics
- `font-src 'self' data:` - Fonts including data URIs
- `object-src 'none'` - No Flash/plugins
- `base-uri 'self'` - Prevent base tag injection
- `form-action 'self'` - Forms only submit to same origin

**Note**: `'unsafe-inline'` required for Tailwind CSS and React inline styles. Consider migrating to nonce-based CSP in future.

---

## Cross-Site Scripting (XSS)

### Current Mitigations (Updated 2026-01-17)
- **React**: Automatically escapes user input in JSX
- **No `dangerouslySetInnerHTML`**: Not used anywhere
- **No `eval()`**: Not used anywhere
- **Safe DOM Manipulation**: All innerHTML replaced with safe methods
  - `PrintPreviewModal.tsx`: Uses `cloneNode()` and `createElement()`
  - `ABCRenderer.ts`: Uses `XMLSerializer` and `removeChild()` loops
- **CSP Headers**: Restricts script sources and inline execution
- **Content Sanitization**: User input validated before storage
- **SVG Sanitization**: DOMPurify sanitizes all generated SVG content
  - `ExportUtils.ts`: `sanitizeSVG()` function with SVG profile
  - `escapeXml()` removes control characters and escapes special chars

### Best Practices
- Always use JSX for rendering user input
- Sanitize any HTML if `dangerouslySetInnerHTML` is needed
- Validate and escape all user inputs

---

## Input Validation

### URL Parameter Validation (Updated 2026-01-17)

**Location**: `src/core/GrooveURLCodec.ts`

All URL parameters are validated using Zod schemas before processing:

| Parameter | Validation | Default |
|-----------|------------|---------|
| Tempo | 20-400 BPM | 120 |
| Swing | 0-100% | 0 |
| Measures | 1-32 | 1 |
| Division | 4, 8, 12, 16, 24, 32, 48 | 16 |
| Time Signature | Format: `n/n`, beats 1-16, note value 4/8/16 | 4/4 |
| Title | Max 200 characters | - |
| Author | Max 100 characters | - |
| Comments | Max 1000 characters | - |
| Voice Patterns | Max 2000 chars, alphanumeric + `\|-` only | - |

**Implementation**:
- Uses Zod schemas for type-safe validation
- Invalid values silently fall back to safe defaults
- Pattern validation uses regex whitelist: `/^[|a-zA-Z0-9\-]*$/`

**Example**:
```typescript
// Malicious URL params are safely handled
decodeURLToGroove('?Tempo=999999')  // → tempo: 400 (clamped to max)
decodeURLToGroove('?Div=invalid')   // → division: 16 (default)
decodeURLToGroove('?H=<script>')    // → pattern ignored (invalid chars)
```

---

## Cross-Site Request Forgery (CSRF)

### Current (N/A)
- No backend API, so no CSRF risk

### Future Considerations (If Backend Added)
- Use CSRF tokens for state-changing requests
- Implement SameSite cookie attribute
- Verify Origin/Referer headers

---

## Dependency Security

### Current Practices
- Use `npm audit` to check for vulnerabilities
- Keep dependencies up to date

### Recommended Workflow
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities (automatic)
npm audit fix

# Fix vulnerabilities (force, may break things)
npm audit fix --force

# Check for outdated packages
npm outdated
```

### Automated Scanning
- **Dependabot**: Enable on GitHub (auto-creates PRs for updates)
- **Snyk**: Continuous vulnerability monitoring
- **GitHub Security Alerts**: Enable in repo settings

---

## Web Audio API Security

### Considerations
- **User Interaction Required**: Web Audio API requires user gesture before playing audio (prevents auto-play abuse)
- **Sample Loading**: Samples loaded from `/public/sounds/` (trusted source)
- **No User-Uploaded Samples**: Currently no risk of malicious audio files

### Future (If User Uploads Allowed)
- Validate file types (only allow .mp3, .wav, .ogg)
- Scan for malware
- Limit file size (e.g., max 5MB per sample)
- Use Content-Type validation

---

## Client-Side Security

### Current Practices
- **No Inline Scripts**: All JavaScript in bundled files
- **No `eval()`**: Not used
- **No `Function()` constructor**: Not used
- **React**: Automatic XSS protection

### Browser Security Features
- **HTTPS**: Required for production (enforced by hosting platforms)
- **Secure Cookies**: Not used (no cookies)
- **SameSite**: Not applicable (no cookies)

---

## Third-Party Integrations

### Current (None)
- No analytics
- No error tracking
- No CDNs
- No external APIs

### Future Considerations
- **Analytics**: Use privacy-focused analytics (Plausible, Fathom)
- **Error Tracking**: Use Sentry with data scrubbing
- **CDNs**: Use Subresource Integrity (SRI) for CDN resources

---

## Threat Model

### Current Threats (Low Risk)
1. **XSS**: Mitigated by React's automatic escaping
2. **Dependency Vulnerabilities**: Mitigated by `npm audit`
3. **Supply Chain Attacks**: Mitigated by using trusted packages

### Future Threats (If Features Added)
1. **Account Takeover**: If user accounts added
2. **Data Breach**: If user data stored
3. **API Abuse**: If backend API added
4. **CSRF**: If state-changing API endpoints added
5. **Injection Attacks**: If database added

---

## Incident Response Plan (Future)

### If Security Incident Occurs
1. **Identify**: Detect and confirm the incident
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Lessons Learned**: Document and improve

### Contacts
- **Developer**: Adar Bahar (adar.bahar@gmail.com)
- **GitHub**: https://github.com/AdarBahar/groovy

---

## Compliance (Future)

### If User Data Collected
- **GDPR**: EU data protection regulation
- **CCPA**: California Consumer Privacy Act
- **Privacy Policy**: Required if collecting user data
- **Terms of Service**: Recommended for all web apps

---

## Security Checklist

### Before Production Deployment
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Enable HTTPS (enforced by hosting platform)
- [ ] Configure CSP headers (if needed)
- [ ] Remove console.log statements with sensitive data
- [ ] Verify no secrets in codebase
- [ ] Enable Dependabot on GitHub
- [ ] Test in multiple browsers (Chrome, Firefox, Safari)
- [ ] Check for XSS vulnerabilities (manual testing)

### Ongoing
- [ ] Monitor `npm audit` regularly
- [ ] Update dependencies monthly
- [ ] Review security advisories for dependencies
- [ ] Monitor error logs (if error tracking added)

---

## Resources

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **React Security**: https://react.dev/learn/security
- **Vite Security**: https://vitejs.dev/guide/security.html
- **npm Security**: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities

---

## Notes

- This is a client-side application with no backend, so many security concerns don't apply yet
- Security posture will need to be re-evaluated if/when backend, user accounts, or data storage are added
- Always follow principle of least privilege
- Defense in depth: multiple layers of security
