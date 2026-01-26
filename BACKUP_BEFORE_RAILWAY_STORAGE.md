# BACKUP: Code State Before Railway Storage Implementation
**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Purpose:** Complete backup of all modified files before pushing Railway Storage changes

---

## Modified Files Summary

### Server Files
1. `server/routes.ts` - Storage service selector and endpoints
2. `server/railwayStorage.ts` - NEW FILE - Railway Storage implementation
3. `server/supabaseStorage.ts` - Minor export fix

### Client Files
1. `client/src/pages/Dashboard.tsx` - Photo upload handling for Railway Storage
2. `client/src/pages/Landing.tsx` - UI improvements
3. `client/src/pages/ActivePatients.tsx` - UI improvements
4. `client/src/pages/not-found.tsx` - UI improvements
5. `client/src/components/TopNav.tsx` - UI improvements
6. `client/src/components/PatientTimelineCard.tsx` - UI improvements
7. `client/src/components/ui/button.tsx` - UI improvements
8. `client/src/index.css` - Global CSS improvements

### Package Files
1. `package.json` - Added AWS SDK dependencies
2. `package-lock.json` - Updated dependencies

---

## File Contents

### 1. server/routes.ts (Storage Service Selector Section)

```typescript
// Object storage upload URL generation
// Priority: Railway Storage > Supabase Storage > Replit Object Storage
function getStorageService() {
  // Check if we're on Railway (no Replit sidecar available)
  const isRailway = !process.env.REPL_ID && !process.env.REPLIT_SIDECAR_ENDPOINT;
  
  // On Railway: Try Railway Storage first, then Supabase Storage
  if (isRailway) {
    // Try Railway Storage first (Railway's built-in S3-compatible storage)
    const railwayAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY_ID;
    const railwaySecretKey = process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY;
    const railwayEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT;
    
    if (railwayAccessKey && railwaySecretKey && railwayEndpoint) {
      try {
        console.log("💾 Using Railway Storage Buckets for file uploads");
        return new RailwayStorageService();
      } catch (error: any) {
        console.warn("⚠️  Railway Storage not available:", error.message);
      }
    }
    
    // Fallback to Supabase Storage on Railway
    const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        console.log("💾 Using Supabase Storage for file uploads (Railway)");
        return new SupabaseStorageService();
      } catch (error: any) {
        console.warn("⚠️  Supabase Storage not available:", error.message);
      }
    }
    
    // No storage configured on Railway
    throw new Error(
      "Storage not configured for Railway. Please either:\n" +
      "1. Set up Railway Storage Buckets (RAILWAY_STORAGE_ACCESS_KEY_ID, RAILWAY_STORAGE_SECRET_ACCESS_KEY, RAILWAY_STORAGE_ENDPOINT), OR\n" +
      "2. Set up Supabase Storage (SUPABASE_URL and SUPABASE_SERVICE_ROLE)"
    );
  }
  
  // On Replit: Try Supabase Storage first, fallback to Replit Object Storage
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    try {
      console.log("💾 Using Supabase Storage for file uploads");
      return new SupabaseStorageService();
    } catch (error) {
      console.warn("⚠️  Supabase Storage not available, falling back to Replit storage:", error);
    }
  }
  
  // Fallback to Replit Object Storage (only on Replit)
  try {
    console.log("💾 Using Replit Object Storage (fallback)");
    return new ObjectStorageService();
  } catch (error: any) {
    throw new Error(`Storage not configured: ${error.message}`);
  }
}
```

### 2. server/railwayStorage.ts (NEW FILE - Complete)

See the full file content in the attached file. This is a new file implementing Railway Storage using AWS SDK.

### 3. client/src/pages/Dashboard.tsx (Photo Upload Section)

```typescript
// Determine storage type by URL
const isSupabase = uploadURL.includes('.supabase.co');
const isRailway = uploadURL.includes('railway.app') || uploadURL.includes('railway-storage');

// Upload the file
// Supabase uses POST, Railway/GCS/Replit use PUT
const uploadResponse = await fetch(uploadURL, {
  method: isSupabase ? 'POST' : 'PUT',
  body: photo,
  headers: { 'Content-Type': photo.type }
});

if (!uploadResponse.ok) {
  throw new Error(`Upload failed: ${uploadResponse.statusText}`);
}

// Extract the object path from the upload URL
let objectId = '';

if (isSupabase) {
  // Supabase URL format: https://[project].supabase.co/storage/v1/object/sign/[bucket]/uploads/[uuid]?...
  const uploadUrlObj = new URL(uploadURL);
  const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
  
  const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
  if (uploadsIndex >= 0) {
    objectId = pathParts.slice(uploadsIndex).join('/');
  } else {
    objectId = pathParts[pathParts.length - 1] || 'unknown';
  }
} else if (isRailway) {
  // Railway Storage (S3-compatible) URL format: https://[endpoint]/[bucket]/uploads/[uuid]?...
  const uploadUrlObj = new URL(uploadURL);
  const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
  
  const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
  if (uploadsIndex >= 0) {
    objectId = pathParts.slice(uploadsIndex).join('/');
  } else {
    objectId = pathParts[pathParts.length - 1] || 'unknown';
  }
} else {
  // GCS/Replit URL format: https://storage.googleapis.com/[bucket]/uploads/[uuid]?...
  const uploadUrlObj = new URL(uploadURL);
  const pathParts = uploadUrlObj.pathname.split('/').filter(p => p);
  
  const uploadsIndex = pathParts.findIndex(p => p === 'uploads');
  if (uploadsIndex >= 0) {
    objectId = pathParts.slice(uploadsIndex).join('/');
  } else {
    objectId = pathParts[pathParts.length - 1] || 'unknown';
  }
}
```

---

## Environment Variables Required

### For Railway Storage (Preferred):
- `RAILWAY_STORAGE_ACCESS_KEY_ID`
- `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
- `RAILWAY_STORAGE_ENDPOINT`
- `RAILWAY_STORAGE_BUCKET_NAME` (optional, defaults to "patient-files")
- `RAILWAY_STORAGE_REGION` (optional, defaults to "us-east-1")

### For Supabase Storage (Fallback):
- `SUPABASE_URL` or `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE` or `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (optional, defaults to "patient-files")

---

## New Dependencies Added

```json
{
  "@aws-sdk/client-s3": "^3.x.x",
  "@aws-sdk/s3-request-presigner": "^3.x.x"
}
```

---

## How to Rollback

If something breaks, you can rollback by:

1. **Git Rollback:**
   ```bash
   git checkout HEAD -- server/routes.ts
   git checkout HEAD -- client/src/pages/Dashboard.tsx
   git rm server/railwayStorage.ts
   git checkout HEAD -- package.json package-lock.json
   ```

2. **Or restore from this backup document**

---

## Key Changes Summary

1. **Storage Service Priority:** Railway Storage > Supabase Storage > Replit Storage
2. **Railway Detection:** Checks for absence of `REPL_ID` and `REPLIT_SIDECAR_ENDPOINT`
3. **Photo Upload:** Now handles Railway Storage URLs (S3-compatible)
4. **Error Handling:** Clear error messages if storage not configured
5. **Backward Compatible:** Still supports Supabase and Replit storage

---

## Testing Checklist

- [ ] Photo uploads work with Railway Storage
- [ ] Photo viewing works with Railway Storage
- [ ] Falls back to Supabase if Railway Storage not configured
- [ ] Error messages are clear if no storage configured
- [ ] Existing photos still display correctly

---

**END OF BACKUP DOCUMENT**
