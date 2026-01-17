# 🔒 Remove Exposed Service Role Key from Documentation

## The Issue
Your Supabase service role key is exposed in multiple `.md` documentation files.

## Solution: Remove All Instances

After you've rotated the key in Supabase (see `SECURITY_FIX_URGENT.md`), you should remove the old key from documentation files.

### Option 1: Search and Replace (Recommended)

1. **In your code editor**, search for:
   ```
   sb_secret_oIPr01I9ubUelbOqAWsNJA_AZTyjFhX
   ```

2. **Replace with:**
   ```
   YOUR_NEW_KEY_HERE
   ```
   (Or just remove the entire line if it's in a code example)

3. **Review each file** to make sure you're not breaking anything

### Option 2: Remove from Specific Files

The key appears in these files (based on search results):
- `RAILWAY_FIX_CHECKLIST.md`
- `RENAME_VARIABLE_FIX.md`
- `BOTH_DEPLOY_FROM_GITHUB.md`
- `RENAME_BOTH_VARIABLES.md`
- `VARIABLES_NOT_DETECTED.md`
- `VERIFY_SUPABASE_VARIABLES.md`
- `RAILWAY_SECRET_ERROR_FIX.md`
- `RAILWAY_VARIABLES_NOT_WORKING.md`
- `FIND_PROJECT_BY_URL.md`
- `ADD_BOTH_SUPABASE_VARS.md`
- And many more...

**For each file:**
1. Find the line with `sb_secret_oIPr01I9ubUelbOqAWsNJA_AZTyjFhX`
2. Replace with: `[YOUR_SUPABASE_SERVICE_ROLE_KEY]` or remove it entirely
3. Update the text to say "paste your key here" instead of showing the actual key

### Example Fix

**Before:**
```markdown
- `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_oIPr01I9ubUelbOqAWsNJA_AZTyjFhX`
```

**After:**
```markdown
- `SUPABASE_SERVICE_ROLE_KEY` = `[paste your service role key from Supabase]`
```

## Important Notes

1. **Don't commit the new key** - only use it in Railway Variables
2. **The old key is already exposed** - that's why you need to rotate it
3. **After rotation**, the old key won't work anyway
4. **Focus on security going forward** - never put secrets in docs

## After Cleanup

1. **Commit the changes** (removing old key from docs)
2. **Push to GitHub** (the old key will still be in git history, but at least it's invalid now)
3. **Consider making the repo private** if it's currently public

---

**The most important step is rotating the key in Supabase - the old key will be useless after that!**
