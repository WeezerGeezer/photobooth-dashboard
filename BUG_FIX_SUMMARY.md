# Bug Fix Summary

## Issue
**Error:** `Uncaught ReferenceError: process is not defined` on http://localhost:3000/

**Location:** `client/src/services/api.ts:3`

**Cause:** Using `process.env` in browser code, which is not available in Vite's development environment without specific configuration.

---

## Solution

Changed environment variable access from Node.js-style to Vite-style:

### Before (Broken)
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA !== 'false';
```

### After (Fixed)
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';
```

---

## What Changed

1. **Environment Variable Access:**
   - Old: `process.env.REACT_APP_*`
   - New: `import.meta.env.VITE_*`

2. **Why:**
   - Vite uses `import.meta.env` for environment variables in browser code
   - `process.env` is Node.js only and not available in the browser
   - Environment variables must be prefixed with `VITE_` to be accessible

3. **How Vite Handles This:**
   - Vite automatically injects `import.meta.env` at build/dev time
   - Variables are statically replaced
   - No need for `.env.local` file for defaults (fallback || works fine)

---

## Testing

✅ **Dashboard Now Loads Successfully**

1. Page loads without error
2. Console shows "Using mock data - API unavailable"
3. All 15 mock booths display
4. Sidebar filters work
5. Booth cards render with metrics
6. Detail page loads when clicked
7. Charts display historical data

---

## Environment Variable Names

If you want to customize these in the future, use:

```env
# In .env.local or environment
VITE_API_URL=http://localhost:3001/api
VITE_USE_MOCK_DATA=true
```

The `VITE_` prefix is required for Vite to expose them to the frontend.

---

## Git Commit

```
299f9a8 Fix: Use import.meta.env instead of process.env for Vite environment variables
```

---

## Dashboard Status

✅ **Now Working** - Visit http://localhost:3000/

All features are functional:
- Dashboard displays 15 mock booths
- Sidebar navigation working
- Filters responsive
- Booth detail pages load
- Charts render correctly
- No console errors

---

## Files Modified

- `client/src/services/api.ts` - Lines 5-6

---

## Notes

This is a common issue when:
- Creating React apps with Vite instead of Create React App
- Using environment variables in browser code
- Moving from CRA to Vite

The fix is simple: always use `import.meta.env` in Vite projects for browser code.

For Node.js code (like in the backend), `process.env` is correct.
